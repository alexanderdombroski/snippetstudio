# Change Log

<!-- Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file. -->

## Table of Contents

- [Unreleased](#unreleased---date)
- [1.3](#131---2025-05-03) - Export Snippets
- [1.2](#121---2025-04-15) - Export Snippets
- [1.1](#111---2025-04-08) - Snippet Insertion Features
- [1.0](#103---2025-03-22) - Initial Release

## [Unreleased] - Date

### Added

* **Web Support** (v2.0)
    * Use vscode.workspace.fs to create project snippets
    * Global Snippet Commands not visible to web users
* **Global Snippet Backup and Collaboration** (v1.5)
    * Backup global snippets to github repo
    * Use the same global snippets on multiple computers
    * Push and Pull snippet changes
    * Combine all snippets from two repositories
    * Several Git workflows handled by simple-git
* **Misc**
    * More commands and extension resources are lazily loaded, to improve performance.

## [1.4.0] - 2025-05-12

### Added

* Added snippet completion items for snippet insertion features useable in the snippet editor.
* Snippet Insertion Feature Syntax Highlighting
* Setting to enable more autoescape. When creating a snippet from a selection, patterns that would unintentionally become a tabstop are automatically escaped.

## [1.3.1] - 2025-05-03

### Added

* Added button to browse snippets gists created by anyone using this extension.

## [1.3.0] - 2025-04-17

### Added

* Export to GitHub Gist Command
* Import from GitHub Gist Command
* Setting to only import snippet files, or all files

## [1.2.1] - 2025-04-15

### Added

* Setting to show project snippet files with no dropdown when there are no snippets of the active language
* Setting to show active language in status bar
* Setting to add placeholders for snippet insertion feature IDs

### Changed

* Project Snippet files are hidden by default in the snippet view if they contain no snippets of the active language
* Active language no longer shows in status bar by default, as vscode has a statusbar item built in for it

## [1.2.0] - 2025-04-11

### Added

* Command to merge and export snippet files
* Settings to preconfigure save desinations of snippet file exports
* Support for multiple prefixes and scopes by using comma delimiters.

### Fixed

* Snippets added manually with mutliple scopes now correctly load when the language is open.
* insertPlaceholderWithTranformation now works properly when insertVariable is set to use quick picks.

### Changed

* Hid accept icon behind experimental setting because it bypasses form validation. 

## [1.1.1] - 2025-04-08

### Added

* Double Click to open a snippet file
* Trashcan to delete snippet or snippet file
* Added snippet feature: [placeholder transformation](https://code.visualstudio.com/docs/editing/userdefinedsnippets#_variable-transforms)

### Fixed

* Snippets without a description no longer have "undefined" at the end of the tooltip.

## [1.1.0] - 2025-03-24

### Added

* Added commands to insert [tabstops, placeholders, and choice placeholders](https://code.visualstudio.com/docs/editor/userdefinedsnippets#_snippet-syntax).
* Added keyboard shortcuts for snippet insertion features.
* Added optional setting to auto escape dollar signs to prevent creation of unintentional snippet insertion features.
* Added tooling for snippet insertion [variables and variable placeholders](https://code.visualstudio.com/docs/editor/userdefinedsnippets#_variables)

### Fixed

* Removed unnessary buffer information warning popups.
* Settings gear now correctly shows settings only of this extension.

### Changed

* Added categories to group related settings
* Added categories to group related commands

## [1.0.3] - 2025-03-22

### Added

* Added right click commands for Global and Local Snippet File Dropdowns.

### Fixed

* Prompts you to select a language for creating language specific snippet files if none is being used.
* Global Snippets still load if no workspace folder is open.
* All *.code-snippets files are supported in the global dir, not just global.code-snippets
* Removed tooling for unsupported Local language specific .json snippet files.

### Changed

* Local Snippets file dropdown doesn't render if no workspace folder is open.

## [1.0.2] - 2025-03-22

### Fixed

* Old snippet editors of deleted buffers from previous vscode sessions are automatically closed when the extension is loaded.

### Changed

* Simplified readme
* Improved CI/CD

## [1.0.1] - 2025-03-21

### Added

* Logo

### Fixed

* Readme badges
* Fixed CI/CD

## [1.0.0] - 2025-03-21

### Added

* **Snippet Management:**
    * Create new snippets
    * View snippets in the snippets tree view
    * Update existing snippets
    * Delete snippets
* **Snippet File Management:**
    * Create, View, and Delete Snippet Files
* **User Interface:**
    * Snippet Editor Webview
    * Snippets Treeview
    * Locations Manager Treeview
    * Status Bar Snippet Indicator
* **Snippet Editor Functionality:**
    * Buffer System for editing snippet content
    * Load content into buffer when creating a snippet from selection
