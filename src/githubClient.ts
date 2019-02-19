import axios from 'axios'
import { Repository, Remote } from 'nodegit'
import { CLIError } from '@oclif/errors'

export class GitHubClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  async openPullRequest(opts: any) {
    let repo = opts.repo
    let title = opts.title
    let description = opts.description
    let base = opts.base

    let githubRemote = await this.getGitHubRemote(repo)

    if (!githubRemote) {
      throw new CLIError("The current git repo does not have any remotes!")
    }

    let remoteUrl = this.parseGitHubRemoteUrl(githubRemote.url())
    let branch = (await repo.getCurrentBranch()).shorthand()
    let response = await axios({
      method: "POST",
      url: `https://api.github.com/repos/${remoteUrl.owner}/${remoteUrl.repo}/pulls`,
      headers: {
        "Authorization": `token ${this.accessToken}`
      },
      data: {
        title: title,
        body: description,
        head: branch,
        base: base
      }
    })

    return response.data
  }

  private async getGitHubRemote(repo: Repository) {
    const remotes = await this.getGitRemotes(repo)
    return remotes.find((remote: Remote) => {
      return remote.url().includes("git@github.com")
    })
  }

  private async getGitRemotes(repo: Repository) {
    const promises = (await repo.getRemotes()).map(async (remote: Remote) => {
      return await repo.getRemote(remote)
    })
    return await Promise.all(promises)
  }

  private parseGitHubRemoteUrl(url: string) {
    // GitHub remote url format: git@github.com:owner/repo.git
    const parts = url.split(":")[1].split("/")
    return {
      owner: parts[0],
      repo: parts[1].replace(/.git/, '')
    }
  }
}
