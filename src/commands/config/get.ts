import {Command, flags} from '@oclif/command'

export default class ConfigGet extends Command {
  static description = 'view configuration settings'

  static flags = {
    help: flags.help({char: 'h'})
  }

  static args = [{ name: 'setting' }]

  async run() {
    const {args, flags} = this.parse(ConfigGet)
    console.log(args)
  }
}
