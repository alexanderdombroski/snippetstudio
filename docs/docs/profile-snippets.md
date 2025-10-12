---
id: profile-snippets
title: Working with profile snippets
sidebar_label: Profile snippets
description: How to use and share snippets between profiles with SnippetStudio and VS Code.
---

# Working with profile snippets

SnippetStudio has great support for [VS Code profiles](https://code.visualstudio.com/docs/configure/profiles). When adding a global snippet, it will add it to the active profile.

## Multi profile Snippets

You can right click a snippet file and choose to link <i className="codicon codicon-link"></i> it across multiple profiles.

1. Create snippets file
2. Right click to "choose profiles to use this snippet"
3. The snippet file will be moved/copied to the other profiles

## Simplify the views to only show the active profile’s snippets

You can disable scanning for other profiles. Click on the <i className="codicon codicon-gear"></i> to edit extension settings, then set `snippetstudio.view.showProfiles` to false.

**Use Case**: Hide profile snippets when:

- You want to simplify the snippet and location manager view
- You want a slight increase in performance. The extension won't scan snippets of other profiles at all, reducing background fileIO operations
