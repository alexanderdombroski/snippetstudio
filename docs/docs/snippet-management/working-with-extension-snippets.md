---
title: Working with Extension Snippets
sidebar_label: Extension Snippets
sidebar_position: 6
---

# Working with Extension Snippets

This guide explains how to work with snippets from VS Code extensions using SnippetStudio.

## What are Extension Snippets?

Extension snippets are code snippets provided by VS Code extensions. Unlike user snippets (which you create yourself), extension snippets are bundled with extensions and provide pre-built code templates for various programming languages and frameworks.

To learn more about snippet-based extensions, see the [VS Code documentation on creating snippet extensions](https://code.visualstudio.com/api/language-extensions/snippet-guide).

## Export All Snippets from an Extension

SnippetStudio allows you to export all snippets from an installed extension at once:

1. Open the **SnippetStudio** view from the Activity Bar
2. Navigate to the **Extensions** section
3. Locate the extension containing the snippets you want to export
4. Right-click on the extension name
5. Select **"Export All Snippets"**
6. Choose a destination folder for the exported snippets
7. All snippets from that extension will be saved as individual JSON files

**Use Case:** This is useful when you want to:
- Create a backup of extension snippets
- Modify extension snippets for personal use
- Share snippets from an extension with your team
- Migrate snippets between different VS Code installations

## Export a Single Snippet from an Extension

To export just one specific snippet from an extension:

1. Open the **SnippetStudio** view
2. Expand the extension in the **Extensions** section
3. Browse through the available snippets
4. Right-click on the specific snippet you want to export
5. Select **"Export Snippet"**
6. Choose a destination and filename
7. The snippet will be saved as a standalone JSON file

**Use Case:** This is ideal when you:
- Only need one or two snippets from a large extension
- Want to customize a specific snippet without affecting others
- Need to share a particular snippet with colleagues

## Hide Extension Snippets

If you have too many extension snippets cluttering your suggestions, you can hide them:

### Method 1: Using SnippetStudio Settings

1. Open VS Code Settings (`Cmd+,` on macOS or `Ctrl+,` on Windows/Linux)
2. Search for `snippetStudio`
3. Find the **"Hide Extension Snippets"** setting
4. Enable this option to hide all extension snippets from suggestions
5. You can also configure specific extensions to hide

### Method 2: Per-Extension Configuration

1. Open the **SnippetStudio** view
2. Right-click on an extension in the **Extensions** section
3. Select **"Hide Snippets from This Extension"**
4. The extension's snippets will no longer appear in autocomplete suggestions

### Method 3: Global VS Code Settings

Add this to your `settings.json`:

```json
{
  "snippetStudio.hideExtensionSnippets": true,
  "snippetStudio.hiddenExtensions": [
    "extension-id-1",
    "extension-id-2"
  ]
}
```

**Use Case:** Hide extension snippets when:
- You prefer using only your custom snippets
- Extension snippets interfere with your workflow
- You want cleaner autocomplete suggestions
- You've already exported and customized the snippets you need

## Best Practices

- **Regular Exports:** Export important snippets periodically as a backup
- **Selective Hiding:** Hide extensions you rarely use instead of disabling them completely
- **Customization:** Export snippets you use frequently and customize them to your needs
- **Organization:** Keep exported snippets organized in folders by language or framework

## Troubleshooting

**Q: I can't see any extension snippets**
- Make sure you have extensions with snippets installed
- Check if "Hide Extension Snippets" is enabled in settings
- Restart VS Code after installing new snippet extensions

**Q: Export is not working**
- Ensure you have write permissions to the destination folder
- Check if the extension snippets are properly formatted
- Try exporting to a different location

**Q: Hidden snippets still appear**
- Reload VS Code window (`Cmd+R` or `Ctrl+R`)
- Check if the extension is listed in hidden extensions
- Verify your settings.json configuration
