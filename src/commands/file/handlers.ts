import { showTextDocument, openTextDocument, Uri } from '../../vscode';
import { refreshAll } from '../utils';
import type { SnippetFileTreeItem } from '../../ui/templates';

/** snippetstudio.file.open command handler */
export async function openHandler(item: SnippetFileTreeItem) {
	const document = await openTextDocument(Uri.file(item.filepath));
	await showTextDocument(document);
}

/** snippetstudio.file.createGlobalLang command handler */
export async function createGlobalLangHandler() {
	const { createGlobalLangFile } = await import('../../snippets/newSnippetFile.js');
	await createGlobalLangFile();
	refreshAll();
}

/** snippetstudio.file.createProjectSnippets command handler */
export async function createProjectSnippetsHandler() {
	const { createLocalSnippetsFile } = await import('../../snippets/newSnippetFile.js');
	await createLocalSnippetsFile();
	refreshAll();
}

/** snippetstudio.file.createGlobalSnippets command handler */
export async function createGlobalSnippetsHandler() {
	const { createGlobalSnippetsFile } = await import('../../snippets/newSnippetFile.js');
	await createGlobalSnippetsFile();
	refreshAll();
}

/** snippetstudio.file.delete command handler */
export async function deleteHandler(treeItem: SnippetFileTreeItem) {
	const { deleteSnippetFile } = await import('../../snippets/updateSnippets.js');
	await deleteSnippetFile(treeItem.filepath);
	refreshAll(true);
}

/** snippetstudio.file.export command handler */
export async function exportHandler() {
	const { exportSnippets } = await import('../../snippets/newSnippetFile.js');
	await exportSnippets();
	refreshAll();
}
