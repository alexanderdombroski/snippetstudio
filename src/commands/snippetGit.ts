import * as vscode from 'vscode';
import { temporarilyEnableAll } from '../snippets/fileDisabler.js';
import { findAllGlobalSnippetFiles } from '../snippets/locateSnippets.js';
import { getGlobalSnippetFilesDir } from '../utils/fsInfo.js';
import { refreshAll } from './snippetFile.js';

async function initSnippetGitCommands(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('snippetstudio.github.sync', async () => {
			const { snippetSync } = await import('../git/snippetSync.js');
			const globals = await findAllGlobalSnippetFiles(getGlobalSnippetFilesDir());
			await temporarilyEnableAll(globals, () => snippetSync(context));
			refreshAll();
		}),
		vscode.commands.registerCommand('snippetstudio.github.merge', async () => {
			const { snippetMerge } = await import('../git/snippetMerge.js');
			const globals = await findAllGlobalSnippetFiles(getGlobalSnippetFilesDir());
			await temporarilyEnableAll(globals, () => snippetMerge(context));
			refreshAll();
		})
	);
}

export default initSnippetGitCommands;
