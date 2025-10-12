# Sublime Export Proof of Concept

## Overview
**VS Code snippet structure**  
VS Code snippets are stored in JSON files containing a mapping of snippet names to objects that define `prefix`, `body`, and `description`. The `body` is either a string or an array of strings representing the snippet content. Variables use `${1:placeholder}` and `$TM_FILENAME`.

**Sublime Text snippet structure**  
Sublime snippets are XML files with the `snippet` root element. They define `<content>`, a `<tabTrigger>`, optional `<scope>`, and optional `<description>`. Sublime supports simple variables like `$TM_FILENAME` and mirrors (same placeholder repeating) using `$1`, `$2`, and `$0`.

**Conversion logic**  
- **VS Code → Sublime**: Join VS Code body array into `\n` string and place inside `<content><![CDATA[ ... ]]></content>`. Use first prefix as `<tabTrigger>`. Pass description.
- **Sublime → VS Code**: Extract `content` text, split on `\n` to form `body` array. Use `<tabTrigger>` as `prefix` and `<description>` field for VS Code description.

## Sample Snippets

### VS Code Example
```json
{
  "Print Console": {
    "prefix": "log",
    "body": [
      "console.log('${1:message}');",
      "${2}"
    ],
    "description": "Log output to console"
  }
}
```

### Sublime Example
```xml
<snippet>
  <content><![CDATA[console.log("${1:message}");]]></content>
  <tabTrigger>log</tabTrigger>
  <scope>source.js</scope>
  <description>Log output to console</description>
</snippet>
```

## Converted Outputs

### VS Code → Sublime (Sample Output)
```xml
<snippet>
  <content><![CDATA[console.log("${1:message}");
${2}]]></content>
  <tabTrigger>log</tabTrigger>
  <description>Log output to console</description>
</snippet>
```

### Sublime → VS Code (Sample Output)
```json
{
  "Converted Snippet": {
    "prefix": "log",
    "body": [
      "console.log(\"${1:message}\");"
    ],
    "description": "Log output to console"
  }
}
```

## Questions Answered

1. **Consistent Sublime snippet path**  
   - **Windows**: `%AppData%\Sublime Text\Packages\User\`  
   - **macOS**: `~/Library/Application Support/Sublime Text/Packages/User/`  
   - **Linux**: `~/.config/sublime-text/Packages/User/`  
   Sublime allows storing `.sublime-snippet` files anywhere within the `Packages` directory, but `Packages/User` is the user-specific location.

2. **Sublime-only features needing removal**  
   - **Scope-specific triggers**: Additional `<scope>` entries may not translate directly to VS Code, which uses language-specific JSON (but lacks finer-grained scopes).  
   - **Mirrors (`${1:placeholder}` with `$1` reuse)**: VS Code supports numbered placeholders, but Sublime mirrors placeholder content when reused. The conversion preserves placeholders but may lose mirroring semantics.  
   - **Context-specific tab triggers**: Sublime allows duplicate tab triggers scoped differently, which VS Code cannot express directly.

## Notes
- **Parser choice**: Use [`fast-xml-parser`](https://www.npmjs.com/package/fast-xml-parser) for handling XML parsing and conversion in Node.js.
- **Batch conversions**: With the scripts below, you can extend logic to handle entire directories of snippets.