# Gemini Code Assistant Guide for Snippet Studio

## Coding Style and Conventions

- **Language:** All code should be written in TypeScript.
- **Naming Conventions:**
  - Use camelCase for variables and functions.
  - Use PascalCase for classes and interfaces.
- **Comments:** Use JSDoc-style comments for all public functions and classes.

## Best Practices

- **Modularity:** Keep functions and classes small and focused on a single responsibility.
- **Asynchronous Operations:** Use `async/await` for all asynchronous operations.
- **VS Code API:** When interacting with the VS Code API, use the `vscode` module.
- **Dependencies:** Use `npm` to manage dependencies. Add new dependencies to the `package.json` file.

## Tests (vitest)

- Use `vitest` for all tests.
- All vscode imports are premocked inside of `.vitest/setup.ts` and `.vitest/__mocks__/vscode.ts`. Don't worry about mocking vscode imports or the `src/vscode.ts` file.
- `src/vscode.ts` is a barrel file for the vsocde api. If a function is imported through the barrel in the file, it should also be imported via barrel in the test file.
- Write test files next to the file to be tested. Use a `.test.ts` file extension.
- Don't run the tests after writing the test file.
- import `Mock` and `Mocked` as a type. `vi.Mock` isn't valid vitest syntax.
- prefer `it` instead of `test`.

## NEVER do these things

- Don't run any git commands in the terminal, I will keep close watch of the features you add and commit as I go
- Don't create any tags. Pushing a new tag triggers a new release of the extension.

### ABSOLUTLY MOST IMPORTANT

- Only modify a file if I directly give it to you as a reference like `@fileToEdit.ts`. Only make the requested changes. Ignore TODO's in other files.
