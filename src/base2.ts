import Command from "@oclif/command"
import * as fs from 'fs-extra'
import * as path from 'path'
import { ConfigFile } from "./lib/ConfigFile"

export default abstract class BaseCommand extends Command {
    private configFilePath = path.join(this.config.configDir, 'config.json')

    async getConfig(): Promise<ConfigFile> {
        await fs.ensureDir(this.config.configDir)

        let configFile: ConfigFile
        try {
          await fs.access(this.configFilePath, fs.constants.F_OK)
          const json = await fs.readJson(this.configFilePath)
          configFile = new ConfigFile(json)
        } catch (error) {
          configFile = new ConfigFile()
          await this.saveConfig(configFile)
        }

        return configFile
    }

    async saveConfig(config: ConfigFile) {
      await fs.writeFile(this.configFilePath, config.toString())
    }
}
