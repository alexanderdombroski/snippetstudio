---
title: Local Editor Sync
sidebar_label: Local Editor Sync
sidebar_position: 7
---

# Local Editor Sync

Snippet Studio v5 introduces a new way snippets are stored across your IDEs.

## What Changed in v5

**v4**: Snippets were specific to each IDE. e.g. your VS Code snippets were separate from your Cursor snippets.

**v5+**: Snippets are now shared across all VS Code-like IDEs on your machine.

This means when you create or edit a snippet in VS Code, it automatically appears in Cursor, Windsurf, and other supported editors. Project-specific snippets continue to work in both versions as before.

## Why This Change

This unified approach simplifies snippet management for most users. You maintain one set of snippets that works consistently across all your editors, reducing duplication and ensuring you always have access to your best snippets regardless of which editor you're using.

## Keeping IDE-Specific Snippets

If you prefer to keep your snippets separate between IDEs (e.g., different VS Code snippets than Cursor snippets), you have two options:

### Option 1: Use Profiles

Profiles in VS Code are IDE-specific. Snippets added to a profile remain specific to that IDE and won't sync across different editors. You can:

1. Create separate profiles for each IDE
2. Add IDE-specific snippets to each profile
3. Use profile-specific snippet files

See [Working with profile snippets](./profile-snippets) for more details.

### Option 2: Stay on v4

If the unified sync model doesn't fit your workflow, you can continue using v4 releases. The v4 version will remain available for users who need IDE-specific snippet isolation.

To install v4:
1. Open the Extensions view in VS Code
2. Search for "Snippet Studio"
3. Click the version dropdown and select version 4.x
4. Install the older version

## How v5 Sync Works

When you first upgrade to v5, you'll be asked how you would like to configure your local sync.

1. A dropdown will ask which editor you'd like to consider default.
2. Your snippets will then be copied over.
3. Configure all supported editors one at a time as you update the VS Code extension

The sync operates on global snippets. Profile snippets remain IDE-specific, and project snippets in `.vscode/` folders remain project-specific as expected.
