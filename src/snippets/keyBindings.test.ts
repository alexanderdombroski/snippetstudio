import { vi, describe, it, expect, type Mock } from 'vitest';
import { promptAddKeybinding } from './keyBindings';
import { openTextDocument, showTextDocument, executeCommand, Selection } from '../vscode';
import { getActiveProfilePath } from '../utils/profile';
import { readJsonC, writeJson } from '../utils/jsoncFilesIO';
import { SnippetTreeItem } from '../ui/templates';
import { readSnippet } from '../snippets/updateSnippets';
import { snippetBodyAsString } from '../utils/string';
import type { Position } from 'vscode';
import path from 'node:path';
import { exists } from '../utils/fsInfo';
import { writeFile } from 'node:fs/promises';

vi.mock('../utils/profile');
vi.mock('../utils/jsoncFilesIO');
vi.mock('../snippets/updateSnippets.js');
vi.mock('../utils/language');
vi.mock('../utils/string');
vi.mock('../utils/fsInfo');

describe('keyBindings', () => {
	describe('promptAddKeybinding', () => {
		it('should add a keybinding and select placeholder', async () => {
			const snippet = { prefix: 'p', body: 'b', scope: 'typescript,javascript' };
			const item = new SnippetTreeItem('my-snippet', snippet, '/path/to/snippet.json');
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

			expect(writeJson).toHaveBeenCalledWith(path.join('/profile/keybindings.json'), [
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

		it('should not have editorLangId when snippet is global', async () => {
			const snippet = { prefix: 'p', body: 'b' };
			const item = new SnippetTreeItem('my-snippet', snippet, '/path/to/snippet.code-snippets');
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

			expect(writeJson).toHaveBeenCalledWith(path.join('/profile/keybindings.json'), [
				{
					key: 'INSERT_KEY_BINDING_HERE',
					command: 'editor.action.insertSnippet',
					when: 'editorTextFocus',
					args: {
						snippet: 'b',
					},
				},
			]);
		});
		it('should create keybindings.json if it does not exist', async () => {
			const snippet = { prefix: 'p', body: 'b', scope: 'javascript' };
			const item = new SnippetTreeItem('my-snippet', snippet, '/path/to/snippet.json');
			const keybindings: any[] = [];

			(exists as Mock).mockResolvedValue(false);
			(getActiveProfilePath as Mock).mockResolvedValue('/profile');
			(readSnippet as Mock).mockResolvedValue(snippet);
			(readJsonC as Mock).mockResolvedValue(keybindings);

			await promptAddKeybinding(item);

			expect(writeFile).toHaveBeenCalledWith(path.join('/profile/keybindings.json'), '[]', 'utf-8');
		});
	});
});
