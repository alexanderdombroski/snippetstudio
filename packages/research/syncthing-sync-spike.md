# SnippetStudio — Cross-Editor Sync via Syncthing · Spike

> **Scope:** Extend the `location-manager` tree view to support bidirectional snippet sync across VS Code-compatible editors (VS Code, Cursor, Windsurf, etc.) using [Syncthing](https://syncthing.net/) as the sync engine.

---

## Table of Contents

1. [Background](#background)
2. [Tree View Structure](#tree-view-structure)
3. [Commands](#commands)
4. [Sync Configuration Design](#sync-configuration-design)
5. [Syncthing Install Helper](#syncthing-install-helper)
6. [Editor Dropdown Utilities](#editor-dropdown-utilities)
7. [First-Run / Truth-Source Flow](#first-run--truth-source-flow)
8. [Open Questions](#open-questions)
9. [Additional Features to Consider](#additional-features-to-consider)

---

## Background

SnippetStudio already surfaces snippet file locations through the `location-manager` tree view (`LocationTreeProvider.ts`).
The top-level tree today looks like:

```
📦 location-manager
├── 🌐 Global Snippets
├── 📁 Local Snippets          (workspace only)
├── 🧩 Extension Snippets
├── 👤 Profiles Snippets       (only if > 1 profile)
└── 💻 Code Editors            ← AllEditorsDropdown (stub)
```

The **Code Editors** node is the natural home for cross-editor sync. All new sync-related tree items, commands, and configuration will live under or alongside it.

---

## Tree View Structure

### Proposed `location-manager` Layout

```
📦 location-manager
├── 🌐 Global Snippets
├── 📁 Local Snippets
├── 🧩 Extension Snippets
├── 👤 Profiles Snippets
└── 💻 Code Editors
    ├── [title bar actions: ⚙ Configure Sync | ▶ Sync Now | 📦 Install Syncthing]
    │
    ├── 🟢 VS Code           ← EditorDropdown  (synced, source of truth badge)
    │   ├── [inline actions: Open Snippets Folder | Reveal in Explorer]
    │   └── Sync: Global · Profiles             (status description)
    │
    ├── 🟢 Cursor            ← EditorDropdown  (synced)
    │   ├── [inline actions: Open Snippets Folder | Reveal in Explorer | Disable Sync]
    │   └── Sync: Global                        (status description)
    │
    ├── 🔴 Windsurf          ← EditorDropdown  (detected but not synced)
    │   └── [inline actions: Enable Sync]
    │
    └── ➕ Add Editor...      ← manual path entry for unknown editors
```

### Tree Item Types

| Class | `contextValue` | Level | Notes |
|---|---|---|---|
| `AllEditorsDropdown` | `all-editors` | Root | Already exists in `dropdowns.ts` |
| `SyncStatusDropdown` | `sync-status` | Under `all-editors` | Shows Syncthing daemon status |
| `EditorDropdown` | `editor-item editor-synced` / `editor-item editor-unsynced` | Under `all-editors` | One per detected editor install |
| `AddEditorItem` | `editor-add` | Under `all-editors` | Static leaf to add custom editor |

**`EditorDropdown` label decoration ideas:**
- 🟢 = synced & daemon running
- 🟡 = synced but daemon offline
- 🔴 = detected, not synced
- ⚪ = manually added, undetected

---

## Commands

### Tree View Title Bar (`all-editors` context)

These appear in the `...` menu / icon row of the **Code Editors** node header.

| Command ID | Title | Description |
|---|---|---|
| `snippetstudio.sync.configure` | `$(gear) Configure Sync` | Opens sync settings webview/quickpick wizard |
| `snippetstudio.sync.now` | `$(sync) Sync Now` | Manually triggers a Syncthing rescan |
| `snippetstudio.sync.status` | `$(info) Sync Status` | Shows daemon status and last sync time |
| `snippetstudio.sync.install` | `$(cloud-download) Install Syncthing` | Smart install helper (see below) |
| `snippetstudio.sync.openDashboard` | `$(globe) Open Syncthing Dashboard` | Opens `http://localhost:8384` in browser |

### Per-Editor Item (`editor-item` context)

Inline icon buttons and right-click menu on individual editor nodes.

| Command ID | Title | When visible |
|---|---|---|
| `snippetstudio.sync.editor.enable` | `$(add) Enable Sync` | Editor detected, not synced |
| `snippetstudio.sync.editor.disable` | `$(remove) Disable Sync` | Editor is synced |
| `snippetstudio.sync.editor.openFolder` | `$(folder-opened) Open Snippets Folder` | Always |
| `snippetstudio.sync.editor.revealInExplorer` | `$(explorer-view-icon) Reveal in OS Explorer` | Always |
| `snippetstudio.sync.editor.setTruthSource` | `$(verified-filled) Set as Source of Truth` | Editor is synced |
| `snippetstudio.sync.editor.copySnippetsTo` | `$(copy) Copy Snippets To…` | Always — one-time manual push |
| `snippetstudio.sync.editor.viewDiff` | `$(diff) View Snippet Diff` | When conflicts detected |

### Global / Palette Commands

| Command ID | Title | Notes |
|---|---|---|
| `snippetstudio.sync.configure` | `SnippetStudio: Configure Cross-Editor Sync` | Palette entry for configure wizard |
| `snippetstudio.sync.installSyncthing` | `SnippetStudio: Install Syncthing` | Runs smart install helper |
| `snippetstudio.sync.detectEditors` | `SnippetStudio: Detect Installed Editors` | Rescans for compatible editors |
| `snippetstudio.sync.chooseEditors` | `SnippetStudio: Choose Editors to Sync` | Multi-select quickpick |
| `snippetstudio.sync.chooseTruthSource` | `SnippetStudio: Choose Source of Truth Editor` | Sets which editor's snippets win on first sync |
| `snippetstudio.sync.exportConfig` | `SnippetStudio: Export Sync Config` | Saves syncthing folder config to file |
| `snippetstudio.sync.importConfig` | `SnippetStudio: Import Sync Config` | Restores a saved config |

---

## Sync Configuration Design

### What Can Be Synced (per editor)

| Scope | Description | Notes |
|---|---|---|
| **Global Snippets** | The active profile's `snippets/` folder | Most common use case |
| **All Profile Snippets** | Each profile's `snippets/` sub-folder | Keeps profiles independent across machines |
| **Full Profile Folder** | Entire profile directory | Includes settings, keybindings — probably too aggressive; out of scope for v1 |

> **Recommendation for v1:** Sync only the `snippets/` subdirectory within each profile. Syncing the full profile folder risks overwriting settings and keybindings unintentionally.

### Configuration Object (conceptual shape)

```ts
interface SyncConfig {
  enabled: boolean;
  syncthingApiKey?: string;  // if using REST API
  truthSource: EditorId;     // e.g. "vscode", "cursor"
  editors: Record<EditorId, EditorSyncConfig>;
}

interface EditorSyncConfig {
  enabled: boolean;
  executablePath?: string;   // resolved or user-supplied
  syncGlobal: boolean;
  syncProfiles: boolean;     // syncs each profile's snippets/ subfolder
  profileFilter?: string[];  // only sync these profile names; undefined = all
}

type EditorId = "vscode" | "cursor" | "windsurf" | string; // string = custom
```

### Storage

- Settings stored in VS Code `globalState` (persisted across sessions).
- Optionally exportable to `~/.snippetstudio/sync-config.json` for portability.

---

## Syncthing Install Helper

`snippetstudio.sync.installSyncthing` detects the platform/package manager and either installs automatically or opens the download page.

### Detection & Install Matrix

| Platform | Detection | Install Command |
|---|---|---|
| **macOS + Homebrew** | `which brew` | `brew install syncthing` |
| **macOS (no brew)** | fallback | Open `https://syncthing.net/downloads/` |
| **Linux + apt** | `which apt-get` | `sudo apt-get install syncthing` |
| **Linux + apk** (Alpine) | `which apk` | `apk add syncthing` |
| **Linux + dnf** (Fedora/RHEL) | `which dnf` | `sudo dnf install syncthing` |
| **Linux + pacman** (Arch) | `which pacman` | `sudo pacman -S syncthing` |
| **Linux + snap** | `which snap` | `sudo snap install syncthing` |
| **Windows + winget** | `where winget` | `winget install Syncthing.Syncthing` |
| **Windows + choco** | `where choco` | `choco install syncthing` |
| **Fallback (any)** | — | Open `https://syncthing.net/downloads/` |

### UX Flow

1. Check if `syncthing` binary already exists on `$PATH`.
2. If yes → show info notification: *"Syncthing is already installed."*
3. If no → detect package manager (try in order of preference per platform).
4. Show confirmation modal: *"Install Syncthing via `brew install syncthing`? [Install] [Open Website] [Cancel]"*
5. Run command in integrated terminal with progress notification.
6. On completion, verify binary and prompt: *"Syncthing installed. Start daemon now? [Yes] [No]"*

---

## Editor Dropdown Utilities

The **Code Editors** top-level dropdown is **not** a mirror of the full snippet tree. Instead, each editor node exposes editor-specific utility actions:

### Built-in Recognized Editors

| Editor | Detection Path(s) |
|---|---|
| **VS Code** (stable) | `~/Library/Application Support/Code`, `~/.config/Code`, `%APPDATA%\Code` |
| **VS Code Insiders** | `...Code - Insiders` |
| **Cursor** | `~/Library/Application Support/Cursor`, `~/.config/Cursor` |
| **Windsurf** | `~/Library/Application Support/Windsurf`, `~/.config/Windsurf` |
| **VSCodium** | `...VSCodium` |
| **Positron** | `...Positron` |

### Per-Editor Available Actions

- Open that editor's global snippets folder in OS file explorer
- One-time "copy my snippets into this editor" push
- Enable/disable Syncthing sync for this editor
- View detected snippet file count (shown as tree item description)
- Set as source of truth

---

## First-Run / Truth-Source Flow

### Is the Source-of-Truth Prompt Always Necessary?

**Short answer: yes, but only on initial enable.**

When you first link two directories that already have content, Syncthing will attempt to reconcile them using *last-modified timestamp* to resolve conflicts — not content. If both directories have different snippets, you could end up with an unpredictable merge. An explicit "source of truth" prompt avoids data loss.

### Proposed First-Run Wizard

```
Step 1: "Syncthing detected / installed ✓"
         [Next]

Step 2: "Which editors would you like to sync snippets across?"
         [ ] VS Code (current)
         [ ] Cursor  ← detected at ~/Library/Application Support/Cursor
         [ ] Windsurf ← detected
         [ ] Add custom editor path…
         [Next]

Step 3: "What would you like to sync?"
         (•) Global snippets only
         ( ) Global + all profile snippets
         [Next]

Step 4: "Choose source of truth"
         "On first sync, one editor's snippets will overwrite the others."
         (•) VS Code (current editor — recommended)
         ( ) Cursor
         ( ) Windsurf
         ⚠ The selected editor's snippets will overwrite others on first sync.
         [Begin Sync] [Cancel]
```

### What Happens After

1. Syncthing shared folders are created/configured for each selected snippet path.
2. A one-time file copy is made from the truth-source editor to all target editors.
3. Syncthing daemon is started (or prompted to start as a system service).
4. Ongoing sync is bidirectional — whichever file changes last wins (standard Syncthing behavior).

### Conflict Resolution Options (advanced config)

| Mode | Behavior |
|---|---|
| **Last Modified Wins** (default Syncthing) | Standard behavior; fine for individual machines |
| **Prefer Truth Source** | Always prefer the designated editor; others are effectively read-only |
| **Prompt on Conflict** | VS Code notification when Syncthing detects a `.sync-conflict-*` file |

---

## Open Questions

1. **Sync scope — full profile vs. snippets-only?**
   Syncing only `snippets/` within each profile is safer but requires one Syncthing folder per profile per editor. Full-profile sync is simpler but risks cross-contaminating settings/keybindings. **Leaning toward snippets-only for v1.**

2. **Syncthing daemon lifecycle — who owns it?**
   Options: (a) extension starts/stops Syncthing subprocess, (b) user runs Syncthing as a system service independently, (c) extension only configures Syncthing via REST API. Option (b) is simplest to start; (c) is most robust long-term.

3. **Syncthing REST API vs. config file manipulation?**
   Syncthing exposes a full [REST API](https://docs.syncthing.net/dev/rest.html) at `localhost:8384`. Folder config can also be written to `~/.config/syncthing/config.xml`. API is cleaner but requires the daemon to be running. XML manipulation works offline.

4. **Windows support?**
   Detection paths and shell commands differ. `winget` is available on modern Windows 10/11 but not guaranteed. Should Windows be v1 scope or deferred?

5. **Conflict files?**
   Syncthing creates `filename.sync-conflict-*.ext` files on conflict. The extension should either surface these in the tree or clean them up after user resolution.

6. **Profile-level granularity?**
   Allow per-profile opt-in (e.g. "only sync the Default profile") or always all-or-nothing per editor?

7. **Remote sync (not just local machine)?**
   Syncthing is designed for multi-machine sync. Should the UI expose device pairing, or stay localhost-only for v1?

---

## Additional Features to Consider

### Near-term (v1 scope candidates)

- **Sync Health Indicator** in the VS Code status bar (🟢 Synced / 🔴 Daemon offline)
- **Conflict File Surfacing** — detect `*.sync-conflict-*` files and show a notification with a diff action
- **Dry-run / Preview** — show what files would be copied before first sync
- **Auto-start daemon** on extension activation (opt-in setting)
- **Exclude patterns** — allow `.code-snippets` files matching a glob to be excluded from sync

### Medium-term

- **Import/Export from non-VSCode editors** — convert snippet format (pairs with the existing Import/Export research discussion)
- **Sync profiles by name** — user picks "Default, Work" rather than "all profiles"
- **Webview configuration panel** — richer UI than quickpick wizard for managing multiple editors + profiles
- **Syncthing device pairing UI** — pair with a second machine directly from the extension

### Long-term / Stretch

- **Cloud relay without Syncthing** — use a GitHub Gist or private repo as the sync backend (different feature, same goal)
- **Team snippets** — shared Syncthing folder for a team; read-only members
- **Snippet format translation** — auto-convert when syncing to editors that use different snippet schemas (Sublime, JetBrains, etc.)
