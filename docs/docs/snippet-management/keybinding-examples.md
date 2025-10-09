---
title: Keybinding Examples
sidebar_label: Keybinding Examples  
sidebar_position: 8
---

# Keybinding Examples

This page provides practical examples of how to use SnippetStudio's keybinding feature effectively. Each example includes the original snippet, the generated keybinding, and tips for optimal usage.

## React Development Examples

### useState Hook Snippet
**Original Snippet:**
```json
{
  "React useState": {
    "prefix": "us",
    "scope": "typescriptreact,javascriptreact",
    "body": [
      "const [${1:state}, set${1/(.*)/${1:/capitalize}/}] = useState(${2:initialValue});"
    ],
    "description": "React useState hook"
  }
}
```

**Generated Keybinding:**
```json
{
  "key": "ctrl+shift+u",
  "command": "editor.action.insertSnippet",
  "when": "editorTextFocus && (editorLangId == typescriptreact || editorLangId == javascriptreact)",
  "args": {
    "snippet": "const [${1:state}, set${1/(.*)/${1:/capitalize}/}] = useState(${2:initialValue});"
  }
}
```

**Usage:** Press `Ctrl+Shift+U` while editing React components to quickly insert a useState hook.

### useEffect Hook Snippet
**Original Snippet:**
```json
{
  "React useEffect": {
    "prefix": "ue",
    "scope": "typescriptreact,javascriptreact", 
    "body": [
      "useEffect(() => {",
      "\t${1:// effect logic}",
      "}, [${2:dependencies}]);"
    ],
    "description": "React useEffect hook"
  }
}
```

**Generated Keybinding:**
```json
{
  "key": "ctrl+shift+e",
  "command": "editor.action.insertSnippet",
  "when": "editorTextFocus && (editorLangId == typescriptreact || editorLangId == javascriptreact)",
  "args": {
    "snippet": "useEffect(() => {\n\t${1:// effect logic}\n}, [${2:dependencies}]);"
  }
}
```

**Usage:** Press `Ctrl+Shift+E` in React files to insert a useEffect hook with proper formatting.

## Node.js/JavaScript Examples

### Console.log with Object Destructuring
**Original Snippet:**
```json
{
  "Console log with label": {
    "prefix": "clo",
    "scope": "javascript,typescript",
    "body": [
      "console.log('${1:label}:', { ${1} });"
    ],
    "description": "Console log with destructured object"
  }
}
```

**Generated Keybinding:**
```json
{
  "key": "ctrl+shift+l",
  "command": "editor.action.insertSnippet", 
  "when": "editorTextFocus && (editorLangId == javascript || editorLangId == typescript)",
  "args": {
    "snippet": "console.log('${1:label}:', { ${1} });"
  }
}
```

**Usage:** Press `Ctrl+Shift+L` to quickly insert a labeled console.log statement.

### Express Route Handler
**Original Snippet:**
```json
{
  "Express GET Route": {
    "prefix": "eget",
    "scope": "javascript,typescript",
    "body": [
      "app.get('${1:/route}', (req, res) => {",
      "\t${2:// handler logic}",
      "\tres.json({ ${3:data} });",
      "});"
    ],
    "description": "Express GET route handler"
  }
}
```

**Generated Keybinding:**
```json
{
  "key": "alt+shift+g",
  "command": "editor.action.insertSnippet",
  "when": "editorTextFocus && (editorLangId == javascript || editorLangId == typescript)",
  "args": {
    "snippet": "app.get('${1:/route}', (req, res) => {\n\t${2:// handler logic}\n\tres.json({ ${3:data} });\n});"
  }
}
```

**Usage:** Press `Alt+Shift+G` when building Express applications to create GET route handlers.

## TypeScript Examples

### Interface Definition
**Original Snippet:**
```json
{
  "TypeScript Interface": {
    "prefix": "int",
    "scope": "typescript,typescriptreact",
    "body": [
      "interface ${1:InterfaceName} {",
      "\t${2:property}: ${3:type};",
      "}"
    ],
    "description": "TypeScript interface definition"
  }
}
```

**Generated Keybinding:**
```json
{
  "key": "ctrl+shift+i",
  "command": "editor.action.insertSnippet",
  "when": "editorTextFocus && (editorLangId == typescript || editorLangId == typescriptreact)",
  "args": {
    "snippet": "interface ${1:InterfaceName} {\n\t${2:property}: ${3:type};\n}"
  }
}
```

**Usage:** Press `Ctrl+Shift+I` in TypeScript files to create interface definitions.

### Type Definition
**Original Snippet:**
```json
{
  "TypeScript Type": {
    "prefix": "typ",
    "scope": "typescript,typescriptreact",
    "body": [
      "type ${1:TypeName} = ${2:TypeDefinition};"
    ],
    "description": "TypeScript type alias"
  }
}
```

