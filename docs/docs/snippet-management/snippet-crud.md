---
title: Snippet CRUD
sidebar_label: Snippet CRUD
sidebar_position: 3
---

# Snippet CRUD

CRUD: creating, reading, updating, and deleting snippets and snippet files.

## Creating Snippets

Optionally highlight code to use it as a starting point, then do any of the following:

### Create Global Language Snippet

- Right click and choose `create language specific snippet`
- Click the <i className="codicon codicon-plus"></i> in the title of the **Snippets** sidebar view
- Enter `snippetstudio.snippet.addGlobal` in the command prompt

### Create Snippet in file of choice

- Hover over a snippet file in either the **Snippets** or **Locations Manager** sidebar view and click the <i className="codicon codicon-plus"></i>

*We already covered **Creating Snippet Files** in [Global vs Local Snippets](/docs/snippet-management/global-vs-local.md)*

## Reading Snippets

The **Snippets** tree-view gives a list of snippets of the active language. The **Locations Manager** tree-view shows all local and global snippet files.

Double click a **snippet file** to open it. Or right click and choose `Open Snippet File`

Double click any **snippet** for a popup of snippet details. [Vote](https://github.com/alexanderdombroski/snippetstudio/discussions/4) whether you want to see this behavior upgraded to a read-only editor tab.

## Updating Snippets

Click the <i className="codicon codicon-pencil"></i> icon to edit any snippet listed in the **snippets** sidebar view. Then click `save` when your done editing.

![Edit Snippet Example](https://raw.githubusercontent.com/alexanderdombroski/snippetstudio/refs/heads/main/public/examples/edit.gif)

## Deleting Snippets & Files

Click the <i className="codicon codicon-trash"></i> icon to delete a snippet or snippet file. The options are also available in the right click context menu.

![Delete Snippet Example](https://raw.githubusercontent.com/alexanderdombroski/snippetstudio/refs/heads/main/public/examples/delete.gif)

<p className="small text-center">*Comic Sans is NOT allowed!*</p>

## Refreshing Views

After C.R.U.D-ing a snippet or snippet file, the extension sidebar tree-views *should* auto refresh. If not, click the <i className="codicon codicon-refresh"></i> icon in the title menu of either view.

*Or you can be cool and type these commands in the command prompt.*

- `snippetstudio.refresh`
- `snippetstudio.refreshLocations`
