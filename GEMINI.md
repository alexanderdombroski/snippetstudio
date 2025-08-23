# Gemini Code Assistant Guide for Snippet Studio

## Coding Style and Conventions

- **Language:** All code should be written in TypeScript.
- **Linting:** The project uses ESLint for linting. Please ensure that your code passes the linter before submitting a pull request.
- **Naming Conventions:**
  - Use camelCase for variables and functions.
  - Use PascalCase for classes and interfaces.
  - Prefix interfaces with `I` (e.g., `ISnippet`).
- **Comments:** Use JSDoc-style comments for all public functions and classes.

## Best Practices

- **Modularity:** Keep functions and classes small and focused on a single responsibility.
- **Asynchronous Operations:** Use `async/await` for all asynchronous operations.
- **VS Code API:** When interacting with the VS Code API, use the `vscode` module.
- **Dependencies:** Use `npm` to manage dependencies. Add new dependencies to the `package.json` file.

## Tests

- Use `vitest` for all tests.
- All vscode imports are premocked inside of `.vitest/setup.ts`. Don't worry about mocking vscode imports or the `src/vscode.ts` file.
- Write test files next to the file to be tested. Use a `.test.ts` file extension.

## NEVER do these things

- Don't run any git commands in the terminal, I will keep close watch of the features you add and commit as I go
- Don't create any tags. Pushing a new tag triggers a new release of the extension.

### ABSOLUTLY MOST IMPORTANT

- Only modify a file if I directly give it to you as a reference like `@fileToEdit.ts`. Only make the requested changes. Ignore TODO's in other files.
