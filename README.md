github-jira
========
```
USAGE
  $ github-jira [COMMAND]

COMMANDS
  config  view or change configuration settings
  help    display help for github-jira
  pr      create a pull request from a Jira ticket
  start   start work on a Jira ticket
```

# Features

- Create Github pull request from a Jira ticket
- Start work on a Jira ticket
  - Transitions ticket to `In Progress` and creates a new git branch automatically (based off ticket issue type and name)

# Install

**Standalone**

Download latest binary here: https://github.com/alexfu/github-jira/releases.

**npm**
```
$ npm i github-jira
```

# Configure

`github-jira` requires initial configuration before using. Run the following command to setup configuration:

```
$ github-jira config:init
```

# Usage

Run `github-jira help` to see a list of all available commands. Each command also has their own help subcommand.

# Integrate with Git
Easily integrate with git by using this script:

```
#!/bin/bash

github-jira "$@"
```

Save the above script as `git-jira` and save it somewhere in your `PATH` so git can pick it up. You can now use `github-jira` in the following manner:

```
$ git jira pr -b development -t BUY-123
```
