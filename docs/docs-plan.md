
# Docs/

- TODO - on startup

- [ ] Getting Started
    - [X] Installation
    - [X] Your First Snippet
        * Add a new snippet with `snippetstudio.snippet.addGlobal` or `snippetstudio.file.createSnippetAt`.
        * Create a snippet from selected code with `snippetstudio.snippet.createGlobalLangSnippetFromSelection`.
        * Save your new snippet using the editor and `snippetstudio.editor.save`.
- [ ] Snippet Management
    - [X] The "VS Code" Way
    - [X] Global vs Local Snippets
        * `snippetstudio.file.createGlobalLang` for language-specific global snippets.
        * `snippetstudio.file.createGlobalSnippets` for mixed-language global snippets.
        * `snippetstudio.file.createProjectSnippets` for project-level snippets.
    - [X] Snippet CRUD
        * Creating Snippets:
            * `snippetstudio.snippet.addGlobal`
            * `snippetstudio.file.createSnippetAt`
            * `snippetstudio.snippet.createGlobalLangSnippetFromSelection`
        * Creating Snippet Files:
            * `snippetstudio.file.createGlobalLang`
            * `snippetstudio.file.createProjectSnippets`
            * `snippetstudio.file.createGlobalSnippets`
        * Reading/Viewing Snippets:
            * `snippetstudio.snippet.showBody`
            * `snippetstudio.file.open`
            * `snippetstudio.file.openFromDouble`
        * Updating Snippets:
            * `snippetstudio.snippet.edit`
            * `snippetstudio.editor.save`
            * `snippetstudio.editor.cancel`
        * Deleting Snippets & Files:
            * `snippetstudio.snippet.delete`
            * `snippetstudio.file.delete`
        * Refreshing Views:
            * `snippetstudio.refresh`
            * `snippetstudio.refreshLocations`
        - [ ] Filereading UML Logic
    - [X] Snippet Insertion Features
        * Explain the special syntax for creating dynamic snippets.
        * Tabstops: `snippetstudio.editor.insertTabStop`
        * Placeholders: `snippetstudio.editor.insertPlaceholder`
        * Choices: `snippetstudio.editor.insertChoice`
        * Variables: `snippetstudio.editor.insertVariable`
        * Variables with Placeholders: `snippetstudio.editor.insertVariablePlaceholder`
        * Placeholders with Transformations: `snippetstudio.editor.insertPlaceholderWithTranformation`
    - [X] Export Snippets
        * `snippetstudio.snippet.export`
        * Configure export location with `snippetstudio.export.location`.
        * Set a custom path with `snippetstudio.export.preconfiguredExportPath`.
    - [ ] Coming Soon
        - [ ] Move Snippets
        - [ ] Merge Snippets
- [X] GitHub Integration
    - [X] Authentication
        * Explain how to authenticate with GitHub to use Gist and repository features.
    - [X] Gists
        * Export snippets to a Gist with `snippetstudio.github.export`.
        * Import snippets from a Gist with `snippetstudio.github.import`.
        * Browse your Gists on GitHub with `snippetstudio.github.browse`.
        * Configure Gist import with `snippetstudio.gists.onlySnippets`.
    - [X] Backup Global Snippets
        - [X] Snippet Sync
            * Use `snippetstudio.github.sync` to back up and sync global snippets to a repository.
        - [X] Sync UML Logic
    - [X] Merge Repositories
        - [X] Snippet Merge
            * Use `snippetstudio.github.merge` to merge snippets from another repository.
        - [X] Merge UML Logic
        - [X] Collaborate UML Logic
- [ ] Configuration
    * Open settings with `snippetstudio.openSettings`.
    - [ ] Editor 
        * `snippetstudio.confirmSnippetDeletion`
        * `snippetstudio.defaultSnippetPrefix`
        * `snippetstudio.autoCapitalizeSnippetName`
        * `snippetstudio.cleanupSnippetSelection`
        * `snippetstudio.autoCreateSnippetFiles`
        * `snippetstudio.editor.autoEscapeDollarSigns`
        * `snippetstudio.editor.autoEscapeDollarSignsFromSelection`
        * `snippetstudio.editor.useQuickPickForVariableInsertion`
        * `snippetstudio.editor.enableEditorForceSaveButton`
        * `snippetstudio.editor.autoFillSnippetFeatureIds`
        * `snippetstudio.alwaysShowProjectSnippetFiles`
    - [ ] Status Bar Item
        * `snippetstudio.statusBar.showItem`
        * `snippetstudio.statusBar.showLanguage`
        * `snippetstudio.statusBar.priority`
    - [ ] Change Git Url
        * `snippetstudio.github.globalSnippetsRepository`
- [ ] Troubleshooting
    - [ ] Markdown Snippets
