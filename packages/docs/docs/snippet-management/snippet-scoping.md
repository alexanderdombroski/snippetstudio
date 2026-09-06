--- 
sidebar_label: Snippet Scoping
title: Advanced Snippet Scoping
sidebar_position: 7
---

Snippets can be scoped in different ways to control where they are available. The following scopes provide increasing levels of specificity.

### Language Snippet Scope

[Language snippet scope](https://code.visualstudio.com/docs/editing/userdefinedsnippets#_language-snippet-scope) limits a snippet to files of a specific programming language. `<lang>.json` files include scope in the name, and `<name>.code-snipppets` files can include a scope property for each snippet.

* Defined using a language identifier (for example: `javascript`, `python`)
* Applies to **all files** of that language in the workspace
* Best for language-specific constructs and patterns

**Example use cases**

* Common `for` or `if` templates for a language
* Framework-specific helpers (e.g. React hooks in TypeScript files)

---

### Project Snippet Scope

[Project snippet scope](https://code.visualstudio.com/docs/editing/userdefinedsnippets#_project-snippet-scope) makes a snippet available across the entire workspace, regardless of language or file type. Other workspaces won't have access to the local snippets.

* Applies to all files in the project
* Useful for organization or project-specific conventions <i className="codicon codicon-folder"></i>

**Example use cases**

* Standard file headers or copyright notices
* Boilerplate comments shared across multiple languages
* Internal tooling snippets used throughout the repo

---

### File Pattern Scope

[File pattern scope](https://code.visualstudio.com/docs/editing/userdefinedsnippets#_file-pattern-scope) restricts snippets to files that match one or more glob patterns.

* Uses glob-style <i className="codicon codicon-regex"></i> patterns (for example: `src/**/*.ts`, `**/*.test.ts`)
* Allows very fine-grained control over snippet availability
* Can be combined with `include` and `exclude` rules

**Example use cases**

* Test-only snippets limited to `**/*.spec.ts`
* Framework-specific snippets for files under `src/components/**`
* Configuration snippets for files like `*.config.js`

---

## Mixing Scope, Include, and Exclude Fields

Scopes can be combined with `include` and `exclude` fields to precisely control where snippets appear.

### Example: Limit a snippet to source TypeScript files

```json
{
  "scope": "typescript",
  "include": ["*.ts"],
  "exclude": ["*.test.ts"]
}
```

This makes the snippet available only in TypeScript source files, excluding tests.

---

### Example: File pattern scope for test utilities

```json
{
  "scope": "javascript",
  "include": ["**/*.test.js", "**/*.spec.js"]
}
```

This snippet appears only in test files, regardless of language configuration elsewhere.

### Example: Configuration File Template

```json
{
  "scope": "json",
  "isFileTemplate": true,
  "include": ".prettierrc"
}
```

This [file template](https://code.visualstudio.com/docs/editing/userdefinedsnippets#_file-template-snippets) <i className="codicon codicon-collection"></i> will only appear in the **Snippets: Fill File with Snippet** command quick pick if the file matches.

---

:::caution VS Code Version Support
File pattern scope is only supported on platforms that use **VS Code version 1.109 or newer**.
On older versions, file pattern–scoped snippets will be ignored.
:::

You can also scope snippets to only be used by specifc profiles. Read about Profile Snippets <i className="codicon codicon-organization"></i> next

---

