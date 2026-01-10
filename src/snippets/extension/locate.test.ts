import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { Dirent } from 'node:fs';
import { afterAll, describe, expect, it, vi, type Mock } from 'vitest';
import { exists } from '../../utils/fsInfo';
import { readJson } from '../../utils/jsoncFilesIO';
import {
	findAllExtensionSnippetsFiles,
	flattenScopedExtensionSnippets,
	getExtensionSnippetLangs,
	__getExtensionsDirPath,
} from './locate';
import vscode from '../../vscode';

vi.mock('../../utils/fsInfo');
vi.mock('../../utils/jsoncFilesIO');
vi.mock('node:os');

function configPath(appConfigDir: TemplateStringsArray) {
	return path.join(os.homedir(), appConfigDir[0], 'extensions');
}

(os.homedir as Mock).mockReturnValue('C:/home/user');

describe('locate', () => {
	describe('getExtensionSnippetLangs', () => {
		it('should return the languages for a given snippet path', async () => {
			const snippetPath = path.join('C:/home/user/.vscode/extensions', 'publisher.ext-name-0.0.1', 'snippets', 'javascript.json');
			const pkgPath = path.join('C:/home/user/.vscode/extensions', 'publisher.ext-name-0.0.1', 'package.json');
			const pkg = {
				contributes: {
					snippets: [
						{ language: 'javascript', path: './snippets/javascript.json' },
						{ language: 'typescript', path: './snippets/typescript.json' },
					],
				},
			};
			(readJson as Mock).mockResolvedValue(pkg);

			const langs = await getExtensionSnippetLangs(snippetPath);

			expect(readJson).toHaveBeenCalledWith(pkgPath);
			expect(langs).toEqual(['javascript']);
		});
	});

	describe('flattenScopedExtensionSnippets', () => {
		it('should flatten scoped snippets', () => {
			const snippets = {
				'.source.go': {
					'my-snippet': {
						prefix: 'prefix',
						body: 'body',
						description: 'description',
					},
				},
			};
			const flattened = flattenScopedExtensionSnippets(snippets);
			expect(flattened).toEqual({
				'my-snippet': {
					prefix: 'prefix',
					body: 'body',
					description: 'description',
				},
			});
		});

		it('should return snippets if not scoped', () => {
			const snippets = {
				'my-snippet': {
					prefix: 'prefix',
					body: 'body',
					description: 'description',
				},
			};
			const flattened = flattenScopedExtensionSnippets(snippets);
			expect(flattened).toEqual(snippets);
		});
	});

	describe('findAllExtensionSnippetsFiles', () => {
		it('should return an empty object if extensions directory does not exist', async () => {
			(exists as Mock).mockResolvedValue(false);
			const result = await findAllExtensionSnippetsFiles();
			expect(result).toEqual({});
		});

		it('should find all snippet files from extensions', async () => {
			(exists as Mock).mockResolvedValue(true);
			const dirents = [
				{ name: 'ext1', isDirectory: () => true },
				{ name: 'ext2', isDirectory: () => true },
				{ name: 'ext3-no-snippets', isDirectory: () => true },
			] as Dirent[];
			(fs.readdir as Mock).mockResolvedValue(dirents);

			(readJson as Mock).mockImplementation(async (p) => {
				if (p === path.join('C:/home/user/.vscode/extensions', 'ext1', 'package.json')) {
					return {
						name: 'Extension 1',
						contributes: {
							snippets: [{ language: 'javascript', path: './snippets/js.json' }],
						},
					};
				}
				if (p === path.join('C:/home/user/.vscode/extensions', 'ext2', 'package.json')) {
					return {
						name: 'Extension 2',
						contributes: {
							snippets: [{ language: 'typescript', path: './snippets/ts.json' }],
						},
					};
				}
				if (p === path.join('C:/home/user/.vscode/extensions', 'ext3-no-snippets', 'package.json')) {
					return {
						name: 'Extension 3',
					};
				}
				return {};
			});

			const result = await findAllExtensionSnippetsFiles();

			expect(result).toEqual({
				ext1: {
					name: 'Extension 1',
					files: [
						{
							language: 'javascript',
							path: path.join('C:/home/user/.vscode/extensions', 'ext1', 'snippets', 'js.json'),
						},
					],
				},
				ext2: {
					name: 'Extension 2',
					files: [
						{
							language: 'typescript',
							path: path.join('C:/home/user/.vscode/extensions', 'ext2', 'snippets', 'ts.json'),
						},
					],
				},
			});
		});
	});

	describe('getExtensionPath', () => {
		afterAll(() => {
			Object.defineProperty(vscode.env, 'appName', { value: 'Visual Studio Code' });
		});
		it('should find the vscode extensions folder', () => {
			expect(__getExtensionsDirPath()).toBe(path.join('C:/home/user', '.vscode', 'extensions'));
		});
		it('should should update the path for the nightly build', () => {
			Object.defineProperty(vscode.env, 'appName', { value: 'Visual Studio Code - Insiders' });
			expect(__getExtensionsDirPath()).toBe(path.join('C:/home/user', '.vscode-insiders', 'extensions'));
		});
		it('should should update the path for VSCodium', () => {
			Object.defineProperty(vscode.env, 'appName', { value: 'VSCodium' });
			expect(__getExtensionsDirPath()).toBe(path.join('C:/home/user', '.vscode-oss', 'extensions'));
		});
		it('should should update the path for Cursor', () => {
			Object.defineProperty(vscode.env, 'appName', { value: 'Cursor' });
			expect(__getExtensionsDirPath()).toBe(path.join('C:/home/user', '.cursor', 'extensions'));
		});
		it('should default to VS Code', () => {
			Object.defineProperty(vscode.env, 'appName', { value: 'Windsurf' });
			expect(__getExtensionsDirPath()).toBe(path.join('C:/home/user', '.vscode', 'extensions'));
		});
	});
});
