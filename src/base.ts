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

    listPrompter(choicesProvider: () => Promise<{}[]>) {
        return async (name: string) => {
            const choices = await choicesProvider.call(this)
            const answer = await inquirer.prompt([{ name: name, message: name, type: "list", choices: choices }])
            return (<any>answer)[name]
        }
    }

    valuePrompter(defaultValue?: any) {
        return async (name: string) => {
            const answer = await inquirer.prompt([{ name: name, message: name, type: "input", default: defaultValue}])
            return (<any>answer)[name]
        }
    }

    confirmPrompter(defaultValue: boolean) {
        return async (name: string) => {
            const answer = await inquirer.prompt([{ name: name, message: name, type: "confirm", default: defaultValue}])
            return (<any>answer)[name]
        }
    }

    editorPrompter() {
        return async (name: string) => {
            const answer = await inquirer.prompt([{ name: name, message: name, type: "editor" }])
            return (<any>answer)[name]
        }
    }

    async parseBaseFlags(flags: any) {
        this.interactive = flags["interactive"]
        this.jiraUser = await this.getFlagValue(flags, "jira-email")
        this.jiraHost = await this.getFlagValue(flags, "jira-host", "jira.atlassian.com")
        this.jiraAccessToken = await this.getFlagValue(flags, "jira-access-token")
    }

    async getFlagValue2(flags: {}, flag: string, prompter: (name: string) => Promise<string>, defaultValue?: any) {
        const value = (<any>flags)[flag]
        if (value !== undefined) {
          return value
        } else if (this.interactive) {
            return await prompter.call(this, flag);
        } else {
          return defaultValue || this.error(`Missing --${flag} flag!`)
        }
    }

    async getFlagValue(flags: any, flag: string, defaultValue?: any) {
        const value = flags[flag]
        if (value) {
          return value
        } else if (this.interactive) {
          const answer = await inquirer.prompt([{ name: flag, message: flag, default: defaultValue }])
          return (<any>answer)[flag]
        } else {
          return defaultValue || this.error(`Missing --${flag} flag!`)
        }
    }
}
