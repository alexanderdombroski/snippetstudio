// -------------------------------------------------------------------
// ---------- Lazy Loaded - Only import with await import() ----------
// -------------------------------------------------------------------

import type { StatusBarItem, ExtensionContext } from 'vscode';
import vscode, { getConfiguration, onDidChangeActiveTextEditor } from '../vscode';
import { getCurrentLanguage } from '../utils/language';
import { getCurrentUri } from '../utils/fsInfo';
import { capitalize } from '../utils/string';

let snippetIndicator: StatusBarItem;

export function createStatusBar(context: ExtensionContext) {
	createSnippetIndicator();

	vscode.workspace.onDidChangeConfiguration((event) => {
		if (event.affectsConfiguration('snippetstudio.statusBarPriority')) {
			snippetIndicator.dispose();
			snippetIndicator = createSnippetIndicator();
		}
	});

	onDidChangeActiveTextEditor(() => {
		updateSnippetIndicatorText();
	});

	context.subscriptions.push(snippetIndicator);
}

function createSnippetIndicator() {
	const priority = getConfiguration('snippetstudio').get<number>('statusBar.priority', 30);
	snippetIndicator = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, priority);

	updateSnippetIndicatorText();
	snippetIndicator.command = 'snippetstudio.snippet.addGlobal';
	snippetIndicator.tooltip = 'Press to create new Snippet';
	snippetIndicator.show();

	return snippetIndicator;
}

function updateSnippetIndicatorText() {
	const langId = getCurrentLanguage();
	let icon: string =
		langId === 'snippets'
			? '$(database)'
			: getCurrentUri()?.scheme === 'snippetstudio'
				? '$(book)'
				: '$(repo)';
	if (
		getConfiguration('snippetstudio').get<boolean>('statusBar.showLanguage') &&
		langId !== undefined
	) {
		icon += '  ' + capitalize(langId);
	}
	snippetIndicator.text = icon;
}
