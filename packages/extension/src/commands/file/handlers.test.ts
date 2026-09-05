import { describe, it, expect, vi, beforeAll } from 'vitest';
import {
	openHandler,
	createGlobalLangHandler,
	createProjectSnippetsHandler,
	createGlobalSnippetsHandler,
	deleteHandler,
	exportHandler,
	renameHandler,
} from './handlers';
import { refreshAll } from '../utils';
import {
	createGlobalLangFile,
	createLocalSnippetsFile,
	createGlobalSnippetsFile,
	exportSnippets,
	renameSnippetFile,
} from '../../snippets/newSnippetFile';
import { deleteSnippetFile } from '../../snippets/updateSnippets';
import { showTextDocument, openTextDocument, Uri } from '../../vscode';
import type { SnippetFileTreeItem } from '../../ui/templates';

vi.mock('../../snippets/newSnippetFile');
vi.mock('../../snippets/updateSnippets');
vi.mock('../utils');

beforeAll(() => {
	vi.clearAllMocks();
});

const item: SnippetFileTreeItem = {
	label: 'test',
	collapsibleState: 1,
	filepath: '/path/to/snippet.json',
	contextValue: 'snippet-file',
};

describe('handlers', () => {
	describe('openHandler', () => {
		it('should open a snippet file', async () => {
			await openHandler(item);
			expect(openTextDocument).toBeCalledWith(Uri.file('/path/to/snippet.json'));
			expect(showTextDocument).toBeCalled();
		});
	});

	describe('createGlobalLangHandler', () => {
		it('should create a global language file and refresh', async () => {
			await createGlobalLangHandler();
			expect(createGlobalLangFile).toBeCalled();
			expect(refreshAll).toBeCalled();
		});
	});

	describe('createProjectSnippetsHandler', () => {
		it('should create a local snippets file and refresh', async () => {
			await createProjectSnippetsHandler();
			expect(createLocalSnippetsFile).toBeCalled();
			expect(refreshAll).toBeCalled();
		});
	});

	describe('createGlobalSnippetsHandler', () => {
		it('should create a global snippets file and refresh', async () => {
			await createGlobalSnippetsHandler();
			expect(createGlobalSnippetsFile).toBeCalled();
			expect(refreshAll).toBeCalled();
		});
	});

	describe('deleteHandler', () => {
		it('should delete a snippet file and refresh', async () => {
			await deleteHandler(item);
			expect(deleteSnippetFile).toBeCalledWith('/path/to/snippet.json');
			expect(refreshAll).toBeCalled();
		});
	});

	describe('exportHandler', () => {
		it('should export snippets', async () => {
			await exportHandler();
			expect(exportSnippets).toBeCalled();
			expect(refreshAll).toBeCalled();
		});
	});

	describe('renameHandler', () => {
		it('should rename a snippets file', async () => {
			await renameHandler(item);
			expect(renameSnippetFile).toBeCalled();
			expect(refreshAll).toBeCalled();
		});
	});
});
