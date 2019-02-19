import { Command, flags } from '@oclif/command'
import { Repository } from 'nodegit'
import { JiraClient } from './jiraClient'
import { GitHubClient } from './githubClient'

class GithubJiraPr extends Command {
  static description = 'Create GitHub PRs from JIRA tickets'

  static flags = {
    "help": flags.help({ char: 'h' }),
    "base-branch": flags.string({ required: true, char: 'b', description: 'base branch for PR' }),
    "ticket-id": flags.string({ required: true, char: 't', description: 'jira ticket ID' }),
    "jira-host": flags.string({ description: 'custom host for jira (i.e. mycompany.atlassian.net)' }),
    "jira-email": flags.string({ required: true, description: 'email address associated with jira' }),
    "jira-access-token": flags.string({ required: true, description: 'jira access token' }),
    "github-access-token": flags.string({ required: true, description: 'github access token' }),
  }

  jiraHost: string = ""
  jiraAccessToken: string = ""
  jiraTicketId: string = ""
  baseBranch: string = ""
  githubAccessToken: string = ""

  async run() {
    const {flags} = this.parse(GithubJiraPr)
    this.baseBranch = flags["base-branch"]
    this.jiraHost = flags["jira-host"] || 'jira.atlassian.com'
    this.jiraTicketId = flags["ticket-id"]
    let jiraUser = flags["jira-email"]
    let jiraAccessToken = flags["jira-access-token"]
    this.githubAccessToken = flags["github-access-token"]

    let jiraClient = new JiraClient({
      username: jiraUser,
      accessToken: jiraAccessToken,
      host: this.jiraHost
    })

    let githubClient = new GitHubClient(this.githubAccessToken)

    const jiraTicket = await jiraClient.getJiraTicket(this.jiraTicketId)

    const result = await githubClient.openPullRequest({
      repo: await Repository.open("."),
      title: this.createPRTitle(jiraTicket),
      description: this.createPRDescription(this.jiraHost, jiraTicket),
      base: this.baseBranch
    })

    this.log(result.html_url)
  }

  private createPRTitle(jiraTicket: any) {
    return `[${jiraTicket.key}] ${jiraTicket.fields.summary}`
  }

  private createPRDescription(jiraHost: string, jiraTicket: any) {
    return `https://${jiraHost}/browse/${jiraTicket.key}`
  }
}

export = GithubJiraPr
