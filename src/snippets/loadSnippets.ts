import { readJsoncFilesAsync } from "../utils/jsoncFilesIO.js";
import { VSCodeSnippets } from "../types/snippetTypes.js";
import { locateSnippetFiles } from "./locateSnippets.js";
import * as vscode from "vscode";
import { createTreeItemFromFilePath, createTreeItemFromSnippet } from "../ui/templates.js";

export default async function loadSnippets(): Promise<[vscode.TreeItem, vscode.TreeItem[]][]>  {
    const snippetFiles: string[] = await locateSnippetFiles();
    const snippetGroups: [string, VSCodeSnippets][] = await readJsoncFilesAsync(snippetFiles);
    const treeItems: [vscode.TreeItem, vscode.TreeItem[]][] = snippetGroups.map(([filePath, group]) => {
        const dropdown = createTreeItemFromFilePath(filePath);
        const snippets = Object.entries(group).map(([k, v]) => {
            return createTreeItemFromSnippet(k, v);
        });
        return [dropdown, snippets];
    });

    return treeItems;
}