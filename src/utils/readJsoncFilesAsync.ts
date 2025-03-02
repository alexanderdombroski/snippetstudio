import * as fs from 'fs/promises'; // Import fs/promises for async file operations
import { VSCodeSnippets } from '../types/snippetTypes.js';

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
export default async function readJsoncFilesAsync(filePaths: string[]): Promise<VSCodeSnippets[]> {
    const promises = filePaths.map(filePath => {
        return fs.readFile(filePath, 'utf8')
            .then(fileContent => processJsonWithComments(fileContent))
            .then(cleanedJsonString => JSON.parse(cleanedJsonString))
            .catch(error => {
                console.error(`Error processing file ${filePath}:`, error);
                return null;
            });
    });

    return Promise.all(promises).then(results => results.filter(result => result !== null));
}