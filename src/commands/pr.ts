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
        "pr-title": flags.string({ description: "custom PR title" })
    }

    async run() {
        await super.run()
        const {flags} = this.parse(Pr)

        // JIRA
        const jiraTicketId = await this.getFlagValue(flags, "ticket-id")
        const jiraTicket = await this.getJiraTicket(this.jiraAccessToken, this.jiraHost, this.jiraUser, jiraTicketId)

        // GitHub
        var baseBranch = "master";
        if (this.interactive) {
          const repo = await Repository.open(".");
          const branches = (await repo.getReferences(Reference.TYPE.LISTALL))
            .filter((ref) => { return ref.isBranch(); })
            .map((ref) => { return {name: ref.shorthand()} });
          const answer = await inquirer.prompt([{name: "branch", message: "base-branch", type: "list", choices: branches}]);
          baseBranch = (<any>answer).branch;
        } else {
          baseBranch = await this.getFlagValue(flags, "base-branch", "master")
        }

        const githubAccessToken = await this.getFlagValue(flags, "github-access-token")
        const prTitle = await this.getFlagValue(flags, "pr-title", jiraTicket.fields.summary)
        const prTitleWithTicketId = this.createPRTitle(prTitle, jiraTicket)
        const prDescription = this.createPRDescription(this.jiraHost, jiraTicket)
        const pr = await this.makePullRequest(githubAccessToken, baseBranch, prTitleWithTicketId, prDescription)

        this.log(pr.html_url)
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

      private async makePullRequest(accessToken: string, base: string, title: string, description: string) {
        let githubClient = new GitHubClient(accessToken)

        cli.action.start("Making pull request")
        const result = await githubClient.openPullRequest({
          repo: await Repository.open("."),
          title: title,
          description: description,
          base: base
        })
        cli.action.stop("done")

        return result
      }

      private createPRTitle(title: string, jiraTicket: any) {
        return `[${jiraTicket.key}] ${title}`
      }

      private createPRDescription(jiraHost: string, jiraTicket: any) {
        return `https://${jiraHost}/browse/${jiraTicket.key}`
      }
}
