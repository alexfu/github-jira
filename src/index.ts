import { Command, flags } from "@oclif/command"
import cli from "cli-ux"
import { Repository } from "nodegit"
import { JiraClient } from "./jiraClient"
import { GitHubClient } from "./githubClient"

class GithubJiraPr extends Command {
  static description = "Create GitHub PRs from JIRA tickets"
  static flags = {
    "help": flags.help({ char: "h" }),
    "base-branch": flags.string({ char: "b", description: "base branch for PR" }),
    "ticket-id": flags.string({ char: "t", description: "jira ticket ID" }),
    "jira-host": flags.string({ description: "custom host for jira" }),
    "jira-email": flags.string({ description: "email address associated with jira" }),
    "jira-access-token": flags.string({ description: "jira access token" }),
    "github-access-token": flags.string({ description: "github access token" }),
    "pr-title": flags.string({ description: "custom PR title" }),
    "interactive": flags.boolean({ char: "i", description: "interactive mode", default: false })
  }

  private interactive: boolean = false

  async run() {
    const {flags} = this.parse(GithubJiraPr)
    this.interactive = flags["interactive"]

    // JIRA
    const jiraUser = await this.getFlagValue(flags, "jira-email")
    const jiraAccessToken = await this.getFlagValue(flags, "jira-access-token")
    const jiraHost = await this.getFlagValue(flags, "jira-host", "jira.atlassian.com")
    const jiraTicketId = await this.getFlagValue(flags, "ticket-id")
    const jiraTicket = await this.getJiraTicket(jiraAccessToken, jiraHost, jiraUser, jiraTicketId)

    // GitHub
    const baseBranch = await this.getFlagValue(flags, "base-branch", "master")
    const githubAccessToken = await this.getFlagValue(flags, "github-access-token")
    const prTitle = await this.getFlagValue(flags, "pr-title", jiraTicket.fields.summary)
    const prTitleWithTicketId = this.createPRTitle(prTitle, jiraTicket)
    const prDescription = this.createPRDescription(jiraHost, jiraTicket)
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

  private async getFlagValue(flags: any, flag: string, defaultValue?: any) {
    const value = flags[flag]
    if (value) {
      return value
    } else if (this.interactive) {
      return await cli.prompt(flag, { required: defaultValue === undefined, default: defaultValue })
    } else {
      return defaultValue || this.error(`Missing --${flag} flag!`)
    }
  }
}

export = GithubJiraPr
