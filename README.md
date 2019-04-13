github-jira
========
```
USAGE
  $ github-jira [COMMAND]

COMMANDS
  help  display help for github-jira
  pr    Create GitHub PRs from JIRA tickets

```

# Features

- Create GitHub PRs from JIRA tickets

# Install

**Standalone**

Download latest binary here: https://github.com/alexfu/github-jira/releases.

**npm**
```
$ npm i github-jira
```

# Integrate with Git
Easily integrate with git by using this script:

```
#!/bin/bash

github-jira \
--github-access-token <GITHUB_ACCESS_TOKEN> \
--jira-access-token <JIRA_ACCESS_toKEN> \
--jira-email <JIRA_EMAIL> \
--jira-host <JIRA_HOST> \
"$@"
```

Save the above script as `git-jira-pr` and save it somewhere in your `PATH` so git can pick it up. You can now use `github-jira` in the following manner:

```
$ git jira-pr -b development -t BUY-123
```
