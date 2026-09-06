---
title: Global vs Local Snippets
sidebar_label: Global vs Local Snippets
sidebar_position: 2
---

# Global vs Local Snippets

VS Code has [two kinds](https://code.visualstudio.com/docs/editing/userdefinedsnippets#_snippet-scope) of snippet files: `<language>.json` and `<filename>.code-snippets`.

## File Creation Commands

SnippetStudio can create these files using the <i className="codicon codicon-ellipsis"></i> three-dot menu of the **Locations Manager** sidebar view, or by using the [command pallete](https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette). 

### Create Global Language Snippets File

- Command: `snippetstudio.file.createGlobalLang`
- Creates a snippet file matching the language of the currently open editor. 

### Create Global Mixed Snippets File

- Command: `snippetstudio.file.createGlobalSnippets` 
- Creates a mixed-language global .code-snippets snippets.

### Create Local Project Snippets File

- Command: `snippetstudio.file.createProjectSnippets` 
- Creates a project-level .code-snippets snippets.

## Folder Location

**Global Snippets** exist deep in the VS Code configuration of your computer

| Operating System | Snippets Folder Location                                      |
|------------------|---------------------------------------------------------------|
| Linux            | `~/.config/Code/User/snippets`                                |
| macOS            | `~/Library/Application Support/Code/User/snippets`            |
| Windows          | `C:\Users\username\AppData\Roaming\Code\User\snippets`        |

<p className="small">*Operating systems listed in the order of how cool they are.*</p>

**Local Snippets** exist in the `.vscode` folder of any directory.

Globals are expandable system-wide and locals are expandable only while coding in the directory they were created in.

## Filetype Differences

Global or Local .code-snippets snippets can be scoped to multiple languages. If the `scope` property is left blank, it is visible to any language.

See a [list of recognized languages](https://code.visualstudio.com/docs/languages/identifiers#_known-language-identifiers) to use in the scope field.
