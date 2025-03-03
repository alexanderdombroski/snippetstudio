import fs from "fs";
import path from "path";
import * as vscode from 'vscode';
import { getWorkspaceFolder, getGlobalSnippetFilesDir } from "../utils/fsInfo";

async function createFile(filepath: string): Promise<void> {
    try {
        await fs.promises.access(filepath); // Check if the file exists
        vscode.window.showInformationMessage("File already exists!");
    } catch (error) {
        if (error instanceof Error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
            // File doesn't exist, create it
            await fs.promises.mkdir(path.dirname(filepath), { recursive: true }); // Ensure directory exists
            await fs.promises.writeFile(filepath, '{}'); // Create an empty JSON file
            console.log(`File created: ${path.basename(filepath)}`);
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

async function createLocalLangFile(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    const cwd = getWorkspaceFolder();
    if (!(cwd && editor)) {
        return;
    }
    const langId = editor.document.languageId;
    
    const filepath = path.join(cwd, '.vscode', `${langId}.json`);
    await createFile(filepath); // Async
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
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active text editor.');
        return;
    }
    const dir = getGlobalSnippetFilesDir();
    if (!dir) {
        return;
    }
    const langId = editor.document.languageId;
    const filepath = path.join(dir, `${langId}.json`);
    await createFile(filepath);
}

async function createGlobalSnippetsFile(): Promise<void> {
    const dir = getGlobalSnippetFilesDir();
    if (!dir) {
        return;
    }
    const filepath = path.join(dir, "global.code-snippets");
    await createFile(filepath);
}

export { createGlobalLangFile, createLocalLangFile, createLocalSnippetsFile, createGlobalSnippetsFile };