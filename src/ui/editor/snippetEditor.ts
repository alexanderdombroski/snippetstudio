import type { ExtensionContext } from 'vscode';
import vscode, {
	registerCommand,
	executeCommand,
	getConfiguration,
	showErrorMessage,
	onDidChangeActiveTextEditor,
} from '../../vscode';
import type SnippetEditorProvider from './SnippetEditorProvider';
import { getCurrentUri } from '../../utils/fsInfo';
import type { DiagnosticsLevel, VSCodeSnippet } from '../../types';
import { titleCase } from '../../utils/string';

/** registers all snippet editor ui commands */
function initSnippetEditorCommands(context: ExtensionContext, provider: SnippetEditorProvider) {
	context.subscriptions.push(
		registerCommand('snippetstudio.editor.save', async () => {
			await _saveSnippet(provider);
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
		const active = vscode.window.visibleTextEditors.some(
			(editor) => editor?.document.uri.scheme === 'snippetstudio'
		);

		executeCommand('setContext', 'snippetstudio.editorVisible', active);
		const hidden =
			active &&
			getConfiguration('snippetstudio').get<DiagnosticsLevel>('editor.diagnosticsLevel') === 'none';
		getConfiguration('problems').update(
			'visibility',
			hidden ? false : undefined,
			vscode.ConfigurationTarget.Global
		);
	});
}

/** saves a snippet and closes the editor */
export async function _saveSnippet(provider: SnippetEditorProvider) {
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
	const { snippetTitle, prefix, scope, description, filepath, isFileTemplate, include, exclude } =
		data;
	const snippet: VSCodeSnippet = { body };
	if (isFileTemplate) {
		snippet.isFileTemplate = true;
	}
	if (prefix) {
		snippet.prefix =
			!Array.isArray(prefix) && prefix?.includes(',')
				? (prefix as string).split(',').map((p) => p.trim())
				: prefix;
	}
	if (description) {
		snippet.description = description.trim();
	}
	if (scope) {
		snippet.scope = scope.trim();
	}
	if (include) {
		snippet.include = _normalizeGlobValue(include);
	}
	if (exclude) {
		snippet.exclude = _normalizeGlobValue(exclude);
	}
	const capitalize = getConfiguration('snippetstudio').get<boolean>('autoCapitalizeSnippetName');
	const { writeSnippet } = await import('../../snippets/updateSnippets.js');
	await writeSnippet(
		filepath,
		capitalize ? titleCase(snippetTitle.trim()) : snippetTitle.trim(),
		snippet
	);
	await executeCommand('snippetstudio.refresh', true);
	await executeCommand('workbench.action.closeActiveEditor');
	await executeCommand('setContext', 'snippetstudio.editorVisible', false);
}

/** Converts singlular globs to a string, and multiple to an array */
export function _normalizeGlobValue(globs: string | string[]): string | string[] {
	if (Array.isArray(globs)) return globs;
	const globsArr = globs.split(',').map((glob) => glob.trim());
	if (globsArr.length === 1) return globs;
	return globsArr;
}

export default initSnippetEditorCommands;
