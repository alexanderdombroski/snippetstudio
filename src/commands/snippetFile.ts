import * as vscode from 'vscode';
import fs from 'fs';
import path from 'path';
import onDoubleClick from './doubleClickHandler';
import { SnippetViewProvider } from '../ui';
import { disableFile, enableAllFiles, enableFile } from '../snippets/fileDisabler';

function initSnippetFileCommands(
	context: vscode.ExtensionContext,
	snippetView: SnippetViewProvider
) {
	// Open Snippets file
	context.subscriptions.push(
		vscode.commands.registerCommand(
			'snippetstudio.file.open',
			async (item: vscode.TreeItem) => {
				await openSnippetFile(item.description);
			}
		),
		vscode.commands.registerCommand(
			'snippetstudio.file.openFromDouble',
			onDoubleClick(async (item: vscode.TreeItem) => {
				await openSnippetFile(item.description);
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
		vscode.commands.registerCommand(
			'snippetstudio.file.delete',
			async (treeItem: vscode.TreeItem) => {
				if (!treeItem || !treeItem.description) {
					vscode.window.showErrorMessage('File path not found.');
					return;
				}
				await deleteFile(treeItem.description.toString());
				vscode.commands.executeCommand('snippetstudio.refreshLocations');
			}
		)
	);

	// Enable & Disable snippet files
	context.subscriptions.push(
		vscode.commands.registerCommand(
			'snippetstudio.file.enable',
			async (treeItem: vscode.TreeItem) => {
				if (!treeItem || !treeItem.description) {
					vscode.window.showErrorMessage('File path not found.');
					return;
				}
				await enableFile(treeItem.description as string);
				refreshAll();
			}
		),
		vscode.commands.registerCommand(
			'snippetstudio.file.disable',
			async (treeItem: vscode.TreeItem) => {
				if (!treeItem || !treeItem.description) {
					vscode.window.showErrorMessage('File path not found.');
					return;
				}
				await disableFile(treeItem.description as string);
				refreshAll();
			}
		),
		vscode.commands.registerCommand(
			'snippetstudio.file.enableGroup',
			async (treeItem: vscode.TreeItem) => {
				const files = await snippetView.getChildren(treeItem);
				await enableAllFiles(
					files?.map((disabledItem) => disabledItem.description as string) ?? []
				);
				refreshAll();
			}
		)
	);

	// Export Snippet Files
	context.subscriptions.push(
		vscode.commands.registerCommand('snippetstudio.snippet.export', async () => {
			const { exportSnippets } = await import('../snippets/newSnippetFile.js');
			exportSnippets();
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
			const document = await vscode.workspace.openTextDocument(
				vscode.Uri.file(`${filename}`)
			);
			await vscode.window.showTextDocument(document);
		} else {
			vscode.window.showErrorMessage('Could not find file path.');
		}
	} catch (error: any) {
		vscode.window.showErrorMessage(`Failed to open snippet file: ${error.message}`);
	}
}

export default initSnippetFileCommands;
