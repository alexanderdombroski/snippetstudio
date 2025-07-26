import * as vscode from 'vscode';
import fs from 'fs';
import path from 'path';
import onDoubleClick from './doubleClickHandler';
import type { TreePathItem } from '../ui/templates';
import { getExtensionSnippetLangs } from '../snippets/extension';
import { chooseLocalGlobal } from '../utils/user';
import { readSnippetFile, writeSnippetFile } from '../utils/jsoncFilesIO';

function initSnippetFileCommands(context: vscode.ExtensionContext) {
	// Open Snippets file
	context.subscriptions.push(
		vscode.commands.registerCommand('snippetstudio.file.open', async (item: TreePathItem) => {
			await openSnippetFile(item.path);
		}),
		vscode.commands.registerCommand(
			'snippetstudio.file.openFromDouble',
			onDoubleClick(async (item: TreePathItem) => {
				await openSnippetFile(item.path);
			})
		)
	);

	// Create Global Snippet File
	context.subscriptions.push(
		vscode.commands.registerCommand('snippetstudio.file.createGlobalLang', async () => {
			const { createGlobalLangFile } = await import('../snippets/newSnippetFile.js');
			createGlobalLangFile();
			refreshAll();
		})
	);
	// Create Local Mixed Snippet File
	context.subscriptions.push(
		vscode.commands.registerCommand('snippetstudio.file.createProjectSnippets', async () => {
			const { createLocalSnippetsFile } = await import('../snippets/newSnippetFile.js');
			await createLocalSnippetsFile();
			refreshAll();
		})
	);
	// Create Global Mixed Snippet File
	context.subscriptions.push(
		vscode.commands.registerCommand('snippetstudio.file.createGlobalSnippets', async () => {
			const { createGlobalSnippetsFile } = await import('../snippets/newSnippetFile.js');
			await createGlobalSnippetsFile();
			refreshAll();
		})
	);

	// Delete Snippet File
	context.subscriptions.push(
		vscode.commands.registerCommand('snippetstudio.file.delete', async (treeItem: TreePathItem) => {
			await deleteFile(treeItem.path);
			vscode.commands.executeCommand('snippetstudio.refreshLocations');
		})
	);

	// Export Snippet Files
	context.subscriptions.push(
		vscode.commands.registerCommand('snippetstudio.snippet.export', async () => {
			const { exportSnippets } = await import('../snippets/newSnippetFile.js');
			exportSnippets();
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand(
			'snippetstudio.extension.extract',
			async (item: TreePathItem) => {
				const { getFileName } = await import('../snippets/newSnippetFile.js');
				const basename = (await getFileName()) + '.code-snippets';
				if (basename === 'undefined.code-snippets') {
					return;
				}
				const dirname = await chooseLocalGlobal();
				if (dirname === undefined) {
					return;
				}

				const fp = path.join(dirname, basename);

				const langs = await getExtensionSnippetLangs(item.path);
				const scope = langs.join(',');

				const snippets = await readSnippetFile(item.path, true);
				if (snippets === undefined) {
					return;
				}
				Object.values(snippets).forEach((obj) => (obj.scope = scope));
				await writeSnippetFile(fp, snippets, 'Copied extension snippets for safe editing.');

				refreshAll();
			}
		),
		vscode.commands.registerCommand('snippetstudio.extension.fetch', async () => {
			const { importBuiltinExtension } = await import('../git/extensionsGithub.js');
			await importBuiltinExtension(context);
			refreshAll();
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('snippetstudio.profile.import', async () => {
			const { importCodeProfileSnippets } = await import('../snippets/codeProfile.js');
			await importCodeProfileSnippets(context);
			refreshAll();
		})
	);
}

export function refreshAll() {
	vscode.commands.executeCommand('snippetstudio.refresh');
	vscode.commands.executeCommand('snippetstudio.refreshLocations');
}

async function deleteFile(filepath: string) {
	const filename = path.basename(filepath);

	if (!fs.existsSync(filepath)) {
		vscode.window.showErrorMessage(`${filename} File doesn't exits: ${filepath}`);
		return;
	}

	// Confirmation message
	const confirmation = await vscode.window.showInformationMessage(
		`Are you sure you want to delete "${filename}"?`,
		{ modal: true },
		'Yes',
		'No'
	);
	if (confirmation !== 'Yes') {
		return;
	}

	try {
		await fs.promises.unlink(filepath); // Use fs.promises.unlink
		vscode.window.showInformationMessage(`Snippet file deleted: ${filename}\n${filepath}`);
		refreshAll();
	} catch (error) {
		if (error instanceof Error) {
			vscode.window.showErrorMessage(`Error deleting file: ${error.message}`);
		} else {
			vscode.window.showErrorMessage(`An unknown error occurred: ${error}`);
		}
	}
}

async function openSnippetFile(filename: string | boolean | undefined) {
	try {
		if (filename) {
			const document = await vscode.workspace.openTextDocument(vscode.Uri.file(`${filename}`));
			await vscode.window.showTextDocument(document);
		} else {
			vscode.window.showErrorMessage('Could not find file path.');
		}
	} catch (error: any) {
		vscode.window.showErrorMessage(`Failed to open snippet file: ${error.message}`);
	}
}

export default initSnippetFileCommands;
