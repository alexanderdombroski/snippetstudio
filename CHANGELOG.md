# Change Log

<!-- Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file. -->

## [Unreleased]

### Added

- Support for snippets to have multiple prefixes or languages 
- Tools to assist in adding tabstops and tabstops w/ labels
- Choose snippets to export to a single snippet file.

## [1.0.2] - 2025-03-22

### Fixed

- Old snippet editors of deleted buffers from previous vscode sessions are automatically closed when the extension is loaded.

### Changed

- Simplified readme
- Improved CI/CD

## [1.0.1] - 2025-03-21

### Added

- Logo

### Fixed

- Readme badges
- Fixed CI/CD

## [1.0.0] - 2025-03-21

### Added

- **Snippet Management:**
    - Create new snippets
    - View snippets in the snippets tree view
    - Update existing snippets
    - Delete snippets
- **Snippet File Management:**
    - Create, View, and Delete Snippet Files
- **User Interface:**
    - Snippet Editor Webview
    - Snippets Treeview
    - Locations Manager Treeview
    - Status Bar Snippet Indicator
- **Snippet Editor Functionality:**
    - Buffer System for editing snippet content
    - Load content into buffer when creating a snippet from selection
