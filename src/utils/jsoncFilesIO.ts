import * as fs from 'fs/promises'; // Import fs/promises for async file operations
import { VSCodeSnippets } from '../types/snippetTypes.js';
import * as vscode from "vscode";
import path from "path";

async function processJsonWithComments(jsonString: string): Promise<any> {
    try {
        const stripJsonCommentsModule = await import('strip-json-comments');
        const stripJsonComments = stripJsonCommentsModule.default; // Access the default export
        const cleanedJson = stripJsonComments(jsonString);
        return JSON.parse(cleanedJson);
    } catch (error) {
        console.error('Error processing JSON with comments:', error);
        return null; // Or throw an error if you prefer
    }
}

/**
 * Function that reads and uses all jsonc files asynchronously and independently. It
 * returns an array objects holding groups of snippets from each file
 *
 * @param filePaths
 * @param callback A void function that takes a JSONObject<any> as a parameter
 */
export async function readJsoncFilesAsync(filePaths: string[]): Promise<[string, VSCodeSnippets][]> {
    const snippetMap: [string, VSCodeSnippets][] = [];
    const promises = filePaths.map(filePath => {
        return fs.readFile(filePath, 'utf8')
            .then(fileContent => processJsonWithComments(fileContent))
            .then(jsonObject => {
                if (jsonObject) {
                    snippetMap.push([filePath, jsonObject as VSCodeSnippets]);
                } else {
                    const errorObject = {
                        "file incorrect format": {
                            body: "Need to fix json file!", 
                            prefix: "error"
                        }
                    };
                    snippetMap.push([filePath, errorObject]);
                }
                return null;
            })
            .catch(error => {
                console.error(`Error processing file ${filePath}:`, error);
                return null;
            });
    });

    await Promise.all(promises);
    return snippetMap;
}

export async function readSnippetFile(filepath: string): Promise<VSCodeSnippets | undefined> {
    try {
        const jsonc = await fs.readFile(filepath, 'utf-8');
        const cleanedJson: VSCodeSnippets =  await processJsonWithComments(jsonc);
        return cleanedJson;
    } catch {
        vscode.window.showErrorMessage(`Unable to read file ${path.basename(filepath)}\n\n${filepath}`);
    }
}

export async function writeSnippetFile(filepath: string, jsonObject: VSCodeSnippets) {
    try {
        const jsonString = JSON.stringify(jsonObject, null, 2);
        await fs.writeFile(filepath, jsonString);
        vscode.window.showInformationMessage('Snippet updated successfully!');
    } catch {
        vscode.window.showErrorMessage(`Unable to update file ${path.dirname(filepath)}\n\n${filepath}`);
    }
}