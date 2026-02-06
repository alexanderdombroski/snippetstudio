import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import {
	_escapeAllSnippetInsertionFeatures,
	_initEditing,
	_newSnippetEditorUri,
	editSnippet,
} from './startEditor';
import {
	getConfiguration,
	openTextDocument,
	showErrorMessage,
	showTextDocument,
} from '../../vscode';
import { createFile } from '../../snippets/newSnippetFile';
import type { Uri as UriType } from 'vscode';
import type { SnippetData } from '../../types';

vi.mock('./startEditor', async () => {
	const actual = await vi.importActual('./startEditor');

	return {
		...actual,
		_initEditing: vi.fn().mockResolvedValue({
			mountSnippet: vi.fn(),
			delete: vi.fn(),
		}),
	};
});

vi.mock('../../snippets/newSnippetFile.js');
vi.mock('./SnippetEditorProvider');
vi.mock('./SnippetDataManager');
vi.mock('./SnippetDataWebViewProvider');
vi.mock('./snippetEditor');
vi.mock('./snippetFeatures');

describe('startEditor', () => {
	describe('editSnippet', () => {
		let mockSnippetData: SnippetData;
		let mockDoc: { uri: UriType };

		beforeEach(() => {
			mockSnippetData = {
				snippetTitle: 'test snippet',
				prefix: 'test',
				description: 'a test snippet',
				scope: 'typescript',
				filepath: '/path/to/snippets.json',
			};

			mockDoc = {
				uri: {
					scheme: 'snippetstudio',
					path: '/snippets/snippet-1',
					query: 'type=typescript&showScope=false',
				} as UriType,
			};

			(getConfiguration as Mock).mockReturnValue({
				get: vi.fn().mockReturnValue(false),
			});

			(openTextDocument as Mock).mockResolvedValue(mockDoc);
		});

		it('should open an editor with the snippet data', async () => {
			const langId = 'typescript';
			const body = 'console.log("hello");';

			const doc = await editSnippet(langId, mockSnippetData, body);

			expect(showTextDocument).toBeCalledWith(mockDoc, expect.anything());
			expect(doc).toBe(mockDoc);
		});

		it('should call createFile if autoCreateSnippetFiles is true', async () => {
			(getConfiguration as Mock).mockReturnValue({
				get: vi.fn().mockReturnValue(true),
			});
			(createFile as Mock).mockResolvedValue('created');

			await editSnippet('typescript', mockSnippetData, '');

			expect(createFile).toHaveBeenCalledWith(mockSnippetData.filepath, false);
		});

		it('should not call createFile if autoCreateSnippetFiles is false', async () => {
			(getConfiguration as Mock).mockReturnValue({
				get: vi.fn().mockReturnValue(false),
			});

			await editSnippet('typescript', mockSnippetData, '');

			expect(createFile).not.toHaveBeenCalled();
		});

		it('should return if createFile status is "skipped"', async () => {
			(getConfiguration as Mock).mockReturnValue({
				get: vi.fn().mockReturnValue(true),
			});
			(createFile as Mock).mockResolvedValue('skipped');

			const result = await editSnippet('typescript', mockSnippetData, '');

			expect(createFile).toHaveBeenCalledWith(mockSnippetData.filepath, false);
			expect(_initEditing).not.toHaveBeenCalled();
			expect(result).toBeUndefined();
		});

		it('should handle errors and show an error message', async () => {
			const error = new Error('test error');
			(getConfiguration as Mock).mockRejectedValue(error);

			const result = await editSnippet('typescript', mockSnippetData, '');

			expect(showErrorMessage).toHaveBeenCalled();
			expect(result).toBeUndefined();
		});
	});

	describe('escapeAllSnippetInsertionFeatures', () => {
		it("should escape tabstops that aren't tabstops", () => {
			const startText = '() => $0 < $1';
			const endText = '() => \\$0 < \\$1';

			expect(_escapeAllSnippetInsertionFeatures(startText)).toBe(endText);
		});
		it("should escape placeholders that aren't placeholders", () => {
			const startText = 'my ${1:computer} is cool';
			const endText = 'my \\${1:computer} is cool';

			expect(_escapeAllSnippetInsertionFeatures(startText)).toBe(endText);
		});
	});

	describe('newSnippetEditorUri', () => {
		it('should return a Uri', async () => {
			const uri = _newSnippetEditorUri();
			expect(uri).toSatisfy(
				({ scheme, path }) => scheme === 'snippetstudio' && path.includes('/snippets/snippet')
			);
		});
		it('should return a new Uri every time', async () => {
			const uri1 = _newSnippetEditorUri();
			const uri2 = _newSnippetEditorUri();

			expect(uri1.path).not.toBe(uri2.path);
		});
	});
});
