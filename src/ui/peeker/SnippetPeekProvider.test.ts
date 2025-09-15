import { vi, describe, it, expect, beforeEach, type Mock } from 'vitest';
import SnippetPeekProvider from './SnippetPeekProvider';
import vscode, { Uri, executeCommand, showTextDocument } from '../../vscode';
import { getCurrentLanguage } from '../../utils/language';

vi.mock('../../utils/language');

describe('SnippetPeekProvider', () => {
	let provider: SnippetPeekProvider;

	beforeEach(() => {
		vi.clearAllMocks();
		(getCurrentLanguage as Mock).mockReturnValue('typescript');
		provider = new SnippetPeekProvider();
	});

	describe('constructor', () => {
		it('should set up listeners', () => {
			expect(vscode.workspace.onDidOpenTextDocument).toBeCalled();
			expect(vscode.window.onDidChangeVisibleTextEditors).toBeCalled();
		});
	});

	describe('showPeek', () => {
		it('should show peek with correct locations', async () => {
			const snippets = {
				'my-snippet': {
					prefix: 'my-snippet',
					body: ['console.log("hello world")'],
					description: 'A snippet',
				},
			};
			const editor = {
				document: {
					uri: Uri.parse('file:///test.ts'),
				},
				visibleRanges: [
					{
						start: {},
					},
				],
			};
			vi.spyOn(vscode.window, 'activeTextEditor', 'get').mockReturnValue(undefined);
			(showTextDocument as Mock).mockResolvedValue(editor);

			await provider.showPeek(snippets, 'my-snippet');

			expect(executeCommand).toHaveBeenCalledWith(
				'editor.action.peekLocations',
				editor.document.uri,
				editor.visibleRanges[0].start,
				expect.any(Array),
				'goto'
			);
		});
	});

	describe('provideTextDocumentContent', () => {
		it('should return snippet content', () => {
			const uri = Uri.parse('snippetviewer:/typescript/clicked#typescript');
			const content = 'console.log("hello world")';
			// @ts-expect-error - private property
			provider.snippets.set(uri.toString(), content);

			const result = provider.provideTextDocumentContent(uri);
			expect(result).toBe(content);
		});

		it('should return not found message for unknown uri', () => {
			const uri = Uri.parse('snippetviewer:/typescript/unknown#typescript');
			const result = provider.provideTextDocumentContent(uri);
			expect(result).toBe('// snippet not found');
		});
	});
});
