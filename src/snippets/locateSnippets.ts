import * as path from 'path';
import * as vscode from 'vscode';
import fs from 'fs';
import { glob } from "glob";
import { getGlobalSnippetFilesDir, getWorkspaceFolder } from '../utils/fsInfo';
import { getCurrentLanguage } from '../utils/language';

/**
 * Finds all snippet files for a given language ID, starting from the workspace root and including global snippets. 
 * Returns an empty array if there is no open editor and workspace folder.
 *
 * @returns A promise that resolves to an array of file paths.
 */
async function locateSnippetFiles(): Promise<string[]> {
    const filePaths: string[] = [];
    const folder = getWorkspaceFolder();
    if (folder) {
        const languageId = getCurrentLanguage();
        if (languageId === undefined) {
            return filePaths;
        }
        
        const global = getGlobalSnippetFiles(languageId);
        filePaths.push(...global);
        
        const localPaths = getAllParentDirs(folder);
        
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
function getGlobalSnippetFiles(languageId: string): string[] {
    const paths: string[] = [];
    const globalSnippetsPath = getGlobalSnippetFilesDir();
    if (!globalSnippetsPath) {
        return [];
    }
    
    const languageSnippetFilePath = path.join(globalSnippetsPath, `${languageId}.json`);
    if (fs.existsSync(languageSnippetFilePath)) {
        paths.push(languageSnippetFilePath);
    }
    const globalMixedSnippetsPath = path.join(globalSnippetsPath, "global.code-snippets");
    if (fs.existsSync(globalMixedSnippetsPath)) {
        paths.push(globalMixedSnippetsPath);
    }
    return paths;
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