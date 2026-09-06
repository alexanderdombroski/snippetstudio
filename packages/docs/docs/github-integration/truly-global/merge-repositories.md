---
title: Merge Repositories
sidebar_label: Merge Repositories
sidebar_position: 3
---

# Merge Repositories

Want to change things up? Merge your snippets with another repository!

Choose `Merge Snippets Repo` in the <i className="codicon codicon-ellipsis"></i> three-dot menu of **Locations Manager** or run `snippetstudio.github.merge` in the command prompt

## Precautionary Checks

Before you can merge, there are precautions to make sure it is extra safe before making potentionally drastic changes to your global snippets.

1. Must be git repository with remote
2. Git remote must match configuration remote
3. Merge target remote must be different from current remote
4. Merge target remote must exist on GitHub

## Merge Options

There are three merge options. You can select one, or press `ESC` to cancel.

### Merge Snippets

*Merge snippets from the remote repository without changing your remote.* If you have a friend with a lot of snippets you want, but they don't want you modifying them, you can copy them all into your repo.

1. Clones the merge target into a temp folder
2. Performs a merge of all json objects (yours \<-- theirs)

See the [Merge Flow](/docs/github-integration/truly-global/merge-flow.md) for a flow chart.

### Collaborate

*Start with their snippets, merge yours, and set their repository as your remote.* Let's combine snippet repos! (Much of this is done asynchronously for efficiency).

1. Clones **their** snippets into a temp dir
2. Moves **your** snippets into a temp dir
3. Moves **their** snippets into your snippets dir
4. Performs a merge of all json objects (**theirs** \<-- **yours**)

*Important Note:* This wipes your local git history and replaces it with theirs.

See the [Collaborate Flow](/docs/github-integration/truly-global/collaborate-flow.md) for a flow chart.

### Start Fresh

*Replace your local snippets with the ones from the remote repository.*

1. Your global snippets repo is emptied
2. Runs `git pull` to snippets repository you chose.

## After the Merge Step

After the merge, the extension runs `git commit` and `git push`.