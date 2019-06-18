import Command, {flags} from "@oclif/command"
import * as inquirer from "inquirer"

export default abstract class BaseCommand extends Command {
    static flags = {
        "jira-host": flags.string({ description: "custom host for jira" }),
        "jira-email": flags.string({ description: "email address associated with jira" }),
        "jira-access-token": flags.string({ description: "jira access token" }),
        "github-access-token": flags.string({ description: "github access token" }),
        "interactive": flags.boolean({ char: "i", description: "interactive mode", default: false })
    }

    interactive: boolean = false
    jiraHost: string = ""
    jiraUser: string = ""
    jiraAccessToken: string = ""

    async run() {
        const {flags} = this.parse(BaseCommand)
        this.interactive = flags["interactive"]
        this.jiraUser = await this.getFlagValue(flags, "jira-email")
        this.jiraHost = await this.getFlagValue(flags, "jira-host", "jira.atlassian.com")
        this.jiraAccessToken = await this.getFlagValue(flags, "jira-access-token")
    }

    async getFlagValue(flags: any, flag: string, defaultValue?: any) {
        const value = flags[flag]
        if (value) {
          return value
        } else if (this.interactive) {
          const response = await inquirer.prompt([{ name: flag, message: flag, default: defaultValue }])
          return response[flag]
        } else {
          return defaultValue || this.error(`Missing --${flag} flag!`)
        }
      }
}
