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
    "pr-title": flags.string({ required: false, description: 'custom PR title' })
  }

  async run() {
    const params = this.collectParams()

    let jiraClient = new JiraClient({
      username: params.jiraUser,
      accessToken: params.jiraAccessToken,
      host: params.jiraHost
    })

    let githubClient = new GitHubClient(params.githubAccessToken)

    const jiraTicket = await jiraClient.getJiraTicket(params.jiraTicketId)

    const result = await githubClient.openPullRequest({
      repo: await Repository.open("."),
      title: this.createPRTitle(jiraTicket, params.prTitleOverride),
      description: this.createPRDescription(params.jiraHost, jiraTicket),
      base: params.baseBranch
    })

    this.log(result.html_url)
  }

  private collectParams() {
    const {flags} = this.parse(GithubJiraPr)
    const baseBranch = flags["base-branch"]
    const jiraHost = flags["jira-host"] || 'jira.atlassian.com'
    const jiraTicketId = flags["ticket-id"]
    const jiraUser = flags["jira-email"]
    const jiraAccessToken = flags["jira-access-token"]
    const githubAccessToken = flags["github-access-token"]
    const prTitleOverride = flags["pr-title"] || null;

    return {
      baseBranch: baseBranch,
      jiraHost: jiraHost,
      jiraTicketId: jiraTicketId,
      jiraUser: jiraUser,
      jiraAccessToken: jiraAccessToken,
      githubAccessToken: githubAccessToken,
      prTitleOverride: prTitleOverride
    }
  }  

  private createPRTitle(jiraTicket: any, prTitleOverride: string | null) {
    if (prTitleOverride) {
      return `[${jiraTicket.key}] ${prTitleOverride}`
    } else {
      return `[${jiraTicket.key}] ${jiraTicket.fields.summary}`;
    }
  }

  private createPRDescription(jiraHost: string, jiraTicket: any) {
    return `https://${jiraHost}/browse/${jiraTicket.key}`
  }
}

export = GithubJiraPr
