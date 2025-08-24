import { vi, describe, it, expect, type Mock } from 'vitest';
import { promptAddKeybinding } from './keyBindings';
import { openTextDocument, showTextDocument, executeCommand, Selection } from '../vscode';
import { getActiveProfilePath } from '../utils/profile';
import { readJsonC, writeJson } from '../utils/jsoncFilesIO';
import { TreePathItem } from '../ui/templates';
import { readSnippet } from '../snippets/updateSnippets';
import { snippetBodyAsString } from '../utils/string';
import type { Position } from 'vscode';

vi.mock('../utils/profile');
vi.mock('../utils/jsoncFilesIO');
vi.mock('../snippets/updateSnippets.js');
vi.mock('../utils/language');
vi.mock('../utils/string');

describe('keyBindings', () => {
	describe('promptAddKeybinding', () => {
		it('should add a keybinding and select placeholder', async () => {
			const item = new TreePathItem('my-snippet', 0, '/path/to/snippet.json');
			const snippet = { prefix: 'p', body: 'b', scope: 'typescript,javascript' };
			const keybindings: any[] = [];
			const doc = {
				getText: () => `[{"key": "INSERT_KEY_BINDING_HERE"}]`,
				positionAt: vi.fn((index) => ({ line: 0, character: index, translate: vi.fn() })),
			} as any;
			const editor = {
				selection: new Selection(
					{ line: 0, character: 0 } as Position,
					{ line: 0, character: 0 } as Position
				),
				revealRange: vi.fn(),
			} as any;

			(getActiveProfilePath as Mock).mockResolvedValue('/profile');
			(readSnippet as Mock).mockResolvedValue(snippet);
			(readJsonC as Mock).mockResolvedValue(keybindings);
			(snippetBodyAsString as Mock).mockReturnValue('b');
			(openTextDocument as Mock).mockResolvedValue(doc);
			(showTextDocument as Mock).mockResolvedValue(editor);

			await promptAddKeybinding(item);

			expect(writeJson).toHaveBeenCalledWith('/profile/keybindings.json', [
				{
					key: 'INSERT_KEY_BINDING_HERE',
					command: 'editor.action.insertSnippet',
					when: 'editorTextFocus && (editorLangId == typescript || editorLangId == javascript)',
					args: {
						snippet: 'b',
					},
				},
			]);

			expect(executeCommand).toHaveBeenCalledWith('workbench.action.files.revert');
			expect(editor.selection).toBeDefined();
			expect(editor.revealRange).toHaveBeenCalled();
		});
	});
});
