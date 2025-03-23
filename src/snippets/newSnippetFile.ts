import fs from "fs";
import path from "path";
import * as vscode from 'vscode';
import { getWorkspaceFolder, getGlobalSnippetFilesDir } from "../utils/fsInfo";
import { getCurrentLanguage, selectLanguage } from "../utils/language";

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

async function getFileName(): Promise<string | undefined> {
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

export { createGlobalLangFile, createLocalSnippetsFile, createGlobalSnippetsFile, createFile };