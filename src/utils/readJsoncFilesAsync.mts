import * as fs from 'fs/promises'; // Import fs/promises for async file operations
import stripJsonComments from 'strip-json-comments';
import { VSCodeSnippets } from '../types/snippetTypes.js';

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
            .then(fileContent => stripJsonComments(fileContent))
            .then(cleanedJsonString => JSON.parse(cleanedJsonString))
            .catch(error => {
                console.error(`Error processing file ${filePath}:`, error);
                return null;
            });
    });

    return Promise.all(promises).then(results => results.filter(result => result !== null));
}