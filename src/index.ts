import { Command, flags } from '@oclif/command'
import cli from 'cli-ux'
import { Repository } from 'nodegit'
import { JiraClient } from './jiraClient'
import { GitHubClient } from './githubClient'

class GithubJiraPr extends Command {
  static description = 'Create GitHub PRs from JIRA tickets'
  static flags = {
    "help": flags.help({ char: 'h' }),
    "base-branch": flags.string({ char: 'b', description: 'base branch for PR' }),
    "ticket-id": flags.string({ char: 't', description: 'jira ticket ID' }),
    "jira-host": flags.string({ description: 'custom host for jira (i.e. mycompany.atlassian.net)' }),
    "jira-email": flags.string({ description: 'email address associated with jira' }),
    "jira-access-token": flags.string({ description: 'jira access token' }),
    "github-access-token": flags.string({ description: 'github access token' }),
    "pr-title": flags.string({ description: 'custom PR title' }),
    "interactive": flags.boolean({ char: "i", description: "interactive mode", default: false })
  }

  private interactive: boolean = false

  async run() {
    const {flags} = this.parse(GithubJiraPr)
    this.interactive = flags["interactive"]

    // JIRA
    const jiraUser = flags["jira-email"] || await this.promptForFlag("jira-email")
    const jiraAccessToken = flags["jira-access-token"] || await this.promptForFlag("jira-access-token")
    const jiraHost = flags["jira-host"] || await this.promptForFlag("jira-host", "jira.atlassian.com")
    const jiraTicketId = flags["ticket-id"] || await this.promptForFlag("ticket-id")
    const jiraTicket = await this.getJiraTicket(jiraAccessToken, jiraHost, jiraUser, jiraTicketId)

    // GitHub
    const baseBranch = flags["base-branch"] || await this.promptForFlag("base-branch", "master")
    const githubAccessToken = flags["github-access-token"] || await this.promptForFlag("github-access-token")
    const prTitle = flags["pr-title"] || await this.promptForFlag("pr-title", jiraTicket.fields.summary)
    const prTitleWithTicketId = `[${jiraTicket.key}] ${prTitle}`
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

    cli.action.start('Fetching JIRA ticket')
    const jiraTicket = await jiraClient.getJiraTicket(ticketId)
    cli.action.stop('done')

    return jiraTicket
  }

  private async makePullRequest(accessToken: string, base: string, title: string, description: string) {
    let githubClient = new GitHubClient(accessToken)

    cli.action.start('Making pull request')
    const result = await githubClient.openPullRequest({
      repo: await Repository.open("."),
      title: title,
      description: description,
      base: base
    })
    cli.action.stop('done')

    return result
  }

  private createPRDescription(jiraHost: string, jiraTicket: any) {
    return `https://${jiraHost}/browse/${jiraTicket.key}`
  }

  private async promptForFlag(flag: string, defaultValue?: any) {
    if (this.interactive) {
      return await cli.prompt(flag, { required: defaultValue === undefined, default: defaultValue })
    } else {
      defaultValue || this.error(`Missing --${flag} flag!`)
    }
  }
}

export = GithubJiraPr
