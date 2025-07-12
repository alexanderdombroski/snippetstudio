---
title: Gists
sidebar_label: Gists
sidebar_position: 2
---

# Gists

Share snippets through [GitHub Gists](https://gist.github.com/).

## Export Snippets to Gist

*This feature an alternative to the [Export Snippets](/docs/snippet-management/export-snippets.md) feature.*

1. Choose `Export Snippets to Gist` in the <i className="codicon codicon-ellipsis"></i> three-dot menu of **Locations Manager** or run `snippetstudio.github.export` in the command prompt
2. Pick a filename
3. Choose snippet files to export
4. For each snippet file: choose snippets to export
5. Optional - type a description

A popup will give you the option to view the created gist on github. Copy the URL and send to a friend so they can import it as described below.

## Import Snippets from Gist

You can import recognized snippet files from GitHub Gists.

1. Choose `Import Snippets From Gist` in the <i className="codicon codicon-ellipsis"></i> three-dot menu of **Locations Manager** or run `snippetstudio.github.import` in the command prompt
2. Input a gist id, share url, or clone url
3. Choose a location to save the file(s) 
    - Downloads
    - Global snippets folder 
    - Local snippets folder

Disabling the default `snippetstudio.gists.onlySnippets` configuration setting will pull ALL files, not just snippet files.

## Browse Snippet Gists

When gists are created with this extension, the description field is edited. If left untouched, users can see [snippets created and shared with SnippetStudio](https://gist.github.com/search?q=snippetstudio+extension:.code-snippets&ref=searchresults).

Command: `snippetstudio.github.browse`