---
id: backup-and-restore-snippets
title: Backing Up and Restoring Snippets
sidebar_position: 60
---

This guide shows how to back up all your snippets and import them later using `.code-profile` files in VS Code with the SnippetStudio extension.

### What is a .code-profile file?

A `.code-profile` file is a JSON document that can include settings, keybindings, extensions, and—importantly for us—snippets. SnippetStudio can extract the snippet content from a `.code-profile` and save it as standard VS Code snippet files (`.code-snippets` or language-scoped `.json`).

When SnippetStudio imports snippets from a `.code-profile`:
- It parses the `snippets` section.
- It writes one or more `.code-snippets` files to a destination you choose.
- If a snippet file is language-scoped (like `python.json`), it converts those into `.code-snippets` and assigns the language to `scope` automatically.

---

## Back up your snippets

You can back up snippets using SnippetStudio’s export features:

1. Open the command palette and run: `SnippetStudio: Export Snippet Files`.
2. Choose where to save the exported `.code-snippets` files.
3. Optionally commit these files to your dotfiles repo, store them in cloud storage, or embed them into a `.code-profile` you share.

Tip: You can also extract snippets from installed extensions using `SnippetStudio: Copy Extension Snippets for Safe Editing`, then include those in your backup.

---

## Import snippets from a .code-profile

Use the dedicated command to read snippets from a `.code-profile` and write them into your VS Code snippets directory.

1. Open the command palette and run: `SnippetStudio: Copy Snippets from .code-profile`.
2. Pick a source:
   - From profile template: Uses Microsoft’s official profile templates (e.g., Python, JavaScript) and fetches the profile from the VS Code CDN.
   - From a gist: Prompts for a GitHub Gist ID and reads any `.code-profile` file(s) in that gist.
   - From a file: Opens the file picker so you can select local `.code-profile` files.
   - From a url: Fetches a raw `.code-profile` from a direct URL.
3. Choose where to save the imported snippets when prompted:
   - Local (workspace `.vscode/`): Adds snippet files scoped to your current project.
   - Global (user profile): Adds snippet files to your active VS Code profile’s snippets directory.

SnippetStudio will process the `.code-profile`, extract the `snippets` payload, and write the resulting `.code-snippets` files. If a filename already exists, it will generate a unique filename to avoid overwriting.

---

## Where can the .code-profile be read from?

SnippetStudio supports multiple input locations:

- File picker: Any `.code-profile` on your local filesystem.
- GitHub Gist: Provide a Gist ID; SnippetStudio will import any `.code-profile` files found there.
- URL: Paste a direct URL to the raw `.code-profile` file.
- Built-in templates: Select an official profile template (e.g., `python`, `javascript`) which is fetched from the VS Code CDN.

Destination options when saving imported snippets:
- Local workspace: Stored under `.vscode/` in the current workspace.
- Global user profile: Stored in your active VS Code profile’s snippets directory.

---

## Example commands

- `SnippetStudio: Copy Snippets from .code-profile`
- `SnippetStudio: Export Snippet Files`
- `SnippetStudio: Copy Extension Snippets for Safe Editing`

If you prefer the keyboard, open the Command Palette (Ctrl/Cmd+Shift+P) and type the command names above.

---

## Related links

- VS Code Profiles documentation: [`https://code.visualstudio.com/docs/editor/profiles`](https://code.visualstudio.com/docs/editor/profiles)
- SnippetStudio on VS Code Marketplace: [`https://marketplace.visualstudio.com/items?itemName=AlexDombroski.snippetstudio`](https://marketplace.visualstudio.com/items?itemName=AlexDombroski.snippetstudio)


