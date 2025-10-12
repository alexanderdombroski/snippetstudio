// -------------------------------------------------------------------
// ---------- Lazy Loaded - Only import with await import() ----------
// -------------------------------------------------------------------

import vscode, {
	openTextDocument,
	showTextDocument,
	executeCommand,
	Range,
	Selection,
} from '../vscode';
import path from 'node:path';
import { getActiveProfilePath } from '../utils/profile';
import { readJsonC, writeJson } from '../utils/jsoncFilesIO';
import type { TreePathItem } from '../ui/templates';
import type { VSCodeSnippet } from '../types';
import { getCurrentLanguage } from '../utils/language';
import { snippetBodyAsString } from '../utils/string';

/** Handler for the add keybindings commmand */
async function promptAddKeybinding(item: TreePathItem) {
	const keyBindPath = await getKeybindingsFilePath();

	const snippetTitle = item.description?.toString() ?? '';
	const { readSnippet } = await import('../snippets/updateSnippets.js');
	
	// Read snippet and keybindings, handling case where keybindings file doesn't exist
	const [snippet, keybindings] = await Promise.all([
		readSnippet(item.path, snippetTitle) as Promise<VSCodeSnippet>,
		readJsonC(keyBindPath).catch(() => []), // Return empty array if file doesn't exist
	]);

	const placeholder = 'INSERT_KEY_BINDING_HERE';
	const isGlobalSnippet = item.path.endsWith('.code-snippets') && !snippet?.scope;
	const langs: string[] = (snippet?.scope ?? getCurrentLanguage() ?? 'plaintext').split(',');
	(keybindings as Object[]).push({
		key: placeholder,
		command: 'editor.action.insertSnippet',
		when: isGlobalSnippet
			? 'editorTextFocus'
			: `editorTextFocus && (${langs.map((lang) => `editorLangId == ${lang}`).join(' || ')})`,
		args: {
			snippet: snippetBodyAsString(snippet.body),
		},
	});

	await writeJson(keyBindPath, keybindings);
	const doc = await openTextDocument(keyBindPath);
	const editor = await showTextDocument(doc);
	await executeCommand('workbench.action.files.revert');

	const text = doc.getText();
	const index = text.indexOf(placeholder);
	if (index === -1) {
		return;
	}
	const position = doc.positionAt(index);
	const range = new Range(position, position.translate(0, placeholder.length));
	editor.selection = new Selection(range.start, range.end);
	editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
}

/** Returns the filepath of the user's keybindings.json file, if it exists. */
async function getKeybindingsFilePath(): Promise<string> {
	const profilePath = await getActiveProfilePath();
	return path.join(profilePath, 'keybindings.json');
}

export { promptAddKeybinding };
