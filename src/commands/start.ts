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

  async run() {
    const {args} = this.parse(StartWorkCommand)
    const ticketId = args.ticket

    const config = await this.getConfig()
    const jiraClient = new JiraClient({host: config.jiraHost, username: config.jiraEmail, accessToken: config.jiraAccessToken})

    let transitions = await jiraClient.getTransitions(ticketId)
    transitions = transitions.filter((transition: { name: string }) => transition.name === 'Start Work')
    if (transitions.length === 0) {
      this.error('Unable to transition this ticket into In Progress!')
    }

    // Transition ticket to In Progress
    const transition = transitions[0]
    await jiraClient.transitionTicket(ticketId, transition.id)

    // Check out new git branch
    const jiraTicket = await jiraClient.getJiraTicket(ticketId)
    await this.checkoutBranch(jiraTicket)
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
