import fs from "fs";
import path from "path";
import * as vscode from 'vscode';
import { getWorkspaceFolder, getGlobalSnippetFilesDir } from "../utils/fsInfo";
import { getCurrentLanguage, langIds, selectLanguage } from "../utils/language";
import { getSavePath } from "../utils/user";
import { locateAllSnippetFiles } from "./locateSnippets";
import { VSCodeSnippets } from "../types/snippetTypes";
import { readJsoncFilesAsync, writeSnippetFile } from "../utils/jsoncFilesIO";

async function createFile(filepath: string, showInformationMessage: boolean = true): Promise<void> {
    try {
        await fs.promises.access(filepath); // Check if the file exists
        if (showInformationMessage) {
            vscode.window.showInformationMessage("File already exists! " + path.basename(filepath));
        }
    } catch (error) {
        if (error instanceof Error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
            // File doesn't exist, create it
            await fs.promises.mkdir(path.dirname(filepath), { recursive: true }); // Ensure directory exists
            await fs.promises.writeFile(filepath, '{}'); // Create an empty JSON file
        } else {
            vscode.window.showErrorMessage(`Error checking/creating file: ${error}`);
        }
    }
}

export async function getFileName(): Promise<string | undefined> {
    let name = await vscode.window.showInputBox({"prompt": "type a filename"});
    if (name === undefined) {
        vscode.window.showInformationMessage("Skipped file creation.");
        return undefined;
    }
    name = name?.trim(); 
    const regex = /^[a-zA-Z0-9_-]+$/;
    if (name && !regex.test(name)) {
        vscode.window.showErrorMessage("Only use characters, hyphens, numbers and/or underscores.");
        return undefined;
    }
    return name;
}

async function createLocalSnippetsFile(): Promise<void> {
    const cwd = getWorkspaceFolder();
    if (!(cwd)) {
        return;
    }
    const name = await getFileName();
    if (name === undefined) {
        return;
    }

    const filepath = path.join(cwd, '.vscode', `${name}.code-snippets`);
    await createFile(filepath);
}

async function createGlobalLangFile(): Promise<void> {
    const langId = getCurrentLanguage() ?? await selectLanguage();
    if (langId === undefined) {
        vscode.window.showErrorMessage('No recently used language.');
        return;
    }
    const dir = getGlobalSnippetFilesDir();
    if (!dir) {
        return;
    }
    const filepath = path.join(dir, `${langId}.json`);
    await createFile(filepath);
}

async function createGlobalSnippetsFile(): Promise<void> {
    const dir = getGlobalSnippetFilesDir();
    if (!dir) {
        return;
    }
    const name = await getFileName();
    if (name === undefined) {
        return;
    }

    const filepath = path.join(dir, `${name}.code-snippets`);
    await createFile(filepath);
}

async function exportSnippets() {
    const snippetFiles = (await locateAllSnippetFiles());
    if (snippetFiles.flat().length === 0) {
        vscode.window.showWarningMessage("You have no snippets to export. Operation cancelled");
        return;
    }
    
    // Select Save Paths
    const savePath = await getSavePath();
    if (savePath === undefined) {
        return;
    }

    // Select Snippets Files
    const fileItems = await vscode.window.showQuickPick(
        snippetFiles.flatMap(fileList => fileList.map(filepath => { return { label: path.basename(filepath), description: filepath }; })), 
        { canPickMany: true, title: "Choose Snippet Files to include in the Export" }
    );
    if (fileItems === undefined) {
        return;
    }
    const selectedPaths = fileItems.map(item => item.description);

    // Select Snippets
    await mergeSnippetFiles(savePath, selectedPaths);
}

async function mergeSnippetFiles(savePath: string, filepaths: string[]) {
    let snippetsToExport: VSCodeSnippets = {};
    const snippetGroups: [string, VSCodeSnippets][] = await readJsoncFilesAsync(filepaths);
    for (const [filepath, fileSnippets] of snippetGroups) {        
        const items = Object.entries(fileSnippets).map(([k, v]) => {
            const desc = Array.isArray(v.prefix) ? v.prefix.join(", ") : v.prefix;
            return { label: k, description: desc, picked: true };
        });

        if (items.length === 0) {
            continue;
        }
        
        // Select Snippets
        const quickPick = vscode.window.createQuickPick();
        quickPick.canSelectMany = true;
        quickPick.title = "Pick Snippets to export";
        quickPick.items = items;
        quickPick.show();

        const snippetKeys: string[]|undefined = await new Promise((resolve) => {
            quickPick.onDidAccept(() => {
                const selectedItems = quickPick.selectedItems.map(item => item.label);
                quickPick.hide();
                resolve(selectedItems);
            });
            quickPick.onDidHide(() => {
                resolve(undefined);
            });
        });

        // Add Snippets to export object
        if (snippetKeys !== undefined) {
            const langId = path.basename(filepath, path.extname(filepath));
            snippetKeys.forEach(key => {
                if (key in snippetsToExport) {
                    vscode.window.showWarningMessage(`Two Snippets hold the same titleKey: ${key}. Only one will be used`);
                }
                const obj = fileSnippets[key];

                if (obj.scope === undefined && path.extname(filepath) === ".json" && langIds.includes(langId)) {
                    obj.scope = langId;
                }
                snippetsToExport[key] = obj;
            });
        }
    }

    await writeSnippetFile(savePath, snippetsToExport, `Snippets exported to ${savePath}`);
}

export { createGlobalLangFile, createLocalSnippetsFile, createGlobalSnippetsFile, createFile, exportSnippets};