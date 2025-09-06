import vscode, {
	registerCommand,
	executeCommand,
	getConfiguration,
	showErrorMessage,
	onDidChangeActiveTextEditor,
} from '../../vscode';
import type SnippetEditorProvider from './SnippetEditorProvider';
import { getCurrentUri } from '../../utils/fsInfo';
import type { VSCodeSnippet } from '../../types';
import { titleCase } from '../../utils/string';

function initSnippetEditorCommands(
	context: vscode.ExtensionContext,
	provider: SnippetEditorProvider
) {
	context.subscriptions.push(
		registerCommand('snippetstudio.editor.save', async () => {
			await __saveSnippet(provider);
		}),
		registerCommand('snippetstudio.editor.cancel', () => {
			const uri = getCurrentUri();

			if (uri) {
				provider.delete(uri);
				executeCommand('workbench.action.closeActiveEditor');
			}
		})
	);

	onDidChangeActiveTextEditor(() => {
		executeCommand(
			'setContext',
			'snippetstudio.editorVisible',
			vscode.window.visibleTextEditors.some(
				(editor) => editor?.document.uri.scheme === 'snippetstudio'
			)
		);
	});
}

export async function __saveSnippet(provider: SnippetEditorProvider) {
	const editor = vscode.window.activeTextEditor;
	if (editor?.document.uri.scheme !== 'snippetstudio') {
		return;
	}

	const body = editor.document.getText().split(/\r\n|\r|\n/);
	const data = provider.getSnippetData();
	if (data === undefined) {
		showErrorMessage('Cannot save snippet without snippet data');
		return;
	}
	const prefix =
		!Array.isArray(data.prefix) && data.prefix.includes(',')
			? data.prefix.trim().split(',')
			: data.prefix;
	const snippet: VSCodeSnippet = { prefix, body };
	if (data.description) {
		snippet.description = data.description.trim();
	}
	if (data.scope) {
		snippet.scope = data.scope.trim();
	}
	const capitalize = getConfiguration('snippetstudio').get<boolean>('autoCapitalizeSnippetName');
	const { writeSnippet } = await import('../../snippets/updateSnippets.js');
	writeSnippet(
		data.filename,
		capitalize ? titleCase(data.snippetTitle.trim()) : data.snippetTitle.trim(),
		snippet
	);
	executeCommand('snippetstudio.refresh');
	await executeCommand('workbench.action.closeActiveEditor');
	await executeCommand('setContext', 'snippetstudio.editorVisible', false);
}

export default initSnippetEditorCommands;
