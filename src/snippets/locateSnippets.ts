import * as path from 'path';
import fs from 'fs';
import { glob } from "glob";
import { getGlobalSnippetFilesDir, getWorkspaceFolder } from '../utils/fsInfo.js';
import { getCurrentLanguage, langIds } from '../utils/language.js';

// ---------------------------- Language Specfic ---------------------------- //

/**
 * Finds all snippet files for a given language ID, starting from the workspace root and including global snippets. 
 * Returns an empty array if there is no open editor and workspace folder.
 *
 * @returns A promise that resolves to an array of file paths.
 */
async function locateSnippetFiles(): Promise<string[]> {
    const filePaths: string[] = [];

    // Global
    const langId = getCurrentLanguage();
    const global = getGlobalSnippetFiles(langId);
    filePaths.push(...global);
    
    // Local
    const folder = getWorkspaceFolder();
    if (folder) {   
        const workspaceSnippets = await findWorkspaceSnippetFiles(folder, langId);
        filePaths.push(...workspaceSnippets);
    }

    return filePaths;
}

/**
 * Finds the snippet files in a workspace folder.
 *
 * @param folderPath The path to the workspace folder.
 * @param langId The language ID to search for.
 * @param filePaths The array to store the found file paths.
 */
async function findWorkspaceSnippetFiles(folderPath: string, langId: string | undefined): Promise<string[]> {
    const snippetFiles: string[] = [];
    const configPath = path.join(folderPath, '.vscode');
    const snippetFile = path.join(configPath, `${langId}.json`);
    if (langId !== undefined && fs.existsSync(snippetFile)) {
        snippetFiles.push(snippetFile);
    }
    
    const files = await glob(path.join(configPath, '*.code-snippets'));
    snippetFiles.push(...files);
    
    return snippetFiles;
}


/**
 * Searches and finds the global snippets file for a given language.
 * 
 * @param langId 
 * @returns returns a global snippet filepath, or empty string if couldn't find it.
 */
function getGlobalSnippetFiles(langId: string | undefined): string[] {
    const paths: string[] = [];
    const globalSnippetsPath = getGlobalSnippetFilesDir();
    if (!globalSnippetsPath) {
        return [];
    }
    
    const languageSnippetFilePath = path.join(globalSnippetsPath, `${langId}.json`);
    if (langId !== undefined && fs.existsSync(languageSnippetFilePath)) {
        paths.push(languageSnippetFilePath);
    }
    const globalMixedSnippetsPath = path.join(globalSnippetsPath, "global.code-snippets");
    if (fs.existsSync(globalMixedSnippetsPath)) {
        paths.push(globalMixedSnippetsPath);
    }
    return paths;
}

// ---------------------------- Any Language ---------------------------- //

/**
 * Returns a tuple of local and global snippets of any language. [ LOCAL, GLOBAL ]
 *
 * @param folderPath The path to the workspace folder.
 * @param filePaths The array to store the found file paths.
 */
async function locateAllSnippetFiles(): Promise<[string[], string[]]> {
    let locals: string[] = [];
    let globals: string[] = [];

    const cwd = getWorkspaceFolder();
    if (cwd !== undefined) {
        locals = await findAllSnippetFilesInDir(path.join(cwd, ".vscode"));
    }
    
    const globalDir = getGlobalSnippetFilesDir();
    if (globalDir !== undefined) {
        globals = await findAllSnippetFilesInDir(globalDir);
    }

    return [locals, globals];
}

/**
 * Finds all the snippet files in a workspace folder for any language.
 *
 * @param folderPath The path to the workspace folder.
 * @param filePaths The array to store the found file paths.
 */
async function findAllSnippetFilesInDir(folderPath: string): Promise<string[]> {
    const snippetFiles: string[] = [];
    
    for (var langId of langIds) {
        const snippetFile = path.join(folderPath, `${langId}.json`);
        if (fs.existsSync(snippetFile)) {
            snippetFiles.push(snippetFile);
        }
    }
    
    const files = await glob(path.join(folderPath, '*.code-snippets'));
    snippetFiles.push(...files);
    
    return snippetFiles;
}

export { locateSnippetFiles, locateAllSnippetFiles };