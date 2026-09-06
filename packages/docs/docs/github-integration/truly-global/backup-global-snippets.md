---
title: Sync Global Snippets
sidebar_label: Sync Global Snippets
sidebar_position: 1
---

# Sync Global Snippets

Want to use the same collection of snippets on you work computer AND your personal computer?

## How it works

1. Choose `Sync Global Snippets` in the <i className="codicon codicon-ellipsis"></i> three-dot menu of **Locations Manager** or run `snippetstudio.github.sync` in the command prompt
2. Grant [permissions](/docs/github-integration/authentication.md) if necessary
3. A [carefully crafted git workflow](/docs/github-integration/truly-global/sync-flow.md) will get your snippets to github and pull any down that you don't have

### Git repo

By default, the repo <i className="codicon codicon-source-control"></i> will be named `snippetstudio-vscode-snippets`. You can choose to use a different remote by changing the `snippetstudio.github.globalSnippetsRepository` configuration setting.
