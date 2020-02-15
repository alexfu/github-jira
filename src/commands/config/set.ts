import { flags } from "@oclif/command"
import BaseCommand from "../../BaseCommand"

export default class SetCommand extends BaseCommand {
  static description = 'set configuration settings'

  static flags = {
    help: flags.help({char: 'h'})
  }

  static args = [
    { name: 'setting', options: ["jiraHost", "jiraEmail", "jiraAccessToken", "githubAccessToken"] },
    { name: 'value' }
  ]

  async run() {
    const { args, flags } = this.parse(SetCommand)
    const setting = args.setting
    const value = args.value
    var configFile = await this.getConfig()
    configFile = configFile.update(setting, value)
    await this.saveConfig(configFile)
  }
}
