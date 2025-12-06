// -------------------------------------------------------------------
// ---------- Lazy Loaded - Only import with await import() ----------
// -------------------------------------------------------------------

import SnippetPeekProvider from './SnippetPeekProvider';
import vscode from '../../vscode';
import type { VSCodeSnippets } from '../../types';
import { readSnippetFile } from '../../utils/jsoncFilesIO';
import { getExtensionContext } from '../../utils/context';

let snippetPeekProvider: SnippetPeekProvider | undefined;

/** creates a peek and text document to store the snippets in */
export async function peekAtSnippet(filepath: string, preferred: string) {
	if (!snippetPeekProvider) {
		const context = await getExtensionContext();
		snippetPeekProvider = new SnippetPeekProvider();
		context.subscriptions.push(
			vscode.workspace.registerTextDocumentContentProvider('snippetviewer', snippetPeekProvider)
		);
	}

	const snippets = (await readSnippetFile(filepath, true)) as VSCodeSnippets;

	await snippetPeekProvider.showPeek(snippets, preferred);
}
