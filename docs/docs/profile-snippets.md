---
id: profile-snippets
title: Working with Profile Snippets
sidebar_label: Profile snippets
---

# Working with profile snippets

This document explains how to use profile snippets with SnippetStudio and VS Code.

## Prerequisites
- VS Code installed
- SnippetStudio extension installed in VS Code
- A snippets file (JSON/YAML) you want to share between profiles

## Using the same snippets file across multiple profiles
1. Create a single snippets file (for example `.vscode/snippets.json`) and keep it in a shared location.
2. Configure each profile to use that path (example configuration — replace with actual config your extension uses):

```json
// example structure — adapt to SnippetStudio settings
{
  "profiles": {
    "work": {
      "snippetsPath": ".vscode/snippets.json"
    },
    "personal": {
      "snippetsPath": ".vscode/snippets.json"
    }
  }
}
