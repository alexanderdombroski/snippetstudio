import type { TextEditor } from 'vscode';
import vscode from '../../vscode';

/** Add listener to add gutter icon loading as user opens files */
export function initGutterLoading() {
	vscode.window.onDidChangeVisibleTextEditors((editors) => {
		editors.forEach(loadGuttersForEditor);
	});

	const editor = vscode.window.activeTextEditor;
	if (editor) {
		loadGuttersForEditor(editor);
	}
}

/** Loads the gutters if the language is correct */
async function loadGuttersForEditor(editor: TextEditor) {
	if (editor.document.languageId === 'snippets') {
		const { addGutterIcons } = await import('./load.js');
		addGutterIcons(editor);
	}
}
