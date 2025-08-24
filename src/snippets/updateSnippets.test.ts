import { vi, describe, it, expect, type Mock } from 'vitest';
import { deleteSnippet, writeSnippet, readSnippet, deleteSnippetFile } from './updateSnippets';
import { showInformationMessage, showErrorMessage, showWarningMessage } from '../vscode';
import { readSnippetFile, writeSnippetFile } from '../utils/jsoncFilesIO';
import fs from 'fs/promises';
import { getCurrentLanguage } from '../utils/language';
import { exists } from '../utils/fsInfo';
import { isSnippetLinked } from './links/config';
import type { VSCodeSnippet } from '../types';

vi.mock('../utils/jsoncFilesIO');
vi.mock('../utils/language');
vi.mock('./locateSnippets');
vi.mock('../utils/fsInfo');
vi.mock('./links/config');

describe('updateSnippets', () => {
	describe('writeSnippet', () => {
		it('should add scope for .code-snippets files', async () => {
			(readSnippetFile as Mock).mockResolvedValue({});
			(getCurrentLanguage as Mock).mockReturnValue('typescript');
			const snippet: VSCodeSnippet = { prefix: 'p', body: 'b' };
			await writeSnippet('test.code-snippets', 'title', snippet);
			expect(writeSnippetFile).toHaveBeenCalledWith('test.code-snippets', {
				title: { ...snippet, scope: 'typescript' },
			});
		});

		it('should remove scope for .json files', async () => {
			(readSnippetFile as Mock).mockResolvedValue({});
			const snippet: VSCodeSnippet = { prefix: 'p', body: 'b', scope: 'ts' };
			await writeSnippet('test.json', 'title', snippet);
			// eslint-disable-next-line no-unused-vars
			const { scope, ...rest } = snippet;
			expect(writeSnippetFile).toHaveBeenCalledWith('test.json', { title: rest });
		});
	});

	describe('deleteSnippet', () => {
		it('should delete a snippet', async () => {
			(readSnippetFile as Mock).mockResolvedValue({ title: {} });
			await deleteSnippet('test.json', 'title');
			expect(writeSnippetFile).toHaveBeenCalledWith('test.json', {});
		});
	});

	describe('readSnippet', () => {
		it('should read a snippet', async () => {
			const snippet = { prefix: 'p', body: 'b' };
			(readSnippetFile as Mock).mockResolvedValue({ title: snippet });
			vi.spyOn(console, 'error');
			const result = await readSnippet('test.json', 'title');

			expect(console.error).not.toBeCalled();
			expect(result).toEqual(snippet);
		});
	});

	describe('deleteSnippetFile', () => {
		it('should show warning if snippet is linked', async () => {
			(isSnippetLinked as Mock).mockResolvedValue(true);
			await deleteSnippetFile('test.json');
			expect(showWarningMessage).toHaveBeenCalled();
		});

		it('should show error if file does not exist', async () => {
			(isSnippetLinked as Mock).mockResolvedValue(false);
			(exists as Mock).mockResolvedValue(false);
			await deleteSnippetFile('test.json');
			expect(showErrorMessage).toHaveBeenCalled();
		});

		it('should delete file on confirmation', async () => {
			(isSnippetLinked as Mock).mockResolvedValue(false);
			(exists as Mock).mockResolvedValue(true);
			(showInformationMessage as Mock).mockResolvedValue('Yes');

			await deleteSnippetFile('test.json');

			expect(fs.unlink).toHaveBeenCalledWith('test.json');
			expect((showInformationMessage as Mock).mock.calls[1]).toEqual([
				expect.stringContaining('Snippet file deleted'),
			]);
		});

		it('should not delete file on cancellation', async () => {
			(isSnippetLinked as Mock).mockResolvedValue(false);
			(exists as Mock).mockResolvedValue(true);
			(showInformationMessage as Mock).mockResolvedValue('No');

			await deleteSnippetFile('test.json');

			expect(fs.unlink).not.toHaveBeenCalled();
		});
	});
});
