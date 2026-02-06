import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { SnippetTreeItem, SnippetFileTreeItem, ExtSnippetFileTreeItem } from './snippets';
import { shortenFullPath } from '../../utils/fsInfo';
import { snippetBodyAsString } from '../../utils/string';
import { Collapsed, None } from '../../vscode';
import type { VSCodeSnippet, SnippetContribution } from '../../types';

vi.mock('../../utils/fsInfo');
vi.mock('../../utils/string');

describe('snippets', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('SnippetTreeItem', () => {
		it('should create snippet item with string prefix', () => {
			const snippet: VSCodeSnippet = {
				prefix: 'test',
				body: 'test body',
			};
			(snippetBodyAsString as Mock).mockReturnValue('test body');

			const item = new SnippetTreeItem('My Snippet', snippet, '/path/to/file.json');

			expect(item.label).toBe('test');
			expect(item.description).toBe('My Snippet');
			expect(item.path).toBe('/path/to/file.json');
			expect(item.contextValue).toBe('snippet');
			expect(item.collapsibleState).toBe(None);
		});

		it('should create snippet item with array prefix', () => {
			const snippet: VSCodeSnippet = {
				prefix: ['test1', 'test2', 'test3'],
				body: 'test body',
			};
			(snippetBodyAsString as Mock).mockReturnValue('test body');

			const item = new SnippetTreeItem('My Snippet', snippet, '/path/to/file.json');

			expect(item.label).toBe('test1, test2, test3');
		});

		it('should include description in tooltip when provided', () => {
			const snippet: VSCodeSnippet = {
				prefix: 'test',
				body: 'test body',
				description: 'This is a test snippet',
			};
			(snippetBodyAsString as Mock).mockReturnValue('test body');

			const item = new SnippetTreeItem('My Snippet', snippet, '/path/to/file.json');

			expect(item.tooltip).toContain('Keyword: test');
			expect(item.tooltip).toContain('test body');
			expect(item.tooltip).toContain('This is a test snippet');
		});

		it('should not include description in tooltip when not provided', () => {
			const snippet: VSCodeSnippet = {
				prefix: 'test',
				body: 'test body',
			};
			(snippetBodyAsString as Mock).mockReturnValue('test body');

			const item = new SnippetTreeItem('My Snippet', snippet, '/path/to/file.json');

			expect(item.tooltip).toBe('Keyword: test\n```text\ntest body```');
		});

		it('should set command for showing snippet body', () => {
			const snippet: VSCodeSnippet = {
				prefix: 'test',
				body: 'test body',
			};
			(snippetBodyAsString as Mock).mockReturnValue('test body');

			const item = new SnippetTreeItem('My Snippet', snippet, '/path/to/file.json');

			expect(item.command).toEqual({
				title: 'Show Snippet Body',
				command: 'snippetstudio.snippet.showBody',
				arguments: [item],
			});
		});

		it('should accept custom context value', () => {
			const snippet: VSCodeSnippet = {
				prefix: 'test',
				body: 'test body',
			};
			(snippetBodyAsString as Mock).mockReturnValue('test body');

			const item = new SnippetTreeItem(
				'My Snippet',
				snippet,
				'/path/to/file.json',
				'custom-snippet'
			);

			expect(item.contextValue).toBe('custom-snippet');
		});
	});

	describe('SnippetFileTreeItem', () => {
		it('should create file item with correct properties', () => {
			(shortenFullPath as Mock).mockReturnValue('~/snippets/file.json');

			const item = new SnippetFileTreeItem(
				Collapsed,
				'/full/path/to/snippets/file.json',
				'snippet-file'
			);

			expect(item.label).toBe('file.json');
			expect(item.collapsibleState).toBe(Collapsed);
			expect(item.filepath).toBe('/full/path/to/snippets/file.json');
			expect(item.contextValue).toBe('snippet-file');
			expect(item.description).toBe('~/snippets/file.json');
		});

		it('should add link emoji for linked snippets', () => {
			(shortenFullPath as Mock).mockReturnValue('~/snippets/linked.json');

			const item = new SnippetFileTreeItem(None, '/path/to/linked.json', 'linked-snippet-file');

			expect(item.label).toBe('\u{1F517} linked.json');
		});

		it('should not add link emoji for non-linked snippets', () => {
			(shortenFullPath as Mock).mockReturnValue('~/snippets/regular.json');

			const item = new SnippetFileTreeItem(None, '/path/to/regular.json', 'snippet-file');

			expect(item.label).toBe('regular.json');
		});

		it('should set tooltip with shortened path', () => {
			(shortenFullPath as Mock).mockReturnValue('~/snippets/file.json');

			const item = new SnippetFileTreeItem(Collapsed, '/path/to/file.json', 'snippet-file');

			expect(item.tooltip).toContain('~/snippets/file.json');
			expect(item.tooltip).toContain('Double Click to open the file!');
		});

		it('should set command for opening file on double click', () => {
			(shortenFullPath as Mock).mockReturnValue('~/snippets/file.json');

			const item = new SnippetFileTreeItem(Collapsed, '/path/to/file.json', 'snippet-file');

			expect(item.command).toEqual({
				title: 'Open Snippet File',
				command: 'snippetstudio.file.openFromDouble',
				arguments: [item],
			});
		});

		it('should handle different collapsible states', () => {
			(shortenFullPath as Mock).mockReturnValue('~/file.json');

			const collapsed = new SnippetFileTreeItem(Collapsed, '/path/to/file.json', 'snippet-file');
			const none = new SnippetFileTreeItem(None, '/path/to/file.json', 'snippet-file');

			expect(collapsed.collapsibleState).toBe(Collapsed);
			expect(none.collapsibleState).toBe(None);
		});
	});

	describe('ExtSnippetFileTreeItem', () => {
		it('should create extension snippet file item when collapsible', () => {
			const contribution: SnippetContribution = {
				language: 'typescript',
				path: '/extensions/typescript.json',
			};
			(shortenFullPath as Mock).mockReturnValue('~/.vscode/extensions/typescript.json');

			const item = new ExtSnippetFileTreeItem(contribution, true);

			expect(item.collapsibleState).toBe(Collapsed);
			expect(item.filepath).toBe('/extensions/typescript.json');
			expect(item.contextValue).toBe('extension-snippet-filepath');
			expect(item.tooltip).toBe(
				'Extension Snippet file for typescript. Direct edits reset every extension update.'
			);
		});

		it('should create extension snippet file item when not collapsible', () => {
			const contribution: SnippetContribution = {
				language: 'javascript',
				path: '/extensions/javascript.json',
			};
			(shortenFullPath as Mock).mockReturnValue('~/.vscode/extensions/javascript.json');

			const item = new ExtSnippetFileTreeItem(contribution, false);

			expect(item.collapsibleState).toBe(None);
			expect(item.filepath).toBe('/extensions/javascript.json');
		});

		it('should override tooltip with extension-specific message', () => {
			const contribution: SnippetContribution = {
				language: 'python',
				path: '/extensions/python.json',
			};
			(shortenFullPath as Mock).mockReturnValue('~/.vscode/extensions/python.json');

			const item = new ExtSnippetFileTreeItem(contribution, true);

			expect(item.tooltip).toContain('Extension Snippet file for python');
			expect(item.tooltip).toContain('Direct edits reset every extension update');
			expect(item.tooltip).not.toContain('Double Click to open');
		});

		it('should inherit command from parent class', () => {
			const contribution: SnippetContribution = {
				language: 'typescript',
				path: '/extensions/typescript.json',
			};
			(shortenFullPath as Mock).mockReturnValue('~/.vscode/extensions/typescript.json');

			const item = new ExtSnippetFileTreeItem(contribution, true);

			expect(item.command).toEqual({
				title: 'Open Snippet File',
				command: 'snippetstudio.file.openFromDouble',
				arguments: [item],
			});
		});
	});
});
