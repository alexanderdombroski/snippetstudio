# Snippet Studio

This VSCode extension provides a GUI for easy CRUD operations on [VSCode snippets](https://code.visualstudio.com/docs/editor/userdefinedsnippets) and VSCode snippet files. It allows you to see a list of custom snippets of the current language, edit them and create new ones.

[![GitHub](https://img.shields.io/badge/GitHub-Repo-blue?logo=github)](https://github.com/alexanderdombroski/snippetstudio) [![Version](https://badge.fury.io/gh/alexanderdombroski%2Fsnippetstudio.svg)](https://badge.fury.io/gh/alexanderdombroski%2Fsnippetstudio)

## Table of Contents

- [Features](#features)
    - [Managing Snippets](#managing-snippets)
    - [Managing Snippet Files](#managing-snippet-files)
    - [Creating Snippets](#creating-snippets)
- [Requirements](#requirements)
- [Extension Settings](#extension-settings)
- [Known Issues](#known-issues)
- [Release Notes](#release-notes)
- [Liscense & Contributions](#liscense--contributions)

## Features

### Managing Snippets

The **Snippets** tree view loads all snippets of the current language. Whenever the current active language changes, the view updates.

* Click the `+` in the title menu to add a global snippet of the current language.
* Click the pencil to edit an existing snippet
* Right click to delete a snippet or snippet file.

![Edit Snippet Example](https://raw.githubusercontent.com/alexanderdombroski/snippetstudio/refs/heads/main/public/examples/edit.gif)

### Managing Snippet Files

The **Locations Manager** tree view shows you all snippet files found on your filesystem. 

**View Options**
* **Create Global Snippets File** - Creates a snippet file of the current language to load sippets anytime accessing that language in VSCode.
* **Create Global Mixed Snippets File** - Creates a `global.code-snippets` snippet file that can hold snippets of any language, to always be loaded.
* **Create Local Snippets File** - Creates a snippet file of the current language in the .vscode folder local to the current open project.
* **Create Global Mixed Snippets File** - Creates a project snippets file in the .vscode folder local to the current open project.

You can also open or delete language files by right clicking, or add snippets to the selected location.

### Creating Snippets

The **Snippet Editor** webview only appears when creating snippets.

![Creating a Snippet from Selection](https://raw.githubusercontent.com/alexanderdombroski/snippetstudio/refs/heads/main/public/examples/selection.gif)

1. Write the snippet code in the open buffer. Closing the editor will discard snippet changes and delete the buffer.
2. Fill out the form and click save. The snippet works if you can type the prefix in a file of the language and it appears in the autocomplete box. The title is the hint, the prefix appears on the left, and the snippet code and description show when interacting with the autocomplete menu. Type TAB to load the snippet's code into your code.

![Delete Snippet Example](https://raw.githubusercontent.com/alexanderdombroski/snippetstudio/refs/heads/main/public/examples/delete.gif)

Read more about vscode snippets the [vscode snippet documentation](https://code.visualstudio.com/docs/editor/userdefinedsnippets).

## Requirements

* **VS Code Version:** This extension requires VS Code version 1.97.0 or higher.
* **Node.js Version:** This extension requires Node.js version 20.0.0 or higher.
* **Virtual Workspaces:** This extension has limited support for virtual workspaces. It relies on accessing the file system and Node.js file-related modules (fs, path, glob), which may not be fully available in virtual workspace environments.
* **File System Access:** This extension requires access to your local file system to manage VS Code snippets and snippet files.
* **Web Version:** This extension is not compatible with the web version of VS Code due to its reliance on Node.js file system APIs.

This extension isn't yet tested on the web version of vsocde and likely won't work. The web version operates in a sandboxed browser environment that restricts direct file system interactions.

## Extension Settings

This extension contributes the following settings to enhance your SnippetStudio experience:

### Snippet Behavior

* `snippetstudio.confirmSnippetDeletion`:
    * **Type:** `boolean`
    * **Default:** `false`
    * **Description:** Indicates whether to show a warning dialog before deleting a snippet.

* `snippetstudio.defaultSnippetPrefix`:
    * **Type:** `string`
    * **Description:** Sets a default placeholder prefix that will be suggested when creating new snippets.

* `snippetstudio.autoCapitalizeSnippetName`:
    * **Type:** `boolean`
    * **Default:** `false`
    * **Description:** Automatically capitalizes the first letter of a snippet's Title Key when it is created.

* `snippetstudio.cleanupSnippetSelection`:
    * **Type:** `boolean`
    * **Default:** `true`
    * **Description:** When creating a snippet from a multi-line selection, this setting controls the following adjustments:
        * Ensures the selection includes the entirety of each selected line.
        * Converts leading tabs within the selection to spaces.
        * Evenly removes any shared leading tabs/spaces present across all selected lines.
        This setting only affects the behavior during snippet creation from a text selection.

### User Interface

* `snippetstudio.showStatusBarItem`:
    * **Type:** `boolean`
    * **Default:** `true`
    * **Description:** Controls the visibility of the SnippetStudio indicator in the VS Code status bar.

* `snippetstudio.statusBarPriority`:
    * **Type:** `integer`
    * **Default:** `30`
    * **Description:** Determines the priority of the SnippetStudio status bar item. Higher numerical values result in the item appearing further to the left in the status bar.

### Snippet File

* `snippetstudio.autoCreateSnippetFiles`:
    * **Type:** `boolean`
    * **Default:** `true`
    * **Description:** Automatically creates a snippet file when saving a snippet if it doesn't exist.

## Known Issues

Record your issues in the q&a or in the github repository.

[![GitHub Open Issues](https://img.shields.io/github/issues-raw/alexanderdombroski/snippetstudio)](https://github.com/alexanderdombroski/snippetstudio/issues)

[![Known Vulnerabilities](https://snyk.io/test/github/alexanderdombroski/snippetstudio/badge.svg)](https://snyk.io/test/github/alexanderdombroski/snippetstudio)

### Important Notes

Having comments in your snippet json files will not break this extension, but the extension will delete the comments of every single snippet file it reads.

Titles of snippets must be unique, due to the format VSCode uses for storing snippet files in json. Changing a snippet title will create a copy of the snippet, and the old one can be deleted. Creating a new snippet with a duplicate snippet titlekey will delete the old snippet of the duplicate name.

## Release Notes

See the changelog [here](https://github.com/alexanderdombroski/snippetstudio/blob/main/CHANGELOG.md)!

## Liscense & Contributions

This extension is open source! Feel free to add [github](https://github.com/alexanderdombroski/snippetstudio) issues and recommondations. I am open to ideas of how you can collaborate.

<!-- https://code.visualstudio.com/api/working-with-extensions/publishing-extension -->

[![License](https://img.shields.io/github/license/alexanderdombroski/snippetstudio)](https://github.com/alexanderdombroski/snippetstudio?tab=MIT-1-ov-file#readme)

**Star this project!**

[![GitHub Stars](https://img.shields.io/github/stars/alexanderdombroski/snippetstudio?style=social)](https://github.com/alexanderdombroski/snippetstudio)