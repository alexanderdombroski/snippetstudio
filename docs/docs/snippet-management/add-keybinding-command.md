---
title: Add Keybinding Command
sidebar_label: Add Keybinding Command
sidebar_position: 7
---

# Add Keybinding Command

The `snippetstudio.snippet.addKeybinding` command is a core feature of SnippetStudio that allows you to quickly bind keyboard shortcuts to your existing snippets.

## Command Details

- **Command ID**: `snippetstudio.snippet.addKeybinding`
- **Display Title**: "Add Keybinding"
- **Context**: Available when a snippet is selected in the SnippetStudio tree view
- **Category**: Snippet Management

## How to Execute

### Method 1: Context Menu (Recommended)
1. Open SnippetStudio view (`Ctrl+Shift+P` → "Snippet Studio: Open View")
2. Navigate to any snippet in the tree
3. Right-click on the snippet
4. Select "Add Keybinding" from the context menu

### Method 2: Command Palette
1. Select a snippet in SnippetStudio tree view
2. Open Command Palette (`Ctrl+Shift+P`)
3. Type "Add Keybinding" or search for `snippetstudio.snippet.addKeybinding`
4. Execute the command

:::note Prerequisites
The command requires a snippet to be selected in the SnippetStudio tree view. It won't appear in the command palette or work if no snippet is selected.
:::

## Command Execution Flow

When you execute the `Add Keybinding` command, here's exactly what happens:

### 1. Snippet Data Retrieval
```typescript
const snippetTitle = item.description?.toString() ?? '';
const snippet = await readSnippet(item.path, snippetTitle);
```
- Extracts the snippet title from the selected tree item
- Reads the complete snippet data from the file
- Retrieves snippet body, scope, and other metadata

### 2. Keybindings File Location
```typescript
const keyBindPath = await getKeybindingsFilePath();
// Returns: {activeProfile}/keybindings.json
```
- Locates your current VS Code profile's keybindings.json file
- Creates the file if it doesn't exist
- Respects VS Code profile settings and workspace configurations

### 3. Language Scope Processing
```typescript
const langs = (snippet?.scope ?? getCurrentLanguage() ?? 'plaintext').split(',');
```
**Scope Resolution Priority:**
1. **Snippet's defined scope** - Uses the scope from the snippet metadata
2. **Current editor language** - Falls back to the active editor's language
3. **Plaintext default** - Ultimate fallback to prevent errors

**Multiple Language Support:**
- Handles comma-separated scopes: `"typescript,javascript,typescriptreact"`
- Creates OR conditions in the `when` clause
- Trims whitespace from language identifiers

### 4. Keybinding Entry Generation
```typescript
{
  key: "INSERT_KEY_BINDING_HERE",
  command: "editor.action.insertSnippet",
  when: `editorTextFocus && (${langs.map(lang => `editorLangId == ${lang}`).join(' || ')})`,
  args: {
    snippet: snippetBodyAsString(snippet.body)
  }
}
```

**Key Components:**
- **Placeholder Key**: `INSERT_KEY_BINDING_HERE` for user replacement
- **VS Code Command**: Uses native `editor.action.insertSnippet`
- **Context Conditions**: Ensures editor focus and language matching
- **Snippet Content**: Converts snippet body to string format

### 5. File Modification and UI
```typescript
await writeJson(keyBindPath, keybindings);
const doc = await openTextDocument(keyBindPath);
const editor = await showTextDocument(doc);
await executeCommand('workbench.action.files.revert');
```
- Writes the updated keybindings to the JSON file
- Opens the keybindings.json file in VS Code editor
- Reverts any unsaved changes to ensure clean state
- Automatically selects the placeholder text for immediate editing

## Generated Keybinding Structure

### Basic Single Language Example
```json
{
  "key": "INSERT_KEY_BINDING_HERE",
  "command": "editor.action.insertSnippet",
  "when": "editorTextFocus && (editorLangId == typescript)",
  "args": {
    "snippet": "console.log('${1:message}');"
  }
}
```

### Multi-Language Scope Example
```json
{
  "key": "INSERT_KEY_BINDING_HERE", 
  "command": "editor.action.insertSnippet",
  "when": "editorTextFocus && (editorLangId == typescript || editorLangId == javascript || editorLangId == typescriptreact)",
  "args": {
    "snippet": "const [${1:state}, set${1/(.*)/${1:/capitalize}/}] = useState(${2:initialValue});"
  }
}
```

### Global Snippet Example (no specific scope)
```json
{
  "key": "INSERT_KEY_BINDING_HERE",
  "command": "editor.action.insertSnippet", 
  "when": "editorTextFocus && (editorLangId == plaintext)",
  "args": {
    "snippet": "TODO: ${1:description}"
  }
}
```