**Generated Keybinding:**
```json
{
  "key": "ctrl+shift+t",
  "command": "editor.action.insertSnippet",
  "when": "editorTextFocus && (editorLangId == typescript || editorLangId == typescriptreact)",
  "args": {
    "snippet": "type ${1:TypeName} = ${2:TypeDefinition};"
  }
}
```

**Usage:** Press `Ctrl+Shift+T` to quickly define TypeScript type aliases.

## CSS/SCSS Examples

### Flexbox Container
**Original Snippet:**
```json
{
  "Flexbox Container": {
    "prefix": "flex",
    "scope": "css,scss,sass",
    "body": [
      "display: flex;",
      "justify-content: ${1:center};",
      "align-items: ${2:center};"
    ],
    "description": "Flexbox container properties"
  }
}
```

**Generated Keybinding:**
```json
{
  "key": "ctrl+shift+f",
  "command": "editor.action.insertSnippet",
  "when": "editorTextFocus && (editorLangId == css || editorLangId == scss || editorLangId == sass)",
  "args": {
    "snippet": "display: flex;\njustify-content: ${1:center};\nalign-items: ${2:center};"
  }
}
```

**Usage:** Press `Ctrl+Shift+F` in CSS files to insert flexbox container properties.

### Grid Container
**Original Snippet:**
```json
{
  "CSS Grid Container": {
    "prefix": "grid",
    "scope": "css,scss,sass",
    "body": [
      "display: grid;",
      "grid-template-columns: ${1:repeat(auto-fit, minmax(250px, 1fr))};",
      "gap: ${2:1rem};"
    ],
    "description": "CSS Grid container setup"
  }
}
```

**Generated Keybinding:**
```json
{
  "key": "alt+shift+g",
  "command": "editor.action.insertSnippet",
  "when": "editorTextFocus && (editorLangId == css || editorLangId == scss || editorLangId == sass)",
  "args": {
    "snippet": "display: grid;\ngrid-template-columns: ${1:repeat(auto-fit, minmax(250px, 1fr))};\ngap: ${2:1rem};"
  }
}
```

**Usage:** Press `Alt+Shift+G` to create CSS Grid container layouts.

## Global Snippets Examples

### TODO Comment
**Original Snippet:**
```json
{
  "TODO Comment": {
    "prefix": "todo",
    "body": [
      "TODO: ${1:description}"
    ],
    "description": "TODO comment for any language"
  }
}
```

**Generated Keybinding:**
```json
{
  "key": "ctrl+shift+;",
  "command": "editor.action.insertSnippet",
  "when": "editorTextFocus && (editorLangId == plaintext)",
  "args": {
    "snippet": "TODO: ${1:description}"
  }
}
```

**Usage:** Press `Ctrl+Shift+;` to insert TODO comments in any file type.

### Date Timestamp
**Original Snippet:**
```json
{
  "Current Date": {
    "prefix": "date",
    "body": [
      "$CURRENT_YEAR-$CURRENT_MONTH-$CURRENT_DATE"
    ],
    "description": "Insert current date"
  }
}
```

**Generated Keybinding:**
```json
{
  "key": "alt+shift+d",
  "command": "editor.action.insertSnippet",
  "when": "editorTextFocus && (editorLangId == plaintext)",
  "args": {
    "snippet": "$CURRENT_YEAR-$CURRENT_MONTH-$CURRENT_DATE"
  }
}
```

**Usage:** Press `Alt+Shift+D` to insert the current date in any file.

## Best Practice Examples

### Organized Key Combinations

Here's how to organize your keybindings systematically:

#### React Development (`Ctrl+Shift+...`)
- `Ctrl+Shift+U` - useState hook
- `Ctrl+Shift+E` - useEffect hook  
- `Ctrl+Shift+R` - React component
- `Ctrl+Shift+P` - React props interface

#### Node.js/Backend (`Alt+Shift+...`)
- `Alt+Shift+G` - Express GET route
- `Alt+Shift+P` - Express POST route
- `Alt+Shift+M` - MongoDB query
- `Alt+Shift+A` - Async function

#### Styling/CSS (`Ctrl+Alt+...`) 
- `Ctrl+Alt+F` - Flexbox container
- `Ctrl+Alt+G` - Grid container
- `Ctrl+Alt+C` - CSS class
- `Ctrl+Alt+M` - Media query

#### Utilities/Global (`F-Keys`)
- `F9` - TODO comment
- `F10` - Date timestamp  
- `F11` - File header
- `F12` - Debug log

### Context-Specific Variations

You can create variations of the same snippet for different contexts:

