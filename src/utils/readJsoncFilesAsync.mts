import * as fs from 'fs/promises'; // Import fs/promises for async file operations
import stripJsonComments from 'strip-json-comments';

/**
 * Function that reads and uses all jsonc files asynchronously and independently. It
 * doesn't allow you to perform an operation when all have been read and passed 
 * into the callback.
 *
 * @param filePaths
 * @param callback A void function that takes a JSONObject<any> as a parameter
 */
export default function readJsoncFilesAsync(filePaths: string[], callback: Function) {
    filePaths.forEach(filePath => {
        fs.readFile(filePath, 'utf8')
            .then(fileContent => stripJsonComments(fileContent))
            .then(cleanedJsonString => JSON.parse(cleanedJsonString))
            .then(jsonObject => callback(jsonObject))
            .catch(error => console.error(`Error processing file ${filePath}:`, error));
    });
}
