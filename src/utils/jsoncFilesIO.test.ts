// src/utils/jsoncFilesIO.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'node:fs/promises';
import {
	processJsonWithComments,
	readJsoncFilesAsync,
	readSnippetFile,
	writeSnippetFile,
	readJsonC,
	readJson,
	writeJson,
} from './jsoncFilesIO';
import { showErrorMessage, showInformationMessage } from '../vscode';
import { flattenScopedExtensionSnippets } from '../snippets/extension/locate';
import { getLinkLocations } from '../snippets/links/config';
import path from 'node:path';
import vscode from '../vscode';

// Mock dependencies
vi.mock('node:fs/promises');
vi.mock('../snippets/extension/locate', () => ({
	flattenScopedExtensionSnippets: vi.fn((x) => x),
}));
vi.mock('../snippets/links/config', () => ({
	getLinkLocations: vi.fn().mockResolvedValue([]),
}));
// Mock for strip-json-comments dynamic import
vi.mock('strip-json-comments', () => ({
	default: (str: string) => {
		// A simple implementation for testing purposes
		return str.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
	},
}));

describe('jsoncFilesIO', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('processJsonWithComments', () => {
		it('should strip comments and parse valid JSON', async () => {
			const jsonWithComments = `{
                // this is a comment
                "key": "value",
                /* this is another comment */
                "key2": 123
            }`;
			const result = await processJsonWithComments(jsonWithComments);
			expect(result).toEqual({ key: 'value', key2: 123 });
		});

		it('should return null for invalid JSON', async () => {
			const invalidJson = `{ "key": "value", }`;
			const result = await processJsonWithComments(invalidJson);
			expect(result).toBeNull();
		});

		it('should handle JSON without comments', async () => {
			const validJson = `{ "key": "value" }`;
			const result = await processJsonWithComments(validJson);
			expect(result).toEqual({ key: 'value' });
		});
	});

	describe('readJsoncFilesAsync', () => {
		it('should read and parse multiple JSONC files', async () => {
			const files = {
				'file1.jsonc': '{ "snippet1": { "prefix": "p1" } } // comment',
				'file2.jsonc': '{ "snippet2": { "prefix": "p2" } }',
			};
			vi.mocked(fs.readFile).mockImplementation((path) =>
				Promise.resolve(files[path as keyof typeof files] || '')
			);

			const result = await readJsoncFilesAsync(Object.keys(files));
			expect(result).toHaveLength(2);
			expect(result).toContainEqual(['file1.jsonc', { snippet1: { prefix: 'p1' } }]);
			expect(result).toContainEqual(['file2.jsonc', { snippet2: { prefix: 'p2' } }]);
		});

		it('should handle JSON parsing errors gracefully', async () => {
			const files = {
				'good.jsonc': '{ "good": "json" }',
				'bad.jsonc': '{ "bad": "json", }',
			};
			vi.mocked(fs.readFile).mockImplementation((path) =>
				Promise.resolve(files[path as keyof typeof files])
			);

			const result = await readJsoncFilesAsync(Object.keys(files));
			expect(result).toHaveLength(2);
			expect(result).toContainEqual(['good.jsonc', { good: 'json' }]);
			expect(result).toContainEqual([
				'bad.jsonc',
				{
					'file incorrect format': {
						body: 'Need to fix json file!',
						prefix: 'error',
					},
				},
			]);
		});

		it('should handle file read errors gracefully', async () => {
			vi.mocked(fs.readFile).mockImplementation(async (path) => {
				if (path === 'error.jsonc') {
					throw new Error('read error');
				}
				return '{ "good": "json" }';
			});

			const result = await readJsoncFilesAsync(['good.jsonc', 'error.jsonc']);
			expect(result).toHaveLength(1);
			expect(result[0]).toEqual(['good.jsonc', { good: 'json' }]);
		});
	});

	describe('readSnippetFile', () => {
		it('should read and parse a snippet file', async () => {
			const content = '{ "test": { "prefix": "tst" } }';
			vi.mocked(fs.readFile).mockResolvedValue(content);
			const result = await readSnippetFile('test.jsonc');
			expect(fs.readFile).toHaveBeenCalledWith('test.jsonc', 'utf-8');
			expect(result).toEqual({ test: { prefix: 'tst' } });
		});

		it('should call flattenScopedExtensionSnippets when tryFlatten is true', async () => {
			const content = '{ "test": { "prefix": "tst" } }';
			vi.mocked(fs.readFile).mockResolvedValue(content);
			await readSnippetFile('test.jsonc', true);
			expect(flattenScopedExtensionSnippets).toHaveBeenCalled();
		});

		it('should show an error message if reading fails', async () => {
			vi.mocked(fs.readFile).mockRejectedValue(new Error('fail'));
			const result = await readSnippetFile('test.jsonc');
			expect(result).toBeUndefined();
			expect(showErrorMessage).toHaveBeenCalledWith(
				`Unable to read file ${path.basename('test.jsonc')}\n\n${'test.jsonc'}`
			);
		});
	});

	describe('writeSnippetFile', () => {
		const snippet = { test: { prefix: 'tst', body: [] } };
		const snippetString = JSON.stringify(snippet, null, 2);

		it('should write to the specified filepath', async () => {
			await writeSnippetFile('test.json', snippet);
			expect(fs.writeFile).toHaveBeenCalledWith('test.json', snippetString);
			expect(showInformationMessage).toHaveBeenCalledWith('Snippet updated successfully!');
		});

		it('should write to linked locations if they exist', async () => {
			const links = ['/link1', '/link2'];
			vi.mocked(getLinkLocations).mockResolvedValue(links);
			vi.mocked(fs.mkdir).mockResolvedValue(undefined);

			await writeSnippetFile('/orig/test.json', snippet);

			expect(fs.mkdir).toHaveBeenCalledWith(path.dirname('/link1/test.json'), {
				recursive: true,
			});
			expect(fs.writeFile).toHaveBeenCalledWith('/link1/test.json', snippetString);
			expect(fs.mkdir).toHaveBeenCalledWith(path.dirname('/link2/test.json'), {
				recursive: true,
			});
			expect(fs.writeFile).toHaveBeenCalledWith('/link2/test.json', snippetString);
			expect(fs.writeFile).toHaveBeenCalledTimes(2);
		});

		it('should not show message when silent is true', async () => {
			await writeSnippetFile('test.json', snippet, 'Success', true);
			expect(fs.writeFile).toHaveBeenCalled();
			expect(showInformationMessage).not.toHaveBeenCalled();
		});

		it('should show an error message on failure', async () => {
			vi.mocked(fs.writeFile).mockRejectedValue(new Error('fail'));
			await writeSnippetFile('test.json', snippet);
			expect(showErrorMessage).toHaveBeenCalledWith(
				`Unable to update file ${path.dirname('test.json')}\n\n${'test.json'}`
			);
		});
	});

	describe('readJsonC', () => {
		it('should read and parse a JSONC file', async () => {
			const content = '// comment\n{ "key": "value" }';
			vi.mocked(fs.readFile).mockResolvedValue(content);
			const result = await readJsonC('test.jsonc');
			expect(result).toEqual({ key: 'value' });
		});
	});

	describe('readJson', () => {
		it('should read and parse a JSON file', async () => {
			const content = '{ "key": "value" }';
			vi.mocked(fs.readFile).mockResolvedValue(content);
			const result = await readJson('test.json');
			expect(result).toEqual({ key: 'value' });
		});

		it('should throw for invalid JSON', async () => {
			const content = '{ "key":, }';
			vi.mocked(fs.readFile).mockResolvedValue(content);
			await expect(readJson('test.json')).rejects.toThrow();
		});
	});

	describe('writeJson', () => {
		it('should write json to a file using vscode fs', async () => {
			const jsonObj = { key: 'value' };
			const filepath = '/test/file.json';
			const content = Buffer.from(JSON.stringify(jsonObj, null, 4), 'utf-8');

			await writeJson(filepath, jsonObj);

			expect(vscode.workspace.fs.writeFile).toHaveBeenCalledWith({ fsPath: filepath }, content);
		});
	});
});
