import {flags} from '@oclif/command'
import cli from 'cli-ux'
import * as inquirer from 'inquirer'
import {Repository} from 'nodegit'

import BaseCommand from '../base-command'
import {GitHubClient} from '../github-client'
import {JiraClient} from '../jira-client'

export default class Pr extends BaseCommand {
  static description = 'Create GitHub PRs from JIRA tickets'
  static flags = {
    help: flags.help({char: 'h'}),
    interactive: flags.boolean({char: 'i', description: 'interactive mode', default: false}),
    'base-branch': flags.string({char: 'b', description: 'base branch for pull request'}),
    'ticket-id': flags.string({char: 't', description: 'Jira ticket ID'}),
    'pr-title': flags.string({description: 'custom pull request title'}),
    draft: flags.boolean({description: 'make a draft pull request'}),
    description: flags.string({description: 'custom pull request description'})
  }

  async run() {
    const {flags} = this.parse(Pr)
    const config = await this.getConfig()

    // Jira

    if (flags.interactive) {
      if (!flags['ticket-id']) {
        const validator = (value: string) => {
          if (value) {
            return true
          }
          return 'Jira ticket ID must not be empty'
        }
        flags['ticket-id'] = await this.promptInput({message: 'Jira ticket ID', validator})
      }
    }

    const jiraTicketId = flags['ticket-id'] || this.error('Missing ticket ID!')
    const jiraTicket = await this.getJiraTicket({accessToken: config.jiraAccessToken, host: config.jiraHost, username: config.jiraEmail, ticketId: jiraTicketId})
    const jiraTicketURL = `https://${config.jiraHost}/browse/${jiraTicket.key}`

        // Github

    if (flags.interactive) {
      if (!flags['base-branch']) {
        const result: any = await inquirer.prompt({
          name: 'baseBranch',
          message: 'Base branch',
          type: 'list',
          choices: await this.getGitBranches()
        })
        flags['base-branch'] = result.baseBranch
      }

      if (!flags['pr-title']) {
        flags['pr-title'] = await this.promptInput({message: 'Custom pull request title', default: jiraTicket.fields.summary})
      }

      if (!flags.draft) {
        flags.draft = await this.promptConfirm({message: 'Draft pull request?'})
      }

      if (!flags.description) {
        flags.description = await this.promptInput({message: 'Pull request description'})
      }
    }

    const baseBranch = flags['base-branch'] || this.error('Missing base branch!')
    const prTitle = `[${jiraTicket.key}] ${flags['pr-title'] || jiraTicket.fields.summary}`
    const prDescription = flags.description ? `${flags.description}\n${jiraTicketURL}` : jiraTicketURL
    const draft = flags.draft

    try {
      const pr = await this.makePullRequest({accessToken: config.githubAccessToken, base: baseBranch, title: prTitle, description: prDescription, draft})
      this.log(pr.html_url)
    } catch (error) {
      this.log(error.response.data)
      this.error(error.message)
    }
  }

  private async promptInput(args: {message: string, default?: string, validator?(value: string): string | boolean}): Promise<string> {
    const response: any = await inquirer.prompt({
      name: 'result',
      message: args.message,
      type: 'input',
      default: args.default,
      validate: args.validator
    })
    return response.result
  }

  private async promptConfirm(args: {message: string, default?: boolean}): Promise<boolean> {
    const response: any = await inquirer.prompt({
      name: 'result',
      message: args.message,
      type: 'confirm',
      default: args.default || false
    })
    return response.result
  }

  private async getGitBranches(): Promise<{}[]> {
    const repo = await Repository.open('.')
    const references = await repo.getReferences()
    return references
      .filter(ref => ref.isBranch())
      .map(ref => ({name: ref.shorthand()}))
  }

  private async getJiraTicket(args: {accessToken: string, host: string, username: string, ticketId: string}) {
    let jiraClient = new JiraClient({
      username: args.username,
      accessToken: args.accessToken,
      host: args.host
    })

    cli.action.start('Fetching JIRA ticket')
    const jiraTicket = await jiraClient.getJiraTicket(args.ticketId)
    cli.action.stop('done')

    return jiraTicket
  }

  private async makePullRequest(args: {accessToken: string, base: string, title: string, description: string, draft: boolean}) {
    let githubClient = new GitHubClient(args.accessToken)

    cli.action.start('Making pull request')
    const result = await githubClient.openPullRequest({
      repo: await Repository.open('.'),
      title: args.title,
      description: args.description,
      base: args.base,
      draft: args.draft
    })
    cli.action.stop('done')

    return result
  }
}
