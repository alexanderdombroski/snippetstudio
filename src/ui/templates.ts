import * as vscode from "vscode";
import { VSCodeSnippet, VSCodeSnippets } from "../types/snippetTypes.js";

/**
 * Creates a vscode.TreeItem from a VSCodeSnippet.
 *
 * @param snippetTitle The title of the snippet.
 * @param snippet The VSCodeSnippet object.
 * @returns A vscode.TreeItem representing the snippet.
 */
export function createTreeItemFromSnippet(snippetTitle: string, snippet: VSCodeSnippet): vscode.TreeItem {
    const treeItem = new vscode.TreeItem(snippetTitle, vscode.TreeItemCollapsibleState.None);

    treeItem.description = snippet.description;

    const body = Array.isArray(snippet.body) ? snippet.body.join('\n') : snippet.body;
    treeItem.tooltip = `${snippet.prefix}\n${body}`;


    // Add a command to show the snippet body when clicked
    treeItem.command = {
        title: 'Show Snippet Body',
        command: 'snippetstudio.showSnippetBody', // Replace with your command ID
        arguments: [body]
    };

    return treeItem;
}