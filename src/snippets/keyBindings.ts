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
import type { SnippetTreeItem } from '../ui/templates';
import type { VSCodeSnippetV2 } from '../types';
import { getCurrentLanguage } from '../utils/language';
import { snippetBodyAsString } from '../utils/string';
import { exists } from '../utils/fsInfo';
import fs from 'node:fs/promises';

/** Handler for the add keybindings commmand */
async function promptAddKeybinding(item: SnippetTreeItem) {
	const keyBindPath = await getKeybindingsFilePath();
	if (!(await exists(keyBindPath))) {
		await fs.writeFile(keyBindPath, '[]', 'utf-8');
	}

	const snippetTitle = item.description?.toString() ?? '';
	const { readSnippet } = await import('../snippets/updateSnippets.js');
	const [snippet, keybindings] = await Promise.all([
		readSnippet(item.path, snippetTitle) as Promise<VSCodeSnippetV2>,
		readJsonC(keyBindPath),
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
