import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import type { TextEditor, TextDocument } from 'vscode';
import { addGutterIcons } from './load';
import { readSnippetFile } from '../../utils/jsoncFilesIO';
import { Position } from '../../vscode';
import path from 'node:path';

vi.mock('../../utils/jsoncFilesIO');

describe('addGutterIcons', () => {
	let editor: TextEditor;
	let document: TextDocument;

	beforeEach(() => {
		document = {
			uri: { scheme: 'file', path: path.join('/snippets', 'test.code-snippets') },
			isUntitled: false,
			getText: vi.fn(() => '{"snippet1": {}} some text "snippet2": {}'),
			positionAt: vi.fn((offset: number) => new Position(0, offset)),
			lineAt: vi.fn((pos: any) => ({ lineNumber: pos.line, range: { end: { character: 50 } } })),
			fileName: '/mock/path/snippets.code-snippets',
		} as unknown as TextDocument;

		editor = {
			document,
			setDecorations: vi.fn(),
		} as unknown as TextEditor;
	});

	it('should do nothing if the document is untitled', async () => {
		Object.defineProperty(document, 'isUntitled', { value: true });
		await addGutterIcons(editor);
		expect(editor.setDecorations).not.toHaveBeenCalled();
	});

	it('should do nothing to buffers and other non-file schemes', async () => {
		Object.defineProperty(document.uri, 'scheme', { value: 'snippetstudio' });
		await addGutterIcons(editor);
		expect(editor.setDecorations).not.toHaveBeenCalled();
	});

	it('should add decorations for each snippet', async () => {
		const mockSnippets = { snippet1: {}, snippet2: {} };
		(readSnippetFile as Mock).mockResolvedValue(mockSnippets);

		await addGutterIcons(editor);

		expect(editor.setDecorations).toHaveBeenCalled();
		const [[, options]] = (editor.setDecorations as any).mock.calls;
		expect(Array.isArray(options)).toBe(true);
		expect(options.length).toBe(2);
	});

	it('should skip snippet not found in text', async () => {
		const mockSnippets = { missingSnippet: {} };
		(readSnippetFile as Mock).mockResolvedValue(mockSnippets);

		await addGutterIcons(editor);

		const [[, options]] = (editor.setDecorations as Mock).mock.calls;
		expect(options.length).toBe(0);
	});
});
