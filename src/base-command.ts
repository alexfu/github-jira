import Command from '@oclif/command'
import * as fs from 'fs-extra'
import * as inquirer from 'inquirer'
import * as path from 'path'

import {ConfigFile} from './lib/config-file'

export default abstract class BaseCommand extends Command {
  readonly configFilePath = path.join(this.config.configDir, 'config.json')

  async getConfig(): Promise<ConfigFile> {
    await fs.ensureDir(this.config.configDir)

    let configFile: ConfigFile
    try {
      await fs.access(this.configFilePath, fs.constants.F_OK)
      const json = await fs.readJson(this.configFilePath)
      configFile = new ConfigFile(json)
    } catch {
      configFile = new ConfigFile()
      await this.saveConfig(configFile)
    }

    return configFile
  }

  async saveConfig(config: ConfigFile) {
    await fs.writeFile(this.configFilePath, config.toString())
  }

  async promptInput(args: {message: string, default?: string, validator?(value: string): string | boolean}): Promise<string> {
    const response: any = await inquirer.prompt({
      name: 'result',
      message: args.message,
      type: 'input',
      default: args.default,
      validate: args.validator
    })
    return response.result
  }

  async promptConfirm(args: {message: string, default?: boolean}): Promise<boolean> {
    const response: any = await inquirer.prompt({
      name: 'result',
      message: args.message,
      type: 'confirm',
      default: args.default || false
    })
    return response.result
  }

  async promptChoices(args: {message: string, choices: string[]}): Promise<string> {
    const response: any = await inquirer.prompt({
      name: 'result',
      message: args.message,
      type: 'list',
      choices: args.choices
    })
    return response.result
  }
}
