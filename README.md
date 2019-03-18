github-jira-pr
========
```
Create GitHub PRs from JIRA tickets

USAGE
  $ github-jira-pr

OPTIONS
  -b, --base-branch=base-branch              base branch for PR
  -h, --help                                 show CLI help
  -i, --interactive                          interactive mode
  -t, --ticket-id=ticket-id                  jira ticket ID
  --github-access-token=github-access-token  github access token
  --jira-access-token=jira-access-token      jira access token
  --jira-email=jira-email                    email address associated with jira
  --jira-host=jira-host                      custom host for jira
  --pr-title=pr-title                        custom PR title
```

# Features

- Uses JIRA ticket title as PR title
- Prepends JIRA ticket ID to PR title
- Adds link to JIRA ticket in PR description
- Provides option to override PR title
- Interactive mode

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
