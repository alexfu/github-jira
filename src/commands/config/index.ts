import { flags } from '@oclif/command'
import BaseCommand from "../../BaseCommand"
import Help from "@oclif/plugin-help"

export default class Config extends BaseCommand {
  static description = 'view or change configuration settings'

  static flags = {
    help: flags.help({ char: 'h' })
  }

  static examples = [
    "config:get jiraHost",
    "config:set jiraHost jira.mycompany.com",
  ]

  static args = []

  async run() {
    new Help(this.config).showHelp(["config"])
  }
}
