import { describe, it, expect, vi, type Mock, type Mocked } from 'vitest';
import initSnippetEditorCommands, { _saveSnippet, _normalizeGlobValue } from './snippetEditor';
import vscode, {
	executeCommand,
	getConfiguration,
	onDidChangeActiveTextEditor,
	registerCommand,
	showErrorMessage,
} from '../../vscode';
import { context } from '../../../.vitest/__mocks__/shared';
import type SnippetEditorProvider from './SnippetEditorProvider';
import type { TextDocument, TextEditor, Uri } from 'vscode';
import { writeSnippet } from '../../snippets/updateSnippets';

vi.mock('../../utils/string');
vi.mock('../../snippets/updateSnippets');

const mockEditor = {
	getSnippetData: vi.fn(),
} as Pick<SnippetEditorProvider, 'getSnippetData'> as Mocked<SnippetEditorProvider>;

describe('initSnippetEditorCommands', () => {
	it('should register commands and editor change listener', () => {
		vi.spyOn(context.subscriptions, 'push');

		initSnippetEditorCommands(context, mockEditor);

		expect(context.subscriptions.push).toHaveBeenCalledTimes(1);

		const registeredCommands = (registerCommand as Mock<typeof registerCommand>).mock.calls.map(
			(call: any[]) => call[0]
		);
		expect(registeredCommands).toEqual(
			expect.arrayContaining(['snippetstudio.editor.save', 'snippetstudio.editor.cancel'])
		);
	});

	it('set up onDidChangeActiveTextEditor listener to change editor visible context', () => {
		initSnippetEditorCommands(context, mockEditor);
		expect(onDidChangeActiveTextEditor).toHaveBeenCalled();
	});
});

describe('saveSnippet', () => {
	it('will only save snippet studio buffer files', async () => {
		vi.spyOn(vscode.window, 'activeTextEditor', 'get').mockReturnValue({
			document: { uri: { scheme: 'file' } as Uri } as TextDocument,
		} as TextEditor);

		await _saveSnippet(mockEditor);
		expect(mockEditor.getSnippetData).not.toHaveBeenCalled();
	});

	it("won't save if there's no snippet", async () => {
		vi.spyOn(vscode.window, 'activeTextEditor', 'get').mockReturnValue({
			document: { uri: { scheme: 'snippetstudio' } as Uri, getText: () => '' } as TextDocument,
		} as TextEditor);

		(mockEditor.getSnippetData as Mock).mockReturnValue(undefined);

		await _saveSnippet(mockEditor);
		expect(showErrorMessage).toHaveBeenCalled();
	});

	it('will save all snippet details', async () => {
		vi.spyOn(vscode.window, 'activeTextEditor', 'get').mockReturnValue({
			document: {
				uri: { scheme: 'snippetstudio' } as Uri,
				getText: () => 'Hello\nWorld',
			} as TextDocument,
		} as TextEditor);

		(getConfiguration as Mock).mockReturnValue({ get: vi.fn(() => true) });

		(mockEditor.getSnippetData as Mock).mockReturnValue({
			snippetTitle: 'example',
			prefix: 'snippet, snip',
			filename: 'example.code-snippets',
			scope: 'markdown',
			description: 'example snippet',
			isFileTemplate: true,
			include: '*.md',
			exclude: '*.mdx',
		});

		await _saveSnippet(mockEditor);
		expect(writeSnippet).toHaveBeenCalled();
		expect(executeCommand).toHaveBeenCalledTimes(3);
	});
});

describe('_normalizeGlobValue', () => {
	it('returns the same array when passed an array', () => {
		const input = ['**/*.js', '**/*.ts'];
		expect(_normalizeGlobValue(input)).toEqual(input);
	});

	it('returns the original string when no comma is present', () => {
		expect(_normalizeGlobValue('**/*.js')).toBe('**/*.js');
	});

	it('splits comma-separated strings into a trimmed array', () => {
		expect(_normalizeGlobValue('**/*.js, **/*.ts')).toEqual(['**/*.js', '**/*.ts']);
	});
});
