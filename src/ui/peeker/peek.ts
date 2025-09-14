// -------------------------------------------------------------------
// ---------- Lazy Loaded - Only import with await import() ----------
// -------------------------------------------------------------------

import type { ExtensionContext } from 'vscode';
import SnippetPeekProvider from './SnippetPeekProvider';
import vscode from '../../vscode';
import type { VSCodeSnippets } from '../../types';

let snippetPeekProvider: SnippetPeekProvider | undefined;

export async function peekAtSnippet(
	context: ExtensionContext,
	filepath: string,
	preferred: string
) {
	if (!snippetPeekProvider) {
		snippetPeekProvider = new SnippetPeekProvider();
		context.subscriptions.push(
			vscode.workspace.registerTextDocumentContentProvider('snippetviewer', snippetPeekProvider)
		);
	}

	const { readSnippetFile } = await import('../../utils/jsoncFilesIO.js');
	const snippets = (await readSnippetFile(filepath, true)) as VSCodeSnippets;

	await snippetPeekProvider.showPeek(snippets, preferred);
}
