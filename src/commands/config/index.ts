import {Command, flags} from '@oclif/command'
import * as fs from 'fs-extra'
import * as path from 'path'

export default class Config extends Command {
  static description = 'view or change configuration settings'

  static flags = {
    help: flags.help({char: 'h'})
  }

  static args = []

  async run() {
    const {args, flags} = this.parse(Config)
    const userConfig = await fs.readJSON(path.join(this.config.configDir, 'config.json'))
    this.log(userConfig)
  }
}
