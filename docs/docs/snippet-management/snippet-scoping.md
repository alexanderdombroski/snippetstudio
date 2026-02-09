--- 
sidebar_label: Snippet Scoping
title: Working with profile snippets
sidebar_position: 7
---

## Snippet Scopes

Snippets can be scoped in different ways to control where they are available. The following scopes provide increasing levels of specificity.

### Language Snippet Scope

Language snippet scope limits a snippet to files of a specific programming language.

* Defined using a language identifier (for example: `javascript`, `python`)
* Applies to **all files** of that language in the workspace
* Best for language-specific constructs and patterns

**Example use cases**

* Common `for` or `if` templates for a language
* Framework-specific helpers (e.g. React hooks in TypeScript files)

---

### Project Snippet Scope

Project snippet scope makes a snippet available across the entire workspace, regardless of language or file type.

* Applies to all files in the project
* Useful for organization- or project-specific conventions

**Example use cases**

* Standard file headers or copyright notices
* Boilerplate comments shared across multiple languages
* Internal tooling snippets used throughout the repo

---

### File Pattern Scope

File pattern scope restricts snippets to files that match one or more glob patterns.

* Uses glob-style patterns (for example: `src/**/*.ts`, `**/*.test.ts`)
* Allows very fine-grained control over snippet availability
* Can be combined with include and exclude rules

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
  "include": ["src/**/*.ts"],
  "exclude": ["**/*.test.ts"]
}
```

This makes the snippet available only in TypeScript source files, excluding tests.

---

### Example: Project-wide snippet excluding generated files

```json
{
  "scope": "project",
  "exclude": ["dist/**", "node_modules/**"]
}
```

This provides a project-level snippet while avoiding build output and dependencies.

---

### Example: File pattern scope for test utilities

```json
{
  "scope": "filePattern",
  "include": ["**/*.test.ts", "**/*.spec.ts"]
}
```

This snippet appears only in test files, regardless of language configuration elsewhere.

---

:::caution VS Code Version Support
File pattern scope is only supported on platforms that use **VS Code version 1.109 or newer**.
On older versions, file pattern–scoped snippets will be ignored.
:::

---

