---
title: Working with Extension Snippets
sidebar_label: Extension Snippets
sidebar_position: 6
---

# Working with Extension Snippets

This guide explains how to work with snippets from VS Code extensions using SnippetStudio.

## What are Extension Snippets?

Extension snippets are code snippets provided by VS Code extensions. Unlike user snippets (which you create yourself), extension snippets are bundled with extensions and provide pre-built code templates for various programming languages and frameworks.

To learn more about snippet-based extensions, see the VS Code documentation on [installing](https://code.visualstudio.com/docs/editing/userdefinedsnippets#_install-snippets-from-the-marketplace) or [creating](https://code.visualstudio.com/api/language-extensions/snippet-guide) snippet extensions.

## Export All Snippets from an Extension

SnippetStudio allows you to export all snippets from an installed extension at once:

1. Open the **Location Manager** view from the Activity Bar
2. Navigate to the **Extensions** section
3. Locate the extension snippet file containing the snippets you want to export
4. Select <i className="codicon codicon-new-file"></i> **"Extract Snippets to a new file"**
5. Choose a filename
6. Choose a destination folder for the exported snippets
7. All snippets from that file will be saved as a `.code-snippets` file.

**Use Case:** This is useful when you want to:
- Use extension snippets without having the extension installed
- Modify extension snippets for personal use
- Create a backup of extension snippets
- Share snippets from an extension with your team

## Export a Single Snippet from an Extension

To export just one specific snippet from an extension:

1. Open the **Snippets** view
2. Open a file of a language that you have extension snippets installed
3. Expand the extension in the **Extensions** section
4. Browse through the available snippets
4. Click <i className="codicon codicon-pencil"></i> to edit a copy of a snippet
5. Select a file to export the snippet to
6. Edit the snippet like normal

_Note: This won't edit the snippet in the extension itself, but will only make a copy_

**Use Case:** This is ideal when you:
- Only need one or two snippets from a large extension
- Want to customize a specific snippet without affecting others

## Hide Extension Snippets

You can disable these features. Click on the <i className="codicon codicon-gear"></i> to edit extension settings, then set `snippetstudio.view.showExtensions` to `false`.

**Use Case:** Hide extension snippets when:
- You want to simplify the snippet and location manager view
- You want a slight increase in performance. The extension won't scan installed extensions for snippets at all, reducing background fileIO operations

## Troubleshooting

**Q: I can't see any extension snippets**
- Make sure you have extensions with snippets installed
- Check if `snippetstudio.view.showExtensions` is enabled in settings
- You must have at least one custom snippet file created for snippets to appear in the locations manager view
- Snippets won't appear if the extension didn't use properly formatted JSON.

**Q: Export is not working**
- Check if the extension snippets are properly formatted
- Try exporting to a different location

**Q: Extension snippets still appear after disabling**
- Hit the <i className="codicon codicon-refresh"></i> refresh button
- Verify your settings.json configuration
