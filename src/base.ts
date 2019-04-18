import Command, {flags} from '@oclif/command'

export default abstract class BaseCommand extends Command {
    static flags = {
        "jira-host": flags.string({ description: "custom host for jira" }),
        "jira-email": flags.string({ description: "email address associated with jira" }),
        "jira-access-token": flags.string({ description: "jira access token" }),
        "github-access-token": flags.string({ description: "github access token" })
    }

    async run() {
        const {flags} = this.parse(BaseCommand)
    }
}
