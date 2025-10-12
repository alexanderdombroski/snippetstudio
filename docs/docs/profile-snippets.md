---
id: profile-snippets
title: Working with profile snippets
sidebar_label: Profile snippets
description: How to use and share snippets between profiles with SnippetStudio and VS Code.
---

# Working with profile snippets

## Summary
This page explains how to use **profiles** in SnippetStudio (or similar snippet-management extensions) and covers:
- Using a snippets file with more than one profile.
- How to configure so you only see snippets for the active profile.
- Example snippets and a suggested workflow.

> Note: This project uses Docusaurus for docs. This markdown will render as part of the documentation site after maintainers build it.

---

## 1 — Quick concepts
- **Profile**: a named collection of snippets/settings you can switch between (for different projects or contexts).
- **Snippet file**: a JSON/other file that contains one or more snippets. VS Code supports user and workspace snippets (`*.code-snippets` or language-specific `.json` snippet files).

---

## 2 — How to try this locally (basic manual flow)
1. Install the SnippetStudio extension in VS Code (or the extension the project references).
2. Open the Command Palette (Ctrl/Cmd + Shift + P) and search for commands that contain `snippet` or the extension name. Look for commands to:
   - Create a new profile
   - Switch active profile
   - Import / Export snippets
3. Create two profiles (for example `work` and `side-project`).
4. Create a shared snippets file (see example below) and either:
   - Import it into each profile using the extension's import function, or
   - Put it in a shared folder and configure each profile to reference that file (if the extension supports that), or
   - Keep one “canonical” file and copy changes between profiles when needed.

---

## 3 — Using a snippet file on more than one profile (recommended approaches)
There are three practical approaches — pick one that fits the extension and your workflow:

**A — Shared file + reference (best when supported)**  
Store shared snippets in a single file in a common folder (for example `~/.snippetstudio/shared-snippets.json`) and configure each profile to reference that file. This means edits update all profiles automatically.

**B — Import / Export**  
Use the extension’s import/export: export the shared file, import into each profile. This is simple but duplicates data.

**C — Sync via dotfiles or Git**  
Keep shared snippets under version control and use a small script, or dotfile manager, to deploy them into each profile’s folder (when working across machines).

> If the extension supports file references or includes, prefer approach A.

---

## 4 — How to show only the active profile’s snippets
Most snippet-manager extensions offer a setting or toggle to restrict shown snippets to the active profile. To change that:
1. Open the extension options in VS Code (Extensions → open the extension → *Extension Settings*).
2. Look for a setting named like *Show snippets from active profile only* or *Enable profile filtering*.
3. Alternatively, use the Command Palette and search for `profile` or `snippet` commands to find the “Switch active profile” command and any visibility toggles.

**If you can’t find the setting**: leave a short note in this doc saying which exact setting to use — maintainers can update it once one of the maintainers confirms the exact setting name.

---

## 5 — Example snippet file (VS Code snippet JSON format)
This is a standard VS Code snippet example — it should work as a snippet source for many snippet managers that use VS Code format.

```json
{
  "Console log": {
    "prefix": "log",
    "body": [
      "console.log($1);",
      "$2"
    ],
    "description": "Log output to console"
  },
  "React functional component": {
    "prefix": "rfc",
    "body": [
      "import React from 'react';",
      "",
      "const $1 = () => {",
      "  return (",
      "    <div>$2</div>",
      "  );",
      "};",
      "",
      "export default $1;"
    ],
    "description": "React functional component template"
  }
}

  }
}
