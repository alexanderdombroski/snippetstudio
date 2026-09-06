---
title: Export Snippets
sidebar_label: Export Snippets
sidebar_position: 5
---

# Export Snippets

Pick and choose snippets to copy to a `.code-snippets` file.

## Steps

At this point, you probably have *TONS* of snippets!

1. Choose `Export Snippets` in the <i className="codicon codicon-ellipsis"></i> three-dot menu of **Location Manager** or run the command `snippetstudio.file.export` in the command prompt.
2. Choose a **filename**
3. Choose a **folder save location**
4. Choose which **snippet files** to include in the export
5. For each file, choose which **snippets** to include

The file will be saved in that location.

## Configuration Settings

If you find yourself exporting a lot, you can make the experience suit you better with <i className="codicon codicon-settings-gear"></i> [configuration options](https://code.visualstudio.com/docs/configure/settings).

- Configure export location with `snippetstudio.export.location`
    - Choose 'preconfigured' to use a custom path defined in settings
    - Choose 'downloads' to save to your OS's downloads directory
    - Choose 'choose' to be prompted with a file dialog each time
- If you choose `preconfigured`, Set a custom filepath with `snippetstudio.export.preconfiguredExportPath`

<p className="small">*Do you have friends?... I mean... do you have friends that want your snippets?*</p>