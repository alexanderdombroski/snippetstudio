import * as vscode from "vscode";
import path from "path";
import { VSCodeSnippet, VSCodeSnippets } from "../types/snippetTypes.js";

/**
 * Creates a vscode.TreeItem from a VSCodeSnippet.
 *
 * @param snippetTitle The title of the snippet.
 * @param snippet The VSCodeSnippet object.
 * @returns A vscode.TreeItem representing the snippet.
 */
export function createTreeItemFromSnippet(snippetTitle: string, snippet: VSCodeSnippet): vscode.TreeItem {
    const prefix = Array.isArray(snippet.prefix) ? snippet.prefix[0] : snippet.prefix;
    const treeItem = new vscode.TreeItem(prefix, vscode.TreeItemCollapsibleState.None);

    treeItem.description = snippetTitle;
    treeItem.contextValue = "snippet";

    const body: string = Array.isArray(snippet.body) ? snippet.body.join('\n') : snippet.body;
    treeItem.tooltip = `Keyword: ${snippet.prefix}\n${body}\n\n${snippet.description}`;


    // Add a command to show the snippet body when clicked
    treeItem.command = {
        title: 'Show Snippet Body',
        command: 'snippetstudio.showSnippetBody', // Replace with your command ID
        arguments: [treeItem]
    };

    return treeItem;
}

export function createTreeItemFromFilePath(filepath: string): vscode.TreeItem {
    const filename = path.basename(filepath);
    const treeItem = new vscode.TreeItem(filename, vscode.TreeItemCollapsibleState.Collapsed);
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
    treeItem.tooltip = filepath;

    return treeItem;
}