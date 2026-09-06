# Exporting snippets to Xcode — Proof of Concept

This document explains how to export snippets from Snippet Studio to Xcode's user snippets format, answers some common questions, and includes a small script (Node.js) that generates a `.codesnippet` XML file Xcode can import.

## 1. Where Xcode stores user snippets

Xcode stores user snippets inside the user's Library folder. The canonical path is:

- ~/Library/Developer/Xcode/UserData/CodeSnippets/

Each snippet is expected to be a separate file inside that folder. The files typically have the extension `.codesnippet` and are XML property lists (plist) in XML format.

Example full path for a single snippet:

- ~/Library/Developer/Xcode/UserData/CodeSnippets/MySnippet.codesnippet

> Note: When running on macOS, `~` expands to the current user's home directory. Snippets can be copied into that directory and Xcode will pick them up (usually after restart or switching projects).

## 2. Do Xcode snippets require individual files?

Yes. Each Xcode user snippet is represented by a separate `.codesnippet` file. The snippet file contains a plist/dictionary with keys such as `IDECodeSnippetIdentifier`, `IDECodeSnippetTitle`, `IDECodeSnippetSummary`, `IDECodeSnippetCompletionPrefix`, `IDECodeSnippetContents`, `IDECodeSnippetLanguage`, and `IDECodeSnippetUserSnippet` among others.

Storing a single snippet per file is the expected format for Xcode to recognize them as user snippets.

## 3. Xcode snippet plist structure (important keys)

A minimal `.codesnippet` file uses an XML plist with these keys:

- IDECodeSnippetIdentifier: UUID string
- IDECodeSnippetVersion: number (usually 2)
- IDECodeSnippetTitle: title / name
- IDECodeSnippetSummary: description
- IDECodeSnippetContents: the snippet body (string, can contain placeholders like `<#variable#>`)
- IDECodeSnippetLanguage: language name (e.g., `Xcode.SourceCodeLanguage.Swift` or `Xcode.SourceCodeLanguage.objc`) or simply `Swift`/`Objective-C` — Xcode is flexible but using language identifiers is safer
- IDECodeSnippetCompletionPrefix: the trigger (prefix)
- IDECodeSnippetCompletionScopes: array of scopes such as `ClassImplementation`, `FunctionScope`, `TopLevel` etc. Common values: `All`, `CodeExpression`, `CodeBlock`.
- IDECodeSnippetUserSnippet: true

A small example plist (XML) is included in the script below.

## 4. Example Node.js script (create a .codesnippet file)

This PoC script creates a `.codesnippet` XML file from input fields: language, id, title/description, prefix, and body. It produces a macOS-friendly plist that Xcode will recognize.

Save this file as `scripts/exportToXcode.js` and run with Node.js (macOS). It writes the output to the `./out` folder by default.

```js
#!/usr/bin/env node
// Minimal script to generate an Xcode .codesnippet file

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

function languageIdentifier(lang) {
  // Map common languages to Xcode-ish identifiers. Extend as-needed.
  const map = {
    'swift': 'Xcode.SourceCodeLanguage.Swift',
    'objective-c': 'Xcode.SourceCodeLanguage.Objective-C',
    'objc': 'Xcode.SourceCodeLanguage.Objective-C',
    'objc++': 'Xcode.SourceCodeLanguage.Objective-C++',
    'cpp': 'Xcode.SourceCodeLanguage.cpp'
  };
  return map[lang.toLowerCase()] || lang;
}

function escapeXml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildPlist({ id, title, summary, contents, language, prefix, scopes = ['All'] }) {
  const lang = languageIdentifier(language || 'Swift');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0">\n<dict>\n  <key>IDECodeSnippetIdentifier</key>\n  <string>${escapeXml(id)}</string>\n  <key>IDECodeSnippetVersion</key>\n  <integer>2</integer>\n  <key>IDECodeSnippetTitle</key>\n  <string>${escapeXml(title)}</string>\n  <key>IDECodeSnippetSummary</key>\n  <string>${escapeXml(summary)}</string>\n  <key>IDECodeSnippetContents</key>\n  <string>${escapeXml(contents)}</string>\n  <key>IDECodeSnippetLanguage</key>\n  <string>${escapeXml(lang)}</string>\n  <key>IDECodeSnippetCompletionPrefix</key>\n  <string>${escapeXml(prefix)}</string>\n  <key>IDECodeSnippetCompletionScopes</key>\n  <array>\n${scopes.map(s => `    <string>${escapeXml(s)}</string>`).join('\n')}\n  </array>\n  <key>IDECodeSnippetUserSnippet</key>\n  <true/>\n</dict>\n</plist>\n`;
  return xml;
}

// CLI handling
const argv = require('yargs')
  .option('language', { alias: 'l', type: 'string', demandOption: false })
  .option('id', { alias: 'i', type: 'string', demandOption: false })
  .option('title', { alias: 't', type: 'string', demandOption: false })
  .option('summary', { alias: 's', type: 'string', demandOption: false })
  .option('prefix', { alias: 'p', type: 'string', demandOption: true })
  .option('out', { alias: 'o', type: 'string', demandOption: false, default: './out' })
  .option('scopes', { alias: 'c', type: 'array', demandOption: false, default: ['All'] })
  .help()
  .argv;

const id = argv.id || uuidv4();
const title = argv.title || argv.prefix;
const summary = argv.summary || '';
const language = argv.language || 'Swift';
const prefix = argv.prefix;

let contents = '';
if (!process.stdin.isTTY) {
  // read body from stdin
  contents = fs.readFileSync(0, 'utf8');
} else {
  // ask user to provide body via env var or default placeholder
  contents = process.env.SNIPPET_BODY || '// snippet body here';
}

const xml = buildPlist({ id, title, summary, contents, language, prefix, scopes: argv.scopes });

const outdir = path.resolve(process.cwd(), argv.out);
if (!fs.existsSync(outdir)) fs.mkdirSync(outdir, { recursive: true });
const filenameSafe = title.replace(/[\\/:*?"<>|]/g, '-') || id;
const filepath = path.join(outdir, `${filenameSafe}.codesnippet`);
fs.writeFileSync(filepath, xml, 'utf8');
console.log('Wrote', filepath);
```

Usage examples:

- From a pipe (preferred when body contains newlines):

```bash
cat mySnippetBody.txt | node scripts/exportToXcode.js -p myprefix -t "My Snippet" -l swift -o ./out
```

- With SNIPPET_BODY env var (not ideal for multi-line bodies):

```bash
SNIPPET_BODY="$1$2$3" node scripts/exportToXcode.js -p myprefix -t "My Snippet"
```

## 5. Notes and edge cases

- Xcode may require a restart to pick up new snippets.
- Placeholders: Xcode uses the placeholder syntax <#name#>. If you convert from other editors' placeholder formats (like ${1:arg}), consider transforming them.
- Language identifiers: Xcode accepts a variety of values; mapping common languages helps. For robust results, inspect existing `.codesnippet` files on your machine to match language strings.
- Scopes: The `IDECodeSnippetCompletionScopes` array controls where the snippet is available. `All` is the broadest.

## 6. Related resources

- A GitHub repo full of Xcode snippets can be used as a reference for real-world `.codesnippet` files (inspect their plist keys and values).


## 7. Next steps (optional)

- Implement conversion logic for placeholder syntaxes from VSCode/Sublime to Xcode `<# #>` placeholders.
- Add a batch exporter command to write multiple `.codesnippet` files from a snippet database.
- Add tests that verify produced XML plists parse correctly with macOS `plutil` and match expected keys.


---

Proof-of-concept added by Snippet Studio research notes.
