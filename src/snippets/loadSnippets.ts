import { readJsoncFilesAsync } from "../utils/jsoncFilesIO.js";
import { VSCodeSnippets } from "../types/snippetTypes.js";
import { locateSnippetFiles } from "./locateSnippets.js";
import * as vscode from "vscode";
import { createTreeItemFromFilePath, createTreeItemFromSnippet } from "../ui/templates.js";
import { getCurrentLanguage } from "../utils/language.js";

export default async function loadSnippets(): Promise<[vscode.TreeItem, vscode.TreeItem[]][]>  {
    const snippetFiles: string[] = await locateSnippetFiles();
    const snippetGroups: [string, VSCodeSnippets][] = await readJsoncFilesAsync(snippetFiles);
    const treeItems: [vscode.TreeItem, vscode.TreeItem[]][] = snippetGroups.map(([filePath, group]) => {
        const snippets = Object.entries(group)
            .filter(([_, v]) => v.scope === undefined || v.scope === getCurrentLanguage())
            .map(([k, v]) => createTreeItemFromSnippet(k, v, filePath));
        const dropdown = createTreeItemFromFilePath(filePath, snippets.length === 0 ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Collapsed);
        return [dropdown, snippets];
    });

    return treeItems;
}