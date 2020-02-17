import axios from 'axios'

export class JiraClient {
  private readonly username: string
  private readonly accessToken: string
  private readonly host: string
  private readonly auth: {username: string, password: string}

  constructor(config: {username: string, accessToken: string, host: string}) {
    this.username = config.username
    this.accessToken = config.accessToken
    this.host = config.host
    this.auth = {
      username: this.username,
      password: this.accessToken
    }
  }

  async getJiraTicket(ticketId: string): Promise<JiraIssue> {
    const response = await axios({
      url: `https://${this.host}/rest/api/2/issue/${ticketId}`,
      auth: this.auth
    })
    return response.data
  }

  async getTransitions(ticketId: string) {
    const response = await axios({
      url: `https://${this.host}/rest/api/2/issue/${ticketId}/transitions`,
      auth: this.auth
    })
    return response.data.transitions
  }

  async transitionTicket(ticketId: string, transitionId: string): Promise<void> {
    await axios({
      url: `https://${this.host}/rest/api/2/issue/${ticketId}/transitions`,
      method: 'POST',
      auth: this.auth,
      data: {
        transition: {
          id: transitionId
        }
      }
    })
  }
}

export interface JiraIssue {
  id: string,
  key: string,
  fields: {summary: string}
}
