import BaseCommand from '../../base-command'
import {ConfigFile, ConfigFileJSON} from '../../lib/config-file'
import {Validators} from '../../lib/prompt-validators'

export default class ConfigInitCommand extends BaseCommand {
  static description = 'initialize configuration settings'

  async run() {
    const configJson: ConfigFileJSON = {
      jiraHost: '',
      jiraEmail: '',
      jiraAccessToken: '',
      githubAccessToken: ''
    }
    configJson.jiraHost = await this.promptInput({message: 'Jira host', default: 'jira.atlassian.com', validator: Validators.required})
    configJson.jiraEmail = await this.promptInput({message: 'Jira email', validator: Validators.required})
    configJson.jiraAccessToken = await this.promptInput({message: 'Jira access token (id.atlassian.com/manage/api-tokens)', validator: Validators.required})
    configJson.githubAccessToken = await this.promptInput({message: 'Github access token (github.com/settings/tokens)', validator: Validators.required})

    const config = new ConfigFile(configJson)
    await this.saveConfig(config)
    this.log(`Saved configuration to ${this.configFilePath}`)
  }
}
