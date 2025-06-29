# Gemini Code Assistant Guide for Snippet Studio

This document provides guidance for using the Gemini Code Assistant to contribute to the Snippet Studio VS Code extension. It outlines the project's structure, coding conventions, and best practices to ensure that new code is consistent with the existing codebase.

## Project Overview

Snippet Studio is a VS Code extension that provides a graphical user interface (GUI) for managing and creating VS Code snippets. The extension is written in TypeScript and uses the VS Code Extension API.

## Codebase Structure

The codebase is organized into the following directories:

-   `src/commands`: Contains the command handlers for the extension. Each file in this directory should export a function that registers one or more commands.
-   `src/snippets`: Contains the logic for loading, parsing, and saving snippets.
-   `src/ui`: Contains the code for the webview and tree-view based UI.
-   `src/test`: Contains the tests for the extension. Don't add any tests.
-   `src/types`: Contains the type definitions for the project.
-   `src/utils`: Contains utility functions that are used throughout the extension.

## Coding Style and Conventions

-   **Language:** All code should be written in TypeScript.
-   **Formatting:** The project uses Prettier for code formatting. Please ensure that your code is formatted with Prettier before submitting a pull request.
-   **Linting:** The project uses ESLint for linting. Please ensure that your code passes the linter before submitting a pull request.
-   **Naming Conventions:**
    -   Use camelCase for variables and functions.
    -   Use PascalCase for classes and interfaces.
    -   Prefix interfaces with `I` (e.g., `ISnippet`).
-   **Comments:** Use JSDoc-style comments for all public functions and classes.

## Best Practices

-   **Modularity:** Keep functions and classes small and focused on a single responsibility.
-   **Asynchronous Operations:** Use `async/await` for all asynchronous operations.
-   **VS Code API:** When interacting with the VS Code API, use the `vscode` module.
-   **Dependencies:** Use `npm` to manage dependencies. Add new dependencies to the `package.json` file.
-   **Testing:** Don't write any unit tests for new features and bug fixes.

## NEVER do these things

Version Control
- Don't run any git commands in the terminal, I will keep close watch of the features you add and commit as I go
- Don't create any tags. Pushing a new tag triggers a new release of the extension.