## Technical Implementation Details

### Snippet Body Processing
The command uses `snippetBodyAsString()` to convert snippet bodies:
- **Array format**: `["line1", "line2"]` → `"line1\nline2"`
- **String format**: Preserves as-is
- **Placeholder preservation**: Maintains `${1:placeholder}` syntax
- **Escape handling**: Properly escapes JSON string content

### Profile Awareness
The command respects VS Code profiles:
- **Default Profile**: `~/.vscode/keybindings.json`
- **Named Profiles**: `~/.vscode/profiles/{profileName}/keybindings.json`
- **Workspace Settings**: Follows workspace-specific profile configurations

### Error Handling
Built-in error handling for:
- **Missing snippet data**: Graceful fallback to current language
- **File permission issues**: VS Code handles write permissions
- **Invalid JSON**: Uses VS Code's JSON validation and formatting
- **Placeholder not found**: Silent failure if text selection fails

## Advanced Usage Tips

### Custom Key Combinations
After the placeholder is selected, you can use any valid VS Code key combination:

```json
// Function keys
"key": "f9"
"key": "shift+f10"

// Modified letters  
"key": "ctrl+shift+l"
"key": "alt+shift+c"

// Numbers and symbols
"key": "ctrl+shift+1"
"key": "ctrl+;"
"key": "alt+`"
```

### Complex When Conditions
You can manually enhance the generated `when` condition:

```json
// Original generated condition
"when": "editorTextFocus && (editorLangId == typescript)"

// Enhanced with additional contexts
"when": "editorTextFocus && (editorLangId == typescript) && !suggestWidgetVisible && !inSnippetMode"
```

### Multiple Keybindings for Same Snippet
You can add multiple keybindings for the same snippet by:
1. Running the command multiple times
2. Manually duplicating and modifying entries
3. Using different key combinations for different contexts

## Troubleshooting

### Command Not Available
**Problem**: "Add Keybinding" doesn't appear in context menu
**Solution**: 
- Ensure a snippet is selected in SnippetStudio tree view
- Refresh the SnippetStudio view if needed
- Check that the extension is properly activated

### Placeholder Not Selected
**Problem**: File opens but text isn't selected
**Solution**:
- Manually search for `INSERT_KEY_BINDING_HERE` in the file
- Replace with your desired key combination
- This is often due to VS Code focus issues

### Keybinding Conflicts
**Problem**: Key combination doesn't work
**Solution**:
- Open Keyboard Shortcuts (`Ctrl+K Ctrl+S`) or use the [Keyboard Shortcuts editor](https://code.visualstudio.com/docs/getstarted/keybindings#_keyboard-shortcuts-editor)
- Search for your key combination to find conflicts
- Choose a different key combination or remove conflicting bindings
- Refer to the [troubleshooting keybindings guide](https://code.visualstudio.com/docs/getstarted/keybindings#_troubleshooting-keybindings) for advanced conflict resolution

## Related Commands

- **`snippetstudio.refresh`** - Refresh snippet tree view
- **`snippetstudio.openView`** - Open SnippetStudio main view  
- **`workbench.action.openGlobalKeybindings`** - Open VS Code keyboard shortcuts
- **`editor.action.insertSnippet`** - The underlying VS Code command used by keybindings

## VS Code Documentation References

Understanding VS Code's keybinding system will help you make the most of SnippetStudio's keybinding feature:

### Essential Reading
- **[Key Bindings for Visual Studio Code](https://code.visualstudio.com/docs/getstarted/keybindings)** - Comprehensive keybinding guide
- **[User Defined Snippets](https://code.visualstudio.com/docs/editor/userdefinedsnippets)** - How VS Code snippets work internally
- **[When Clause Contexts](https://code.visualstudio.com/api/references/when-clause-contexts)** - All available context conditions

### Advanced Topics
- **[Keyboard Rules](https://code.visualstudio.com/docs/getstarted/keybindings#_keyboard-rules)** - How keybinding precedence works
- **[Default Keyboard Shortcuts](https://code.visualstudio.com/docs/getstarted/keybindings#_default-keyboard-shortcuts)** - Reference for avoiding conflicts
- **[Command line interface](https://code.visualstudio.com/docs/editor/command-line#_core-cli-options)** - Managing keybindings from CLI

## See Also

- **[Keybinding Snippets](./keybinding-snippets.md)** - Complete guide to snippet keybindings  
- **[Keybinding Examples](./keybinding-examples.md)** - Practical examples and use cases
