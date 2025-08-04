import * as fs from 'node:fs/promises';
import vscode, { showErrorMessage, showInformationMessage, Uri } from '../vscode';
import path from 'node:path';
import type { GenericJson, VSCodeSnippets } from '../types';
import { flattenScopedExtensionSnippets } from '../snippets/extension/locate';
import { getLinkLocations } from '../snippets/links/config';

export async function processJsonWithComments(jsonString: string): Promise<any> {
	try {
		const stripJsonCommentsModule = await import('strip-json-comments');
		const stripJsonComments = stripJsonCommentsModule.default; // Access the default export
		const cleanedJson = stripJsonComments(jsonString);
		return JSON.parse(cleanedJson);
	} catch (error) {
		console.error('Error processing JSON with comments:', error);
		return null;
	}
}

/**
 * Function that reads and uses all jsonc files asynchronously and independently. It
 * returns an array objects holding groups of snippets from each file
 *
 * @param filePaths
 * @param callback A void function that takes a JSONObject<any> as a parameter
 */
export async function readJsoncFilesAsync(
	filePaths: string[]
): Promise<[string, VSCodeSnippets][]> {
	const snippetMap: [string, VSCodeSnippets][] = [];
	const promises = filePaths.map((filePath) => {
		return fs
			.readFile(filePath, 'utf8')
			.then((fileContent) => processJsonWithComments(fileContent))
			.then((jsonObject) => {
				if (jsonObject) {
					snippetMap.push([filePath, jsonObject as VSCodeSnippets]);
				} else {
					const errorObject = {
						'file incorrect format': {
							body: 'Need to fix json file!',
							prefix: 'error',
						},
					};
					snippetMap.push([filePath, errorObject]);
				}
				return null;
			})
			.catch((error) => {
				console.error(`Error processing file ${filePath}:`, error);
				return null;
			});
	});

	await Promise.all(promises);
	return snippetMap;
}

export async function readSnippetFile(
	filepath: string,
	tryFlatten?: boolean
): Promise<VSCodeSnippets | undefined> {
	try {
		const jsonc = await fs.readFile(filepath, 'utf-8');
		const cleanedJson: VSCodeSnippets = await processJsonWithComments(jsonc);
		return tryFlatten ? flattenScopedExtensionSnippets(cleanedJson) : cleanedJson;
	} catch {
		showErrorMessage(`Unable to read file ${path.basename(filepath)}\n\n${filepath}`);
	}
}

export async function writeSnippetFile(
	filepath: string,
	jsonObject: VSCodeSnippets,
	successMessage: string = 'Snippet updated successfully!',
	silent: boolean = false
) {
	try {
		const jsonString = JSON.stringify(jsonObject, null, 2);
		const links = await getLinkLocations(filepath);
		if (links.length) {
			const basename = path.basename(filepath);
			await Promise.all(
				links.map(async (dir) => {
					const fp = path.join(dir, basename);
					await fs.mkdir(path.dirname(fp), { recursive: true });
					await fs.writeFile(fp, jsonString);
				})
			);
		} else {
			await fs.writeFile(filepath, jsonString);
		}
		if (!silent) {
			showInformationMessage(successMessage);
		}
	} catch {
		showErrorMessage(`Unable to update file ${path.dirname(filepath)}\n\n${filepath}`);
	}
}

export async function readJsonC(filepath: string): Promise<GenericJson> {
	const jsonc = await fs.readFile(filepath, 'utf-8');
	return await processJsonWithComments(jsonc);
}

export async function readJson(filepath: string): Promise<GenericJson> {
	const jsonc = await fs.readFile(filepath, 'utf-8');
	return JSON.parse(jsonc);
}

export async function writeJson(filepath: string, jsonObj: GenericJson) {
	const content = Buffer.from(JSON.stringify(jsonObj, null, 4), 'utf-8');
	await vscode.workspace.fs.writeFile(Uri.file(filepath), content);
}
