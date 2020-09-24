import {flags} from '@oclif/command'
import {cli} from 'cli-ux'
import {Repository} from 'nodegit'

import BaseCommand from '../base-command'
import {JiraClient, JiraIssue} from '../jira-client'

export default class StartWorkCommand extends BaseCommand {
  static description = 'start work on a Jira ticket'

  static flags = {
    help: flags.help({char: 'h'})
  }

  static args = [
    {name: 'ticket', description: 'Jira ticket ID (or key)', required: true}
  ]

  static examples = [
    'start ntv-123',
    'start 5678'
  ]

  private jiraClient?: JiraClient

  async run() {
    const {args} = this.parse(StartWorkCommand)
    const ticketId = args.ticket

    const config = await this.getConfig()
    this.jiraClient = new JiraClient({host: config.jiraHost, username: config.jiraEmail, accessToken: config.jiraAccessToken})

    // Transition ticket to In Progress
    await this.transitionTicketToInProgress(ticketId)

    // Check out new git branch
    const jiraTicket = await this.jiraClient.getJiraTicket(ticketId)
    await this.checkoutBranch(jiraTicket)
  }

  private async transitionTicketToInProgress(ticketId: string) {
    if (!this.jiraClient) {
      this.error('Jira client is null, unable to transition ticket!')
    }

    cli.action.start('Transitioning Jira ticket')
    let transitions = await this.jiraClient!.getTransitions(ticketId)
    transitions = transitions.filter((transition: { name: string }) => transition.name === 'Start Work')
    if (transitions.length === 0) {
      this.error('Unable to transition this ticket into In Progress!')
    }
    const transition = transitions[0]
    await this.jiraClient!.transitionTicket(ticketId, transition.id)
    cli.action.stop('done')
  }

  private async checkoutBranch(jiraTicket: JiraIssue) {
    const defaultBranchName = this.getBranchName(jiraTicket)
    const branchName = await this.promptInput({message: 'Branch name', default: defaultBranchName})

    cli.action.start('Checking out new branch')
    const repo = await Repository.open('.')
    const commit = await repo.getHeadCommit()
    const branchRef = await repo.createBranch(branchName, commit)
    await repo.checkoutRef(branchRef)
    cli.action.stop('done')

    this.log(`Switched to new branch '${branchName}'`)
  }

  private getBranchName(jiraTicket: JiraIssue): string {
    const issueType = jiraTicket.fields.issuetype.name.toUpperCase()

    let prefix: string
    switch (issueType) {
    case 'TASK':
      prefix = 'chore/'
      break
    case 'IMPROVEMENT':
      prefix = 'feature/'
      break
    case 'BUG':
      prefix = 'bugfix/'
      break
    default:
      prefix = ''
    }

    const ticketId = jiraTicket.key.toLowerCase()
    const ticketSummary = jiraTicket.fields.summary.toLowerCase()
    const branchName = this.sanitizeBranchName(`${ticketId}_${ticketSummary}`)
    return `${prefix}${branchName}`
  }

  private sanitizeBranchName(name: string): string {
    return name.replace(/'/g, '').replace(/:/g, ' ').replace(/\s/g, '_')
  }
}
