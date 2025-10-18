# Importing snippets from Xcode — Proof of Concept

This document explains a proof-of-concept for importing Xcode user snippets into Snippet Studio. It answers the basic questions about where Xcode stores snippets, whether each snippet is a separate file, and provides a small Node.js script that extracts key fields from `.codesnippet` files and logs them.

## 1. Where Xcode stores user snippets

Xcode user snippets are stored in the user's Library folder:

- ~/Library/Developer/Xcode/UserData/CodeSnippets/

You can inspect that folder to see existing `.codesnippet` files.

## 2. Does each Xcode snippet need its own file?

Yes. Xcode represents each user snippet as a single `.codesnippet` file (a plist). To import snippets, treat each `.codesnippet` file as one snippet.

## 3. What data we can extract

Typical keys in a `.codesnippet` plist include:

- `IDECodeSnippetIdentifier` — UUID
- `IDECodeSnippetTitle` — Title/name
- `IDECodeSnippetSummary` — Description/summary
- `IDECodeSnippetContents` — Snippet body (may include Xcode placeholders `<#name#>`)
- `IDECodeSnippetCompletionPrefix` — Trigger prefix
- `IDECodeSnippetLanguage` — Language

This PoC script extracts `title`, `contents` (body), `summary` (description), and `completion prefix`.

## 4. PoC script: extract fields and log

Place the included script `importFromXcode.js` in `research/xcode` (it's already included in this repo). The script reads either a single `.codesnippet` file or all `.codesnippet` files in a directory and logs JSON objects with the following fields: `file`, `id`, `title`, `description`, `prefix`, `body`, `language`.

The script uses the macOS `plutil` tool to convert the plist to JSON. Example usage:

- Log a single file:

```bash
node research/xcode/importFromXcode.js ~/Library/Developer/Xcode/UserData/CodeSnippets/MySnippet.codesnippet
```

- Log all snippets in the default Xcode snippets folder:

```bash
node research/xcode/importFromXcode.js
```

- Log all snippets in a specific directory:

```bash
node research/xcode/importFromXcode.js ~/path/to/codesnippets/directory
```

## 5. Notes and edge cases

- The script requires macOS `plutil`. On macOS `plutil` is available by default.
- Some `.codesnippet` files may use unexpected keys or nested structures; the script performs best-effort extraction.
- Placeholder conversion (e.g., converting `<#name#>` to `${1:name}`) is not implemented here — that's a recommended next step for better import fidelity.
- The script uses a synchronous flow for simplicity; it can be converted to asynchronous/parallel processing if needed.

## 6. Next steps

- Convert Xcode placeholders to the internal placeholder format used by Snippet Studio.
- Batch-import multiple snippets into Snippet Studio's store/database.
- Add tests to validate parsing of representative `.codesnippet` files (use plutil -lint and parsing checks).


---

Proof-of-concept import notes added to repository.
