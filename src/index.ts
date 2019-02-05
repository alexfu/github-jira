import {Command, flags} from '@oclif/command'
import {CLIError} from '@oclif/errors'
import axios from 'axios'
import { Repository, Remote } from 'nodegit'
import { JiraClient } from './jiraClient'

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

    const jiraTicket = await jiraClient.getJiraTicket(this.jiraTicketId)
    const repo = await Repository.open(".")
    const githubRemote = await this.getGitHubRemote(repo)

    if (githubRemote) {
      const result = await this.openPullRequest(repo, githubRemote, jiraTicket)
      this.log(result.html_url)
    } else {
      throw new CLIError("The current git repo does not have any remotes!")
    }
  }

  async getGitHubRemote(repo: Repository) {
    const remotes = await this.getGitRemotes(repo)
    return remotes.find((remote: Remote) => {
      return remote.url().includes("git@github.com")
    })
  }

  async getGitRemotes(repo: Repository) {
    const promises = (await repo.getRemotes()).map(async (remote: Remote) => {
      return await repo.getRemote(remote)
    })
    return await Promise.all(promises)
  }

  async openPullRequest(repo: Repository, githubRemote: Remote, jiraTicket: any) {
    try {
      const title = `[${jiraTicket.key}] ${jiraTicket.fields.summary}`
      const description = `https://${this.jiraHost}/browse/${jiraTicket.key}`
      const remoteUrl = this.parseGitHubRemoteUrl(githubRemote.url())
      const branch = (await repo.getCurrentBranch()).shorthand()
      const response = await axios({
        method: "POST",
        url: `https://api.github.com/repos/${remoteUrl.owner}/${remoteUrl.repo}/pulls`,
        headers: {
          "Authorization": `token ${this.githubAccessToken}`
        },
        data: {
          title: title,
          body: description,
          head: branch,
          base: this.baseBranch
        }
      })
      return response.data
    } catch(err) {
      this.error(`Unable to open pull request: ${err}`)
    }
  }

  parseGitHubRemoteUrl(url: string) {
    // GitHub remote url format: git@github.com:owner/repo.git
    const parts = url.split(":")[1].split("/")
    return {
      owner: parts[0],
      repo: parts[1].replace(/.git/, '')
    }
  }
}

export = GithubJiraPr
