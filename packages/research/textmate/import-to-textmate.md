# TextMate snippet import/export — Proof of Concept

This document covers a small PoC for importing/exporting snippets between VS Code and TextMate. It answers where TextMate stores snippets, how to handle interpolated shell code in snippet bodies, and includes two conversion scripts: VS Code -> TextMate and TextMate -> VS Code.

## 1. Where TextMate stores snippets

TextMate uses bundles to organize snippets. User snippets are usually stored in the `Application Support` area or in Bundles in `~/Library/Application Support/Avian/` (older paths) or as part of a TextMate bundle in `~/Library/Application Support/Avian/Bundles/` or `~/Library/Application Support/TextMate/` depending on TextMate version. However, there is not a single canonical, always-present path across versions; TextMate 2 also supports user bundles in `~/Library/Application Support/Avian/Bundles`.

A more reliable approach is to use TextMate’s `tmProperties` and bundle structure, or place snippets in a user bundle at a location like:

- ~/Library/Application Support/Avian/Bundles/User.tmbundle/Snippets/

Each TextMate snippet is usually stored as a `.tmSnippet` file (XML plist) inside a bundle's `Snippets` folder, or inside a JSON/PLIST within the bundle. Because of this variability, an importer/exporter should allow specifying the target directory rather than assuming a single path.

## 2. TextMate snippet file format

A `.tmSnippet` file is an XML plist (similar to Xcode `.codesnippet`) with keys like:

- `content` — snippet body
- `name` — title
- `tabTrigger` — trigger
- `scope` — scope selector (like source.python)
- `uuid` — optional identifier

Example minimal `.tmSnippet` (plist XML) keys are covered in the scripts below.

## 3. Stripping interpolated shell code from JSON

VS Code snippets may include interpolated shell code (e.g., placeholders that execute shell snippets, or snippet variables like `$TM_SELECTED_TEXT` or `${exec:...}` — sometimes in extension-generated snippets). To make safe conversions we can:

- Remove or replace patterns like `${exec:...}` or `${command:...}` with a simple placeholder or empty string.
- Remove backtick-wrapped interpolated shell code (e.g., `` `...` ``) if present inside the snippet body.
- Convert placeholders like `${1:name}` to TextMate/TabStop syntax if necessary (TextMate uses `TM_TAB_TRIGGER` / `$1` style placeholders). A conservative approach is to keep `$1`, `$2`, etc.

The provided scripts perform a best-effort sanitization by removing `${exec:...}` and `${command:...}` constructs and stripping inline backtick shell expressions.

## 4. Scripts included (PoC)

- `vscodeToTextMate.js` — reads a VS Code snippet JSON file (one or many snippets), converts each snippet into a `.tmSnippet` plist file, and writes them to an output directory.
- `textMateToVscode.js` — reads `.tmSnippet` files from a directory and converts them into a single VS Code snippets JSON object written to stdout or a file.

Both scripts are minimal, synchronous, and designed for PoC. They perform simple sanitization of exec/command placeholders and inline shell code.

## 5. Usage examples

- Convert VS Code snippets to TextMate snippets (writes to `./out`):

```bash
node research/textmate/vscodeToTextMate.js path/to/vscode-snippets.json ./out
```

- Convert a TextMate bundle snippets directory to a VS Code snippets file:

```bash
node research/textmate/textMateToVscode.js path/to/snippets/ > vscode-snippets.json
```

## 6. Next steps

- Add careful placeholder conversion tests (VS Code <> TextMate placeholder syntax differences).
- Add support for scope mapping between languages.
- Add unit tests and a sample fixture bundle.

---

Proof-of-concept added by Snippet Studio research notes.
