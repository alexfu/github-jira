import {CLIError} from '@oclif/errors'
import axios from 'axios'
import {Remote, Repository} from 'nodegit'

export class GitHubClient {
  private readonly accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  async openPullRequest(opts: any) {
    let repo = opts.repo
    let title = opts.title
    let description = opts.description
    let base = opts.base
    let draft = opts.draft || false

    let githubRemote = await this.getGitHubRemote(repo)

    if (!githubRemote) {
      throw new CLIError('The current git repo does not have any remotes!')
    }

    let remoteUrl = this.parseGitHubRemoteUrl(githubRemote.url())
    let branch = (await repo.getCurrentBranch()).shorthand()
    let response = await axios({
      method: 'POST',
      url: `https://api.github.com/repos/${remoteUrl.owner}/${remoteUrl.repo}/pulls`,
      headers: {
        Authorization: `token ${this.accessToken}`,
        Accept: 'application/vnd.github.shadow-cat-preview+json'
      },
      data: {
        title,
        body: description,
        head: branch,
        base,
        draft
      }
    })

    return response.data
  }

  private async getGitHubRemote(repo: Repository) {
    const remotes = await this.getGitRemotes(repo)
    return remotes.find((remote: Remote) => {
      return remote.url().includes('git@github.com')
    })
  }

  private async getGitRemotes(repo: Repository): Promise<Remote[]> {
    const remotes = await repo.getRemotes()
    const promises = remotes.map((remote: Remote) => {
      return repo.getRemote(remote)
    })
    return Promise.all(promises)
  }

  private parseGitHubRemoteUrl(url: string) {
    // GitHub remote url format: git@github.com:owner/repo.git
    const parts = url.split(':')[1].split('/')
    return {
      owner: parts[0],
      repo: parts[1].replace(/.git/, '')
    }
  }
}
