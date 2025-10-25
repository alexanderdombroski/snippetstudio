import { vi, describe, it, expect, beforeEach, type Mock } from 'vitest';
import type { TextDocument, TextEditor } from 'vscode';
import vscode, { createTextEditorDecorationType, getConfiguration, Range } from '../../vscode';
import { highlightSnippetInsertionFeatures, _moveRangeDown } from '.';

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
			(vscode.languages.getDiagnostics as Mock).mockReturnValue([]);

			highlightSnippetInsertionFeatures(editor);
			expect(editor.setDecorations).toHaveBeenCalledWith(expectedDecoration, []);
		});

		it('should mask diagnostics when configured', () => {
			(getConfiguration as Mock).mockReturnValue({ get: vi.fn(() => 'suppressed') });
			(editor.document.getText as Mock).mockReturnValue('this is $1');

			highlightSnippetInsertionFeatures(editor);

			expect(vscode.languages.getDiagnostics).toHaveBeenCalled();
			expect(editor.setDecorations).toHaveBeenCalledTimes(3);
		});

		it('should not mask diagnostics when not configured', () => {
			(getConfiguration as Mock).mockReturnValue({ get: vi.fn(() => 'none') });
			(editor.document.getText as Mock).mockReturnValue('this is $1');
			highlightSnippetInsertionFeatures(editor);
			expect(vscode.languages.getDiagnostics).not.toHaveBeenCalled();
		});
	});

	describe('moveRangeDown', () => {
		it('should move a Location down one line', () => {
			(editor.document.lineAt as Mock).mockReturnValue({ text: 'placeholder text' });
			const range = new Range(0, 5, 0, 10);
			const newLocation = _moveRangeDown(range, editor.document);

			expect(newLocation.start.line).toBe(1);
			expect(newLocation.end.line).toBe(1);
			expect(newLocation.start.character).toBe(5);
			expect(newLocation.end.character).toBe(10);
		});
	});
});
