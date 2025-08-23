import { describe, expect, it, type Mock } from 'vitest';
import { capitalize, snippetBodyAsString, titleCase, unTabMultiline } from './string';
import { TextEditor } from '../../.vitest/__mocks__/vscode';
import { executeCommand, Selection, Position } from '../vscode';

describe('string utils', () => {
	describe('titleCase', () => {
		it('should convert a sentence to title case', () => {
			expect(titleCase('hello world')).toBe('Hello World');
		});

		it('should handle single words', () => {
			expect(titleCase('hello')).toBe('Hello');
		});

		it('should handle empty strings', () => {
			expect(titleCase('')).toBe('');
		});
	});

	describe('capitalize', () => {
		it('should capitalize a word', () => {
			expect(capitalize('hello')).toBe('Hello');
		});

		it('should handle single characters', () => {
			expect(capitalize('h')).toBe('H');
		});

		it('should handle empty strings', () => {
			expect(capitalize('')).toBe('');
		});
	});

	describe('snippetBodyAsString', () => {
		it('should convert a string array to a string', () => {
			expect(snippetBodyAsString(['line 1', 'line 2'])).toBe('line 1\nline 2');
		});

		it('should return the same string if a string is passed', () => {
			expect(snippetBodyAsString('hello world')).toBe('hello world');
		});

		it('should return an empty string for null or undefined', () => {
			expect(snippetBodyAsString(null)).toBe('');
			expect(snippetBodyAsString(undefined)).toBe('');
		});
	});

	describe('unTabMultiline', () => {
		const mockEditor = new TextEditor();
		const getText: Mock = mockEditor.document.getText;

		it('should return an empty string for an empty selection', async () => {
			const selection = new Selection(new Position(0, 0), new Position(0, 0));
			getText.mockReturnValue(''); // return string
			const result = await unTabMultiline(selection, mockEditor as any);
			expect(result).toBe('');
		});

		it('should un-indent a multiline selection', async () => {
			const selection = new Selection(new Position(0, 0), new Position(2, 0));
			getText.mockReturnValue('  line 1\n    line 2\n  line 3');
			const result = await unTabMultiline(selection, mockEditor as any);
			expect(executeCommand).toHaveBeenCalledWith('editor.action.indentationToSpaces');
			expect(result).toBe('line 1\n  line 2\nline 3');
		});

		it('should handle single line selections', async () => {
			const selection = new Selection(new Position(0, 4), new Position(0, 10));
			getText.mockReturnValue('    hello');
			const result = await unTabMultiline(selection, mockEditor as any);
			expect(result).toBe('hello');
		});
	});
});
