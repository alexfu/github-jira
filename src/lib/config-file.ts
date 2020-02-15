export class ConfigFile {
  readonly jiraHost: string
  readonly jiraEmail: string
  readonly jiraAccessToken: string
  readonly githubAccessToken: string
  private readonly json: ConfigFileJSON

  constructor(json?: ConfigFileJSON) {
    if (json) {
      this.json = json
    } else {
      this.json = {
        jiraHost: '',
        jiraEmail: '',
        jiraAccessToken: '',
        githubAccessToken: ''
      }
    }

    this.jiraHost = this.json.jiraHost
    this.jiraEmail = this.json.jiraEmail
    this.jiraAccessToken = this.json.jiraAccessToken
    this.githubAccessToken = this.json.githubAccessToken
  }

  update(setting: 'jiraHost' | 'jiraEmail' | 'jiraAccessToken' | 'githubAccessToken', value: string): ConfigFile {
    const updatedJson = this.json
    updatedJson[setting] = value
    return new ConfigFile(updatedJson)
  }

  get(setting: 'jiraHost' | 'jiraEmail' | 'jiraAccessToken' | 'githubAccessToken'): string {
    return this.json[setting]
  }

  toString(): string {
    return JSON.stringify(this.json)
  }
}

export interface ConfigFileJSON {
  jiraHost: string
  jiraEmail: string
  jiraAccessToken: string
  githubAccessToken: string
}
