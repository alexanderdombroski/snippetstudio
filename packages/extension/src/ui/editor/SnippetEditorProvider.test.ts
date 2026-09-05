import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import SnippetEditorProvider, { _escapeDollarSignIfNeeded } from './SnippetEditorProvider';
import SnippetDataManager from './SnippetDataManager';
import type { Position as PositionType, TextEditor } from 'vscode';
import vscode, { Position, getConfiguration, onDidChangeActiveTextEditor } from '../../vscode';
import { getCurrentUri } from '../../utils/fsInfo';
import type { Uri } from 'vscode';
import type { SnippetData } from '../../types';

vi.mock('../../utils/fsInfo');

const scheme = 'snippetstudio';
const testUri = { scheme, path: '/snippets/test.code-snippet' } as Uri;
const snippetData: SnippetData = {
	snippetTitle: 'useEffect Snippet',
	prefix: 'test',
	scope: 'typescriptreact',
	description: 'desc',
	filepath: 'typescriptreact.json',
};

describe('SnippetEditorProvider', () => {
	let provider: SnippetEditorProvider;
	let dataManager: SnippetDataManager;

	beforeEach(() => {
		dataManager = new SnippetDataManager();
		provider = new SnippetEditorProvider(scheme, dataManager);
		(getCurrentUri as Mock).mockReturnValue(testUri);
		(getConfiguration as Mock).mockReturnValue({ get: vi.fn(() => true) });
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('should be created with a scheme', () => {
		expect(provider.scheme).toBe(scheme);
	});

	describe('File System Operations', () => {
		it('should create a directory', () => {
			const dirUri = { scheme, path: '/snippets/newDir' } as Uri;
			const fireSpy = vi.spyOn(provider['_emitter'], 'fire');
			provider.createDirectory(dirUri);
			expect(fireSpy).toHaveBeenCalledWith([{ type: vscode.FileChangeType.Created, uri: dirUri }]);
		});

		it('should throw if directory already exists', () => {
			const dirUri = { scheme, path: '/snippets' } as Uri;
			expect(() => provider.createDirectory(dirUri)).toThrow();
		});

		it('should write and read a file', async () => {
			const content = 'hello world';
			const encodedContent = new TextEncoder().encode(content);
			const fireSpy = vi.spyOn(provider['_emitter'], 'fire');

			await provider.writeFile(testUri, encodedContent, { create: true, overwrite: true });
			const result = await provider.readFile(testUri);

			expect(result).toEqual(encodedContent);
			expect(fireSpy).toHaveBeenCalledWith([{ type: vscode.FileChangeType.Changed, uri: testUri }]);
		});

		it('should throw when reading a non-existent file', () => {
			const nonExistentUri = { scheme, path: '/nonexistent.txt' } as Uri;
			expect(() => provider.readFile(nonExistentUri)).toThrow();
		});

		it('should create a file with content', async () => {
			const content = 'initial content';
			await provider.createFile(testUri, content);
			const readContent = await provider.readFile(testUri);
			expect(new TextDecoder().decode(readContent)).toBe(content);
		});

		it('should mount a snippet', async () => {
			const body = 'snippet body';
			vi.spyOn(dataManager, 'setData');
			await provider.mountSnippet(testUri, snippetData, body);

			expect(dataManager.setData).toHaveBeenCalledWith(testUri.path, snippetData);
			const readContent = await provider.readFile(testUri);
			expect(new TextDecoder().decode(readContent)).toBe(body);
		});

		it('should delete a file', async () => {
			await provider.createFile(testUri, 'content');
			const fireSpy = vi.spyOn(provider['_emitter'], 'fire');
			vi.spyOn(dataManager, 'deleteData');

			provider.delete(testUri);

			expect(() => provider.readFile(testUri)).toThrow();
			expect(dataManager.deleteData).toHaveBeenCalledWith(testUri.path);
			expect(fireSpy).toHaveBeenCalledWith([{ type: vscode.FileChangeType.Deleted, uri: testUri }]);
		});

		it('should get snippet data for the current URI', () => {
			vi.spyOn(dataManager, 'getData').mockReturnValue(snippetData);
			const result = provider.getSnippetData();
			expect(dataManager.getData).toHaveBeenCalledWith(testUri.path);
			expect(result).toEqual(snippetData);
		});

		it('should return file stats', async () => {
			const content = 'stats test';
			await provider.createFile(testUri, content);
			const stat = await provider.stat(testUri);
			expect(stat.size).toBe(content.length);
		});
	});

	describe('Document Change Handling', () => {
		let mockDocument;
		let changeEvent: any;
		beforeEach(() => {
			mockDocument = {
				uri: testUri,
				getText: vi.fn().mockReturnValue('const a = $1;'),
				lineCount: 1,
				// A mock for rangeOffset calculation
				offsetAt: (pos: PositionType) => pos.character,
			};
			changeEvent = {
				document: mockDocument,
				contentChanges: [{ text: '1', rangeOffset: 11 }],
			};
			(getConfiguration as Mock).mockReturnValue({
				get: vi.fn().mockReturnValue(true),
			});
		});

		it('should auto-escape dollar signs when enabled', async () => {
			provider.handleDocumentChange(changeEvent);

			const newText = _escapeDollarSignIfNeeded('const a = $1', 11);
			expect(newText).toBe('const a = \\$1');
		});

		it('should not auto-escape dollar signs when disabled', async () => {
			provider.handleDocumentChange(changeEvent);

			const newText = _escapeDollarSignIfNeeded('const a = ${4:placeholder}', 11);
			expect(newText).toBe('const a = \\${4:placeholder}');
		});
	});

	describe('Highlighting', () => {
		it('should highlight snippet features on editor change', () => {
			let editorChangeCallback: (editor: TextEditor | undefined) => void = () => {};
			(onDidChangeActiveTextEditor as Mock).mockImplementation((cb) => {
				editorChangeCallback = cb;
				return { dispose: vi.fn() };
			});

			// Re-create provider to attach listener
			provider = new SnippetEditorProvider(scheme, dataManager);

			const mockEditor = {
				document: {
					uri: testUri,
					getText: () => 'snippet body with $1 and ${2:placeholder}',
					positionAt: (offset: number) => new Position(0, offset),
				},
				setDecorations: vi.fn(),
			} as any;

			editorChangeCallback(mockEditor);

			expect(mockEditor.setDecorations).toHaveBeenCalled();
			const decorationOptions = mockEditor.setDecorations.mock.calls[0][1];
			expect(decorationOptions).toHaveLength(2);
		});
	});
});
