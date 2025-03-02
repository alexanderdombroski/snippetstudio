import readJsoncFilesAsync from "../utils/readJsoncFilesAsync.mjs";
import { VSCodeSnippet, VSCodeSnippets } from "../types/snippetTypes.js";
import locateSnippetFiles from "./locateSnippets.mjs";
import * as vscode from "vscode";
import { createTreeItemFromSnippet } from "../ui/templates.js";

export default async function loadSnippets(): Promise<vscode.TreeItem[][]>  {
    const snippetFiles: string[] = await locateSnippetFiles();
    const snippetGroups: VSCodeSnippets[] = await readJsoncFilesAsync(snippetFiles);
    const treeItems = snippetGroups.map(group => {
        return Object.entries(group).map(([k, v]) => {
            return createTreeItemFromSnippet(k, v);
        });
    });

    return treeItems;
}