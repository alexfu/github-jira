import { flags } from "@oclif/command"
import cli from "cli-ux"
import { Repository, Reference } from "nodegit"
import { JiraClient } from "../jiraClient"
import { GitHubClient } from "../githubClient"
import * as inquirer from "inquirer"
import BaseCommand from "../BaseCommand"

export default class Pr extends BaseCommand {
    static description = "Create GitHub PRs from JIRA tickets"
    static flags = {
        "help": flags.help({ char: "h" }),
        "interactive": flags.boolean({ char: "i", description: "interactive mode", default: false }),
        "base-branch": flags.string({ char: "b", description: "base branch for pull request" }),
        "ticket-id": flags.string({ char: "t", description: "Jira ticket ID" }),
        "pr-title": flags.string({ description: "custom pull request title" }),
        "draft": flags.boolean({ description: "make a draft pull request" }),
        "description": flags.string({ description: "custom pull request description" })
    }

    async run() {
        const { flags } = this.parse(Pr)
        const config = await this.getConfig()

        // Jira

        if (flags.interactive) {
          if (!flags["ticket-id"]) {
            const validator = (value: string) => {
              if (value) {
                return true
              }
              return "Jira ticket ID must not be empty"
            }
            flags["ticket-id"] = await this.promptInput("Jira ticket ID", undefined, validator)
          }
        }

        const jiraTicketId = flags["ticket-id"] || this.error("Missing ticket ID!")
        const jiraTicket = await this.getJiraTicket(config.jiraAccessToken, config.jiraHost, config.jiraEmail, jiraTicketId)
        const jiraTicketURL = `https://${config.jiraHost}/browse/${jiraTicket.key}`

        // Github

        if (flags.interactive) {
          if (!flags["base-branch"]) {
            const result: any = await inquirer.prompt({
              name: "baseBranch",
              message: "Base branch",
              type: "list",
              choices: await this.getGitBranches()
            })
            flags["base-branch"] = result.baseBranch
          }

          if (!flags["pr-title"]) {
            flags["pr-title"] = await this.promptInput("Custom pull request title", jiraTicket.fields.summary)
          }

          if (!flags.draft) {
            flags.draft = await this.promptConfirm("Draft pull request?")
          }

          if (!flags.description) {
            flags.description = await this.promptInput("Pull request description")
          }
        }

        const baseBranch = flags["base-branch"] || this.error("Missing base branch!")
        const prTitle = `[${jiraTicket.key}] ${flags["pr-title"] || jiraTicket.fields.summary}`
        const prDescription = flags.description ? `${flags.description}\n${jiraTicketURL}` : jiraTicketURL
        const draft = flags.draft

        try {
          const pr = await this.makePullRequest(config.githubAccessToken, baseBranch, prTitle, prDescription, draft)
          this.log(pr.html_url)
        } catch (error) {
          console.error(error.message)
          console.log(error.response.data)
        }
    }

    private async promptInput(message: string, defaultValue?: string, validator?: (value:string) => string | boolean): Promise<string> {
      const response: any = await inquirer.prompt({
        name: "result",
        message: message,
        type: "input",
        default: defaultValue,
        validate: validator
      })
      return response.result
    }

    private async promptConfirm(message: string, defaultValue?: boolean): Promise<boolean> {
      const response: any = await inquirer.prompt({
        name: "result",
        message: message,
        type: "confirm",
        default: defaultValue || false
      })
      return response.result
    }

    private async getGitBranches(): Promise<{}[]> {
        const repo = await Repository.open(".")
        const references = await repo.getReferences()
        return references
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
}
