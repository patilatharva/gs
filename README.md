# gs - git stacker

A CLI for managing stacked pull requests 🥞

## Install

```console
brew install patilatharva/tap/gs
```

## What is gs?

gs is my fork of https://github.com/danerwilliams/charcoal, a fork of https://github.com/searleser97/graphite-cli, the Graphite CLI artifact from when it was open source.

## Quick start

### Initializing

```console
gs init
```

### Creating a new PR

```console
# Checkout the main branch
gs checkout main

# Make changes with your editor
echo "new code changes" >> file.js

# Create a branch with a single commit
#   - the -a/--all flag will stage any modified files
#   - the branch will be checked out for you
gs create -a atharva/two-way-sync

# Push changes to your remote and create a new pull request
gs submit

# If you need to make any follow up changes to the PR, you can:

# (a) amend the existing commit with gs amend
echo "more changes for first commit" >> file.js
gs amend -a

# (b) or write a new commit with gs commit
echo "changes for second commit" >> file.js
gs commit -am "Second commit."

# Submit new changes
gs submit
```

### Stacking a second PR

```console
# Open an interactive branch picker:
#
#   - select the pull request you want to stack on top of
#   - press Enter
#
# to check the branch out.
gs checkout

# Make changes with your editor
echo "Support real-time sync" > \
  real_time_sync.tsx

# Create a second PR on top of the first one
gs create -a atharva/two-way-sync-rts

# Push the stack, which will also create a 2nd pull request
# on top of the first one
gs submit
```

Visualize your new stack locally:

```console
gs log short  # or run `gs ls`
```

### Pulling the latest changes from main into your stack

```console
gs sync

# Checkout your branch
gs checkout

# Restack changes
gs restack
```

### Navigating

```console
gs up      # or `gs u`
gs down    # or `gs d`
gs top     # or `gs t`
gs bottom  # or `gs b`
```


### All commands

| Command                  | Aliases           | Description                                                                                                               |
|--------------------------|--------------------|---------------------------------------------------------------------------------------------------------------------------|
| `gs amend`               | a                  | Amend the most recent commit and restack upstack branches.                                                                |
| `gs auth`                |                    | Authenticate with the GitHub CLI to create and manage PRs in GitHub from gs.                                            |
| `gs bottom`              | b                  | Switch to the first branch from trunk in the current stack.                                                              |
| `gs checkout [branch]`   | co                 | Switch to a branch. If no branch is provided, opens an interactive selector.                                            |
| `gs commit`              | c                  | Create a new commit and restack upstack branches.                                                                        |
| `gs completion`          |                    | Set up bash or zsh tab completion.                                                                                        |
| `gs continue`            | cont               | Continues the most recent gs command halted by a merge conflict.                                                        |
| `gs create [name]`      | cr                 | Create a new branch stacked on top of the current branch and commit staged changes.                                       |
| `gs debug-context`       |                    | Print a debug summary of your repo. Useful for creating bug report details.                                              |
| `gs delete [name]`      | dl                 | Delete a branch and its corresponding gs metadata.                                                                        |
| `gs down [steps]`       | d                  | Switch to the parent of the current branch.                                                                              |
| `gs fish`                | fish               | Set up fish tab completion.                                                                                              |
| `gs fold`                | f                  | Fold a branch's changes into its parent, update dependencies of descendants of the new combined branch, and restack.    |
| `gs info`                | i                  | Display information about the current branch.                                                                            |
| `gs log <command>`       | l                  | Commands that log your stacks.                                                                                           |
| `gs onto [branch]`      | o                  | Rebase the current branch onto the latest commit of the target branch and restack all of its descendants.                |
| `gs rename [name]`      | rn                 | Rename a branch and update metadata referencing it. If no branch name is supplied, you will be prompted for a new name. |
| `gs reorder`             | e                  | Reorder branches between trunk and the current branch, restacking all of their descendants.                               |
| `gs repo <command>`      | r                  | Read or write gs's configuration settings for the current repo. Run `gs repo --help` to learn more.                     |
| `gs init`                | i                  | Create or regenerate a `.graphite_repo_config` file.                                                                    |
| `gs sync`                | s                  | Pull the trunk branch from remote and delete any branches that have been merged.                                         |
| `gs restack`             | r, fix, f          | Ensure each branch in the current stack is based on its parent, rebasing if necessary.                                   |
| `gs split`               | sp                 | Split the current branch into multiple single-commit branches.                                                           |
| `gs squash`              | sq                 | Squash all commits in the current branch and restack upstack branches.                                                  |
| `gs stack <command>`     | s                  | Commands that operate on your current stack of branches. Run `gs stack --help` to learn more.                           |
| `gs submit`              | s                  | Idempotently force push all branches in the current stack to GitHub, creating or updating distinct pull requests for each.| 
| `gs test <command>`      | t                  | Run the provided command on each branch in the current stack and aggregate the results.                                   |
| `gs tips`                |                    | Show tips while using gs.                                                                                                |
| `gs top`                 | t                  | Switch to the tip branch of the current stack. Prompts if ambiguous.                                                    |
| `gs track [branch]`      | tr                 | Start tracking the current (or provided) branch with gs by selecting its parent. This command can also fix corrupted gs metadata. |
| `gs unbranch`            | ub                 | Delete the current branch but retain the state of files in the working tree.                                            |
| `gs untrack [branch]`    | ut                 | Stop tracking a branch with gs. If the branch has children, they will also be untracked. Default to the current branch if none is passed in. |
| `gs up [steps]`         | u                  | Switch to the child of the current branch. Prompts if ambiguous.                                                         |
| `gs user <command>`      |                    | Read or write gs's user configuration settings. Run `gs user --help` to learn more.                                     |


## Developing and Running tests

You'll need to install yarn on your machine

```
npm install --global yarn
```

You'll also need to install turbo
```
npm install --global turbo
```

Build the monorepo
```
yarn install
turbo run build
```

Build the CLI

```
cd apps/cli
yarn install
yarn build
```

Running tests

```
cd apps/cli
DEBUG=1 yarn test --full-trace
```

Running a subset of tests

```
cd apps/cli
DEBUG=1 yarn test --full-trace -g "test pattern"
```

Running one test

```
cd apps/cli
DEBUG=1 yarn test-one "<path to .js test file in dist folder>"
```

Running the CLI locally (after build)

```
cd apps/cli
yarn cli <command> # (to run `gs <command>`)
```

Linking `gs` to a locally built version (includes a build)

```
cd apps/cli
yarn dev
# then to run commands:
gs <command>
```
