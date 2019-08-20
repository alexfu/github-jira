import {Command, flags} from "@oclif/command"
import cli from "cli-ux"
import { Repository, Reference } from "nodegit"
import { JiraClient } from "../jiraClient"
import { GitHubClient } from "../githubClient"
import * as inquirer from "inquirer"
import BaseCommand from "../base"

export default class Pr extends BaseCommand {
    static description = "Create GitHub PRs from JIRA tickets"
    static flags = {
        ...BaseCommand.flags,
        "help": flags.help({ char: "h" }),
        "base-branch": flags.string({ char: "b", description: "base branch for PR" }),
        "ticket-id": flags.string({ char: "t", description: "jira ticket ID" }),
        "pr-title": flags.string({ description: "custom PR title" }),
        "draft": flags.boolean({ description: "draft PR" }),
        "description": flags.string({ description: "PR description" })
    }

    async run() {
        const {flags} = this.parse(Pr)
        await this.parseBaseFlags(flags)

        // JIRA
        const jiraTicketId = await this.getFlagValue2(flags, "ticket-id", this.valuePrompter())
        const jiraTicket = await this.getJiraTicket(this.jiraAccessToken, this.jiraHost, this.jiraUser, jiraTicketId)

        // GitHub
        const baseBranch = await this.getFlagValue2(flags, "base-branch", this.listPrompter(this.branchChoiceProvider), "master")
        const githubAccessToken = await this.getFlagValue2(flags, "github-access-token", this.valuePrompter())
        const prTitle = await this.getFlagValue2(flags, "pr-title", this.valuePrompter(jiraTicket.fields.summary), jiraTicket.fields.summary)
        const draft = await this.getFlagValue2(flags, "draft", this.confirmPrompter(false), false)

        let description: string
        if (flags.interactive) {
          // Ask if user wants to input a description
          const answer = await inquirer.prompt([{ name: "writeDescription", message: "Would you like to enter a description?", type: "confirm", default: false}])
          if ((<any>answer).writeDescription) {
            description = await this.getFlagValue2(flags, "description", this.editorPrompter(), "")
          } else {
            description = ""
          }
        } else {
          description = await this.getFlagValue2(flags, "description", this.editorPrompter(), "")
        }

        const prTitleWithTicketId = this.createPRTitle(prTitle, jiraTicket)
        const prDescription = this.createPRDescription(jiraTicket, description)

        try {
          const pr = await this.makePullRequest(githubAccessToken, baseBranch, prTitleWithTicketId, prDescription, draft)
          this.log(pr.html_url)
        } catch (error) {
          console.error(error.message)
          console.log(error.response.data)
        }
    }

    private async branchChoiceProvider(): Promise<{}[]> {
        const repo = await Repository.open(".");
        return (await repo.getReferences(Reference.TYPE.LISTALL))
          .filter((ref) => { return ref.isBranch(); })
          .map((ref) => { return {name: ref.shorthand()} });
    }

    private async getJiraTicket(accessToken: string, host: string, username: string, ticketId: string) {
        let jiraClient = new JiraClient({
          username: username,
          accessToken: accessToken,
          host: host
        })

        cli.action.start("Fetching JIRA ticket")
        const jiraTicket = await jiraClient.getJiraTicket(ticketId)
        cli.action.stop("done")

        return jiraTicket
      }

      private async makePullRequest(accessToken: string, base: string, title: string, description: string, draft: boolean) {
        let githubClient = new GitHubClient(accessToken)

        cli.action.start("Making pull request")
        const result = await githubClient.openPullRequest({
          repo: await Repository.open("."),
          title: title,
          description: description,
          base: base,
          draft: draft
        })
        cli.action.stop("done")

        return result
      }

      private createPRTitle(title: string, jiraTicket: any) {
        return `[${jiraTicket.key}] ${title}`
      }

      private createPRDescription(jiraTicket: any, customDescription?: string) {
          const jiraUrl = `https://${this.jiraHost}/browse/${jiraTicket.key}`
          if (customDescription !== undefined && customDescription.length > 0) {
            return `${customDescription}\n${jiraUrl}`
          } else {
              return jiraUrl
          }
      }
}
