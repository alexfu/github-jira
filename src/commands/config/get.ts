import {flags} from '@oclif/command'

import BaseCommand from '../../base-command'

export default class ConfigGet extends BaseCommand {
  static description = 'view configuration settings'

  static flags = {
    help: flags.help({char: 'h'})
  }

  static args = [
    {name: 'setting', options: ['jiraHost', 'jiraEmail', 'jiraAccessToken', 'githubAccessToken']}
  ]

  async run() {
    const {args} = this.parse(ConfigGet)
    const configFile = await this.getConfig()
    const setting = args.setting
    if (setting) {
      this.log(configFile.get(setting))
    } else {
      this.log(configFile.toString())
    }
  }
}
