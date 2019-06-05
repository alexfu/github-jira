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

    async run() {
        const {flags} = this.parse(BaseCommand)

        const jiraHost = (await inquirer.prompt([{name: "jiraHost", message: "jira-host", default: "jira.atlassian.com"}])).jiraHost
    }
}
