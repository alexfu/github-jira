import {flags} from '@oclif/command'
import {Repository} from 'nodegit'

import BaseCommand from '../base-command'
import {JiraClient, JiraIssue} from '../jira-client'

export default class StartWorkCommand extends BaseCommand {
  static description = 'transition a Jira ticket to in progress'

  static flags = {
    help: flags.help({char: 'h'})
  }

  static args = [
    {name: 'ticket', description: 'Jira ticket ID', required: true}
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

    let transitions = await this.jiraClient.getTransitions(ticketId)
    transitions = transitions.filter((transition: { name: string }) => transition.name === 'Start Work')
    if (transitions.length === 0) {
      this.error('Unable to transition this ticket into In Progress!')
    }
    const transition = transitions[0]
    await this.jiraClient.transitionTicket(ticketId, transition.id)
  }

  private async checkoutBranch(jiraTicket: JiraIssue) {
    const branchName = `${jiraTicket.key.toLowerCase()}_${jiraTicket.fields.summary.toLowerCase().replace(/\s/g, '_')}`
    const repo = await Repository.open('.')
    const commit = await repo.getHeadCommit()
    const branchRef = await repo.createBranch(branchName, commit)
    await repo.checkoutRef(branchRef)
    this.log(`Switched to new branch '${branchName}'`)
  }
}
