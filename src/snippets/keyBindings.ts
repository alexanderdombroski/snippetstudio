// -------------------------------------------------------------------
// ---------- Lazy Loaded - Only import with await import() ----------
// -------------------------------------------------------------------

import vscode from '../vscode';
import path from 'node:path';
import { getActiveProfilePath } from '../utils/profile';
import { readJsonC, writeJson } from '../utils/jsoncFilesIO';
import type { TreePathItem } from '../ui/templates';
import type { VSCodeSnippet } from '../types';
import { getCurrentLanguage } from '../utils/language';
import { snippetBodyAsString } from '../utils/string';

/**
 * Handler for the add keybindings commmand
 */
async function promptAddKeybinding(item: TreePathItem) {
	const keyBindPath = await getKeybindingsFilePath();

	const snippetTitle = item.description?.toString() ?? '';
	const { readSnippet } = await import('../snippets/updateSnippets.js');
	const [snippet, keybindings] = await Promise.all([
		readSnippet(item.path, snippetTitle) as Promise<VSCodeSnippet>,
		readJsonC(keyBindPath),
	]);

	const langs: string[] = (snippet?.scope ?? getCurrentLanguage() ?? 'plaintext').split(',');
	const placeholder = 'INSERT_KEY_BINDING_HERE';
	(keybindings as Object[]).push({
		key: placeholder,
		command: 'editor.action.insertSnippet',
		when: `editorTextFocus && (${langs.map((lang) => `editorLangId == ${lang}`).join(' || ')})`,
		args: {
			snippet: snippetBodyAsString(snippet.body),
		},
	});

	await writeJson(keyBindPath, keybindings);
	const doc = await vscode.workspace.openTextDocument(keyBindPath);
	const editor = await vscode.window.showTextDocument(doc);
	await vscode.commands.executeCommand('workbench.action.files.revert');

	const text = doc.getText();
	const index = text.indexOf(placeholder);
	if (index === -1) {
		return;
	}
	const position = doc.positionAt(index);
	const range = new vscode.Range(position, position.translate(0, placeholder.length));
	editor.selection = new vscode.Selection(range.start, range.end);
	editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
}

/**
 * Returns the filepath of the user's keybindings.json file, if it exists.
 */
async function getKeybindingsFilePath(): Promise<string> {
	const profilePath = await getActiveProfilePath();
	return path.join(profilePath, 'keybindings.json');
}

export { promptAddKeybinding };