```json
// React component in TypeScript
{
  "key": "ctrl+shift+r",
  "command": "editor.action.insertSnippet",
  "when": "editorTextFocus && editorLangId == typescriptreact",
  "args": {
    "snippet": "const ${1:ComponentName}: React.FC = () => {\n\treturn (\n\t\t<div>\n\t\t\t${2:content}\n\t\t</div>\n\t);\n};"
  }
}

// React component in JavaScript  
{
  "key": "ctrl+shift+r",
  "command": "editor.action.insertSnippet", 
  "when": "editorTextFocus && editorLangId == javascriptreact",
  "args": {
    "snippet": "const ${1:ComponentName} = () => {\n\treturn (\n\t\t<div>\n\t\t\t${2:content}\n\t\t</div>\n\t);\n};"
  }
}
```

## Screenshot Placeholders

:::info Screenshots Coming Soon
This section will include screenshots showing:

1. **Context menu selection** - Right-clicking a snippet to show "Add Keybinding" option
2. **Keybindings file opening** - The automatic opening of keybindings.json with placeholder selected
3. **Before and after comparison** - The keybindings.json file before and after adding a binding
4. **Key combination editing** - Replacing the placeholder with an actual key combination
5. **Testing the keybinding** - Demonstrating the keybinding working in a real file

Screenshots will be added to demonstrate the complete workflow visually.
:::

## Advanced Customization Tips

### Combining Multiple Snippets
Create a single keybinding that inserts multiple related snippets:

```json
{
  "key": "ctrl+shift+c",
  "command": "editor.action.insertSnippet",
  "when": "editorTextFocus && editorLangId == typescriptreact",
  "args": {
    "snippet": "import React from 'react';\n\ninterface ${1:ComponentName}Props {\n\t${2:prop}: ${3:type};\n}\n\nconst ${1}: React.FC<${1}Props> = ({ ${2} }) => {\n\treturn (\n\t\t<div>\n\t\t\t${4:content}\n\t\t</div>\n\t);\n};\n\nexport default ${1};"
  }
}
```

### Conditional Keybindings
Use more specific `when` conditions for context-aware snippets. VS Code provides many [context keys](https://code.visualstudio.com/api/references/when-clause-contexts) you can use:

```json
{
  "key": "ctrl+shift+t",
  "command": "editor.action.insertSnippet",
  "when": "editorTextFocus && editorLangId == typescript && resourceExtname == '.test.ts'",
  "args": {
    "snippet": "describe('${1:description}', () => {\n\tit('should ${2:behavior}', () => {\n\t\t${3:// test logic}\n\t});\n});"
  }
}
```

This keybinding only works in TypeScript test files (`.test.ts`). Learn more about [advanced when clause conditions](https://code.visualstudio.com/docs/getstarted/keybindings#_advanced-customization) in the official documentation.

## VS Code Keybinding Documentation

These official VS Code resources will help you understand and master keybinding customization:

### Getting Started
- **[Key Bindings for Visual Studio Code](https://code.visualstudio.com/docs/getstarted/keybindings)** - Main keybinding documentation
- **[Keyboard Shortcuts Reference](https://code.visualstudio.com/shortcuts/keyboard-shortcuts-windows.pdf)** - Printable shortcut reference (Windows)
- **[Keyboard Shortcuts Reference](https://code.visualstudio.com/shortcuts/keyboard-shortcuts-macos.pdf)** - Printable shortcut reference (macOS)
- **[Keyboard Shortcuts Reference](https://code.visualstudio.com/shortcuts/keyboard-shortcuts-linux.pdf)** - Printable shortcut reference (Linux)

### Advanced Customization
- **[When Clause Contexts](https://code.visualstudio.com/api/references/when-clause-contexts)** - Complete list of context variables
- **[Keybinding arguments](https://code.visualstudio.com/docs/getstarted/keybindings#_keyboard-rules)** - Passing arguments to commands
- **[Multi-root workspaces](https://code.visualstudio.com/docs/editor/multi-root-workspaces#_settings)** - Workspace-specific keybindings

### Troubleshooting and Management
- **[Keyboard Shortcuts Editor](https://code.visualstudio.com/docs/getstarted/keybindings#_keyboard-shortcuts-editor)** - GUI for managing shortcuts
- **[Troubleshooting Keybindings](https://code.visualstudio.com/docs/getstarted/keybindings#_troubleshooting-keybindings)** - Resolving conflicts and issues
- **[Default keybindings.json](https://code.visualstudio.com/docs/getstarted/keybindings#_default-keybindingsjson)** - Understanding VS Code's defaults

### Snippet-Related Documentation
- **[User Defined Snippets](https://code.visualstudio.com/docs/editor/userdefinedsnippets)** - How snippets work in VS Code
- **[Snippet Syntax](https://code.visualstudio.com/docs/editor/userdefinedsnippets#_snippet-syntax)** - Placeholders, transformations, and variables
- **[editor.action.insertSnippet](https://code.visualstudio.com/docs/editor/userdefinedsnippets#_assign-keybindings-to-snippets)** - The command SnippetStudio uses

## Related Resources

- **[Keybinding Snippets](./keybinding-snippets.md)** - Complete keybinding guide
- **[Add Keybinding Command](./add-keybinding-command.md)** - Technical command reference
