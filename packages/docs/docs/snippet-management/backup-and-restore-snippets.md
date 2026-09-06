---
title: Snippet Backups
sidebar_label: Snippet Backups
sidebar_position: 10
---

This guide shows how to back up all your snippets and import them later using `.code-profile` files in VS Code with the SnippetStudio extension.

## What is a .code-profile file?

A `.code-profile` file is a JSON document that can include settings, keybindings, extensions, and snippets. SnippetStudio can extract the snippet content and save it as standard VS Code snippet files.

When SnippetStudio imports snippets from this file:
- It parses the `snippets` section.
- It writes all of the snippets files to a destination you choose.

VS Code has a built in command to [export](https://code.visualstudio.com/docs/configure/profiles#_export) one of your [profiles](https://code.visualstudio.com/docs/configure/profiles) to a .code-profile file.

## Import snippets from a .code-profile

Use the dedicated command to read snippets from a `.code-profile` and write them into your VS Code snippets directory.

1. Open the command palette and run: **SnippetStudio: Copy Snippets from .code-profile**.
2. Pick a source:
   - From profile template: Uses Microsoft’s official profile templates (e.g., Python, JavaScript) and fetches the profile from the VS Code CDN.
   - From a gist: Prompts for a GitHub Gist ID and reads any .code-profile file(s) in that gist.
   - From a file: Opens the file picker so you can select local .code-profile files.
   - From a url: Fetches a raw .code-profile json from a direct URL.
3. Choose where to save the imported snippets when prompted:
   - Local (workspace): Adds snippet files scoped to your current project.
   - Global (user profile): Adds snippet files to your active VS Code profile’s snippets directory.
   - Downloads - Your downloads directory

SnippetStudio will process the .code-profile file, extract the snippets, and write the resulting snippet files. If a filename already exists, it will generate a unique filename to avoid overwriting.

### Where can the .code-profile be read from?

SnippetStudio supports multiple input locations:

- File picker: Any .code-profile on your local filesystem.
- GitHub Gist: Provide a Gist ID; SnippetStudio will import any .code-profile files found there.
- URL: Paste a direct URL to the raw .code-profile file.
- Built-in templates: Select an official profile template (e.g., python, javascript) which is fetched from the VS Code CDN.

---

This command is good for importing code profile snippets without altering current snippets. Read [import](https://code.visualstudio.com/docs/configure/profiles#_import) to see the normal way of applying ALL parts of a VS Code profile. 
