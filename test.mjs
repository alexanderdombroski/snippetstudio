import path from "path";
import os from "os";
import fs from "fs";
import { glob } from "glob";

function getAllParentDirs(filePath) {
    const directoryTree = [filePath];
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

function getGlobalSnippetFiles(languageId) {
    let globalSnippetsPath = "";
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

/**
 * Finds the snippet files in a workspace folder.
 *
 * @param folderPath The path to the workspace folder.
 * @param languageId The language ID to search for.
 * @param filePaths The array to store the found file paths.
 */
async function findWorkspaceSnippetFiles(folderPath, languageId) {
    const snippetFiles = [];
    const configPath = path.join(folderPath, '.vscode');
    const snippetFile = path.join(configPath, `${languageId}.json`);
    if (fs.existsSync(snippetFile)) {
        snippetFiles.push(snippetFile);
    }
    
    const files = await glob(path.join(configPath, '*.code-snippets'));
    snippetFiles.push(...files);
    
    return snippetFiles;
}
async function locateSnippetFiles() {
    const filePaths = [];
    console.log("Locating files!");

    const languageId = "python";
    const folder = "/Users/alexdombroski/vscode/html/snippetstudio";
    if (folder) {
        const global = getGlobalSnippetFiles(languageId);
        if (global) {
            filePaths.push(global);
        }
        
        const localPaths = getAllParentDirs("/Users/alexdombroski/vscode/html/snippetstudio");
        
        console.log("Lang: ", languageId);
        console.log("Dirs: ", localPaths);
        
        const filePathPromises = localPaths.map(path => findWorkspaceSnippetFiles(path, languageId));
        const workspaceSnippets = await Promise.all(filePathPromises);
        filePaths.push(...workspaceSnippets.flat());
        
    }

    return filePaths;
}
// console.log(getAllParentDirs("/Users/alexdombroski/vscode/html/snippetstudio"));
// console.log(getGlobalSnippetFiles("python"));
console.log(await locateSnippetFiles());
