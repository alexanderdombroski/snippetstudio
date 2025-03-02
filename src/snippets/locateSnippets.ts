import * as path from 'path';
import * as vscode from 'vscode';
import os from 'os';
import fs from 'fs';
import { glob } from "glob";

/**
 * Finds all snippet files for a given language ID, starting from the workspace root and including global snippets. 
 * Returns an empty array if there is no open editor and workspace folder.
 *
 * @returns A promise that resolves to an array of file paths.
 */
async function locateSnippetFiles(): Promise<string[]> {
    const filePaths: string[] = [];
    const editor = vscode.window.activeTextEditor;
    console.log("Locating files!");

    if (editor === undefined) {
        return [];
    }
    const languageId = editor.document.languageId;
    const folder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
    if (folder) {
        const global = getGlobalSnippetFiles(languageId);
        if (global) {
            filePaths.push(global);
        }
        
        const localPaths = getAllParentDirs(folder.uri.fsPath);
        
        console.log("Lang: ", languageId);
        console.log("Dirs: ", localPaths);
        
        const filePathPromises = localPaths.map(path => findWorkspaceSnippetFiles(path, languageId));
        const workspaceSnippets = await Promise.all(filePathPromises);
        filePaths.push(...workspaceSnippets.flat());
        
    }

    return filePaths;
}

/**
 * Finds the snippet files in a workspace folder.
 *
 * @param folderPath The path to the workspace folder.
 * @param languageId The language ID to search for.
 * @param filePaths The array to store the found file paths.
 */
async function findWorkspaceSnippetFiles(folderPath: string, languageId: string): Promise<string[]> {
    const snippetFiles: string[] = [];
    const configPath = path.join(folderPath, '.vscode');
    const snippetFile = path.join(configPath, `${languageId}.json`);
    if (fs.existsSync(snippetFile)) {
        snippetFiles.push(snippetFile);
    }
    
    const files = await glob(path.join(configPath, '*.code-snippets'));
    snippetFiles.push(...files);
    
    return snippetFiles;
}


/**
 * Searches and finds the global snippets file for a given language.
 * 
 * @param languageId 
 * @returns returns a global snippet filepath, or empty string if couldn't find it.
 */
function getGlobalSnippetFiles(languageId: string): string {
    let globalSnippetsPath: string = "";
    switch (process.platform) {
        case 'win32':
            globalSnippetsPath = path.join(os.homedir(), 'AppData', 'Roaming', 'Code', 'User', 'snippets');
            break;
        case 'linux':
            globalSnippetsPath = path.join(os.homedir(), '.config', 'Code', 'User', 'snippets');
            break;
        case 'darwin':
            globalSnippetsPath = path.join(os.homedir(), 'Library', 'Application Support', 'Code', 'User', 'snippets');
            break;
        default:
            console.warn(`Unsupported platform: ${process.platform} Couldn't find global snippets file: ${languageId}`);
            return "";
    }

    if (!globalSnippetsPath) {
        return "";
    }
    
    let languageSnippetFilePath = "";
    languageSnippetFilePath = path.join(globalSnippetsPath, `${languageId}.json`);

    if (fs.existsSync(languageSnippetFilePath)) {
        return languageSnippetFilePath;
    } else {
        return "";
    }
}

function getAllParentDirs(filePath: string): string[] {
    const directoryTree: string[] = [filePath];
    let currentPath = filePath;

    while (true) {
        const parentPath = path.dirname(currentPath);
        if (parentPath === currentPath) { // Reached the root directory or an invalid path
            break;
        }
        directoryTree.push(parentPath);
        currentPath = parentPath;
    }
    return directoryTree;
}


export default locateSnippetFiles;