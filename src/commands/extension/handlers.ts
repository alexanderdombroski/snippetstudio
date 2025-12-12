import type { ExtSnippetFileTreeItem, SnippetTreeItem } from '../../ui/templates';
import { executeCommand } from '../../vscode';
import { refreshAll } from '../utils';

/** snippetstudio.extension.extract command handler */
export async function extractHandler(item: ExtSnippetFileTreeItem) {
	const { extractAllSnippets } = await import('../../snippets/extension/transfer.js');
	await extractAllSnippets(item);
	refreshAll();
}

/** snippetstudio.extension.fetch command handler */
export async function fetchHandler() {
	const { importBuiltinExtension } = await import('../../git/extensionsGithub.js');
	await importBuiltinExtension();
	refreshAll();
}

/** 'snippetstudio.extension.modify' command handler */
export async function modifyHandler(item: SnippetTreeItem) {
	const { extractAndModify } = await import('../../snippets/extension/transfer.js');
	await extractAndModify(item);
	executeCommand('snippetstudio.refresh');
}
