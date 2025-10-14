import { vi, describe, it, expect, type Mock } from 'vitest';
import { promptAddKeybinding } from './keyBindings';
import { openTextDocument, showTextDocument, executeCommand, Selection } from '../vscode';
import { getActiveProfilePath } from '../utils/profile';
import { readJsonC, writeJson } from '../utils/jsoncFilesIO';
import { TreePathItem } from '../ui/templates';
import { readSnippet } from '../snippets/updateSnippets';
import { snippetBodyAsString } from '../utils/string';
import type { Position } from 'vscode';
import path from 'node:path';

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
			const item = new TreePathItem('my-snippet', 0, '/path/to/snippet.code-snippets');
			const snippet = { prefix: 'p', body: 'b' };
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
	});
			it('should create keybindings.json if it does not exist', async () => {
			const item = new TreePathItem('my-snippet', 0, '/path/to/snippet.json');
			const snippet = { prefix: 'p', body: 'b', scope: 'javascript' };
			const keybindings: any[] = [];

			// Mock fs helpers before calling the function
			vi.mock('../utils/fsInfo', () => ({
				exists: vi.fn().mockResolvedValue(false), 
			}));
			vi.mock('node:fs/promises', () => ({
				writeFile: vi.fn().mockResolvedValue(undefined), 
			}));

			const { writeFile } = await import('node:fs/promises');
			const { exists } = await import('../utils/fsInfo');

			(getActiveProfilePath as Mock).mockResolvedValue('/profile');
			(readSnippet as Mock).mockResolvedValue(snippet);
			(readJsonC as Mock).mockResolvedValue(keybindings);

			await promptAddKeybinding(item);

			expect(writeFile).toHaveBeenCalledWith(
				path.join('/profile/keybindings.json'),
				'[]',
				'utf-8'
			);
		});

});
