---
title: Authentication
sidebar_label: Authentication
sidebar_position: 1
---

# Authentication

There is a [simple process](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps#device-flow) to give permission to a GitHub [OAuth app](https://docs.github.com/en/apps/oauth-apps) to act on your behalf.

## Steps

1. Use a GitHub related SnippetStudio feature
2. Choose to give permission. A code will be copied to your clipboard
3. Paste the code in the GitHub page the opens
4. After following the prompts and granting permissions, SnippetStudio will continue the feature you chose to run

## Permissions & Usage

SnippetStudio OAuth app will ask for `public_repo` and `gist` [permission scopes](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps#available-scopes).

- [Gists](/docs/github-integration/gists.md) allow you to save file(s) on github without creating a repo. Good for snippets you want to export and share without having to send a file
- A repo `https://github.com/<username>/snippetstudio-vscode-snippets.git` will be created so you can save and version control <i className="codicon codicon-source-control"></i> your global snippets by running `Sync Global Snippets`
