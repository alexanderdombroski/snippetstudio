import { vi, describe, it, expect, beforeEach, type Mock } from 'vitest';
import type { TextDocument, TextEditor } from 'vscode';
import { createTextEditorDecorationType, getConfiguration } from '../../vscode';
import { highlightSnippetInsertionFeatures } from '.';

const expectedDecoration = createTextEditorDecorationType({});
const expectedLocation = expect.anything();

const editor = {
	document: {
		getText: vi.fn(),
		positionAt: vi.fn(),
		lineAt: vi.fn(),
		lineCount: 2,
	} as Partial<TextDocument>,
	setDecorations: vi.fn(),
} as Partial<TextEditor> as TextEditor;

describe('syntax', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		(getConfiguration as Mock).mockReturnValue({ get: vi.fn(() => 'none') });
	});

	describe('highlightSnippetInsertionFeatures', () => {
		it('should not set decorations if there are no snippet features', () => {
			(editor.document.getText as Mock).mockReturnValue('some text without features');
			highlightSnippetInsertionFeatures(editor);
			expect(editor.setDecorations).toHaveBeenCalledWith(expectedDecoration, []);
		});

		it('should highlight basic snippet placeholders', () => {
			(editor.document.getText as Mock).mockReturnValue('this is $1 and $2');

			highlightSnippetInsertionFeatures(editor);

			expect(editor.setDecorations).toHaveBeenCalledWith(
				expectedDecoration,
				expect.arrayContaining([expectedLocation, expectedLocation])
			);
		});

		it('should not highlight escaped insertion features', () => {
			(editor.document.getText as Mock).mockReturnValue('this is \\$1 and \\${1:placeholder}');

			highlightSnippetInsertionFeatures(editor);
			expect(editor.setDecorations).toHaveBeenCalledWith(expectedDecoration, []);
		});
	});
});
