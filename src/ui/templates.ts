import * as vscode from "vscode";
import path from "path";
import { VSCodeSnippet } from "../types/snippetTypes.js";
import { getWorkspaceFolder } from "../utils/fsInfo.js";

export class TreeSnippet extends vscode.TreeItem {
    public snippetPath: string = "";
    
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly path: string
    ) {
        super(label, collapsibleState);
        this.snippetPath = path;
    }
}

/**
 * Creates a vscode.TreeItem from a VSCodeSnippet.
 *
 * @param snippetTitle The title of the snippet.
 * @param snippet The VSCodeSnippet object.
 * @returns A vscode.TreeItem representing the snippet.
 */
export function createTreeItemFromSnippet(snippetTitle: string, snippet: VSCodeSnippet, path: string): TreeSnippet {
    const prefix = Array.isArray(snippet.prefix) ? snippet.prefix[0] : snippet.prefix;
    const treeItem = new TreeSnippet(prefix, vscode.TreeItemCollapsibleState.None, path);

    treeItem.description = snippetTitle;
    treeItem.contextValue = "snippet";

    const body: string = Array.isArray(snippet.body) ? snippet.body.join('\n') : snippet.body;
    treeItem.tooltip = `Keyword: ${snippet.prefix}\n${body}${snippet.description ? "\n\n" + snippet.description : ""}`;


    // Command to show the snippet body when clicked
    treeItem.command = {
        title: 'Show Snippet Body',
        command: 'snippetstudio.snippet.showBody', 
        arguments: [treeItem]
    };

    return treeItem;
}

export function createTreeItemFromFilePath(filepath: string, collapsibleState: vscode.TreeItemCollapsibleState): vscode.TreeItem {
    const filename = path.basename(filepath);
    const treeItem = new vscode.TreeItem(filename, collapsibleState);
    treeItem.description = filepath;
    treeItem.tooltip = "Snippets from this dropdown are found in " + filepath + "\n\nRight Click to open the file!";
    treeItem.contextValue = "snippet-filepath";

    return treeItem;
}

export function selectedLanguageTemplate(langId: string | undefined): vscode.TreeItem {
    const treeItem = new vscode.TreeItem(langId === undefined ? "No Language Open" : `${langId}`.toUpperCase());
    treeItem.tooltip = "The language of the open file";
    return treeItem;
}

export function snippetLocationTemplate(filepath: string): vscode.TreeItem {
    const treeItem = new vscode.TreeItem(path.basename(filepath));
    treeItem.description = filepath;
    treeItem.tooltip = "Double click to open the file: " + filepath;
    treeItem.contextValue = "snippet-filepath";

    // Command to open Snippet file when double clicked
    treeItem.command = {
        title: 'Open Snippet File',
        command: 'snippetstudio.file.openFromDouble',
        arguments: [treeItem]
    };

    return treeItem;
}

export function localGlobalDropdownTemplates(global_collapsed: boolean, local_collapsed: boolean): vscode.TreeItem[] {
    const global = new vscode.TreeItem("Global Snippets", global_collapsed ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Collapsed);
    global.contextValue = "global-dropdown";
    global.tooltip = "Global Snippets are availiable anywhere in vscode";
    
    if (getWorkspaceFolder() === undefined) {
        return [ global ];
    }
    
    const local = new vscode.TreeItem("Local Snippets", local_collapsed ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Collapsed);
    local.contextValue = "local-dropdown";
    local.tooltip = "Local Snippets are only loaded while open to this folder.";
    
    return [ global, local ];
}