import type { ExtensionContext } from 'vscode';
import {
	registerCommand,
	executeCommand,
	showTextDocument,
	openTextDocument,
	Uri,
} from '../vscode';
import onDoubleClick from './doubleClickHandler';
import type { TreePathItem } from '../ui/templates';

function initSnippetFileCommands(context: ExtensionContext) {
	// Open Snippets file
	context.subscriptions.push(
		registerCommand('snippetstudio.file.open', async (item: TreePathItem) => {
			await openSnippetFile(item.path);
		}),
		registerCommand(
			'snippetstudio.file.openFromDouble',
			onDoubleClick(async (item: TreePathItem) => {
				await openSnippetFile(item.path);
			})
		)
	);

	// Create Global Snippet File
	context.subscriptions.push(
		registerCommand('snippetstudio.file.createGlobalLang', async () => {
			const { createGlobalLangFile } = await import('../snippets/newSnippetFile.js');
			createGlobalLangFile();
			refreshAll();
		})
	);
	// Create Local Mixed Snippet File
	context.subscriptions.push(
		registerCommand('snippetstudio.file.createProjectSnippets', async () => {
			const { createLocalSnippetsFile } = await import('../snippets/newSnippetFile.js');
			await createLocalSnippetsFile();
			refreshAll();
		})
	);
	// Create Global Mixed Snippet File
	context.subscriptions.push(
		registerCommand('snippetstudio.file.createGlobalSnippets', async () => {
			const { createGlobalSnippetsFile } = await import('../snippets/newSnippetFile.js');
			await createGlobalSnippetsFile();
			refreshAll();
		})
	);

	// Delete Snippet File
	context.subscriptions.push(
		registerCommand('snippetstudio.file.delete', async (treeItem: TreePathItem) => {
			const { deleteSnippetFile } = await import('../snippets/updateSnippets.js');
			await deleteSnippetFile(treeItem.path);
			refreshAll();
		})
	);

	// Export Snippet Files
	context.subscriptions.push(
		registerCommand('snippetstudio.snippet.export', async () => {
			const { exportSnippets } = await import('../snippets/newSnippetFile.js');
			exportSnippets();
		})
	);

	context.subscriptions.push(
		registerCommand('snippetstudio.extension.extract', async (item: TreePathItem) => {
			const { extractAllSnippets } = await import('../snippets/extension/transfer.js');
			await extractAllSnippets(item);
			refreshAll();
		}),
		registerCommand('snippetstudio.extension.fetch', async () => {
			const { importBuiltinExtension } = await import('../git/extensionsGithub.js');
			await importBuiltinExtension(context);
			refreshAll();
		})
	);

	context.subscriptions.push(
		registerCommand('snippetstudio.profile.import', async () => {
			const { importCodeProfileSnippets } = await import('../snippets/codeProfile.js');
			await importCodeProfileSnippets(context);
			refreshAll();
		})
	);
}

export function refreshAll() {
	executeCommand('snippetstudio.refresh');
	executeCommand('snippetstudio.refreshLocations');
}

async function openSnippetFile(filepath: string) {
	const document = await openTextDocument(Uri.file(filepath));
	await showTextDocument(document);
}

export default initSnippetFileCommands;
