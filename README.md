github-jira-pr
========
```
Create GitHub PRs from JIRA tickets

USAGE
  $ github-jira-pr

OPTIONS
  -b, --base-branch=base-branch              (required) base branch for PR
  -h, --help                                 show CLI help
  -t, --ticket-id=ticket-id                  (required) jira ticket ID
  --github-access-token=github-access-token  (required) github access token
  --jira-access-token=jira-access-token      (required) jira access token

  --jira-email=jira-email                    (required) email address associated
                                             with jira

  --jira-host=jira-host                      custom host for jira (i.e.
                                             mycompany.atlassian.net)

```

# How does it work?

`github-jira-pr` will pull the title of the JIRA ticket and assign it as the PR title. Additionally, each PR title will be prefixed with the ticket ID in square brackets (i.e. **[BUY-123] Fix app crashes**).

Also, the PR description will include a link to the JIRA ticket.

# Install

**Standalone**

Download latest binary here: https://github.com/alexfu/github-jira-pr/releases.

**npm**
```
$ npm i github-jira-pr
```

# Integrate with Git
Easily integrate with git by using this script:

```
#!/bin/bash

github-jira-pr \
--github-access-token <GITHUB_ACCESS_TOKEN> \
--jira-access-token <JIRA_ACCESS_toKEN> \
--jira-email <JIRA_EMAIL> \
--jira-host <JIRA_HOST> \
"$@"
```

Save the above script as `git-jira-pr` and save it somewhere in your `PATH` so git can pick it up. You can now use `github-jira-pr` in the following manner:

```
$ git jira-pr -b development -t BUY-123
```
