# Change Log

<!-- Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file. -->

## [Unreleased] - Date

### Added

* Support for snippets to have multiple prefixes and languages 
* Choose snippets to export to a single snippet file.
* Snippet Sort Options
* Use vscode.workspace.fs to allow web vscode to write create project snippets

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
