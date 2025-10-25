import { vi, describe, it, expect, type Mock, beforeEach } from 'vitest';
import fs from 'node:fs/promises';
import {
	_getGlobalLangSnippetFiles,
	findCodeSnippetsFiles,
	locateAllSnippetFiles,
	locateSnippetFiles,
} from './locateSnippets';
import { exists, getWorkspaceFolder } from '../utils/fsInfo';
import {
	getActiveProfileSnippetsDir,
	getProfiles,
	getActiveProfile,
	getPathFromProfileLocation,
	getAllGlobalSnippetDirs,
} from '../utils/profile';
import { getConfiguration, getLanguages } from '../vscode';
import { getCurrentLanguage } from '../utils/language';

vi.mock('../utils/fsInfo');
vi.mock('../utils/profile');
vi.mock('../utils/language');

describe('locateSnippets', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		(getActiveProfileSnippetsDir as Mock).mockResolvedValue('/profiles/active/snippets');
		(getAllGlobalSnippetDirs as Mock).mockResolvedValue([
			'/profile1/snippets',
			'/profile2/snippets',
		]);
		(getWorkspaceFolder as Mock).mockReturnValue('/workspace');
	});

	describe('locateSnippetFiles', () => {
		beforeEach(() => {
			(exists as Mock).mockResolvedValue(true);
			(fs.readdir as Mock).mockResolvedValue(['favorites.code-snippets', 'other-language.json']);
			(getCurrentLanguage as Mock).mockReturnValue('python');
		});
		it('should find snippets files of the current language', async () => {
			(getConfiguration as Mock).mockReturnValue({ get: vi.fn(() => true) });
			const files = await locateSnippetFiles();
			expect(getAllGlobalSnippetDirs).toBeCalled();
			expect(files.length).toBe(5);
		});
		it('should only find the active profile if configured that way', async () => {
			(getConfiguration as Mock).mockReturnValue({ get: vi.fn(() => false) });
			const files = await locateSnippetFiles();
			expect(getActiveProfileSnippetsDir).toBeCalled();
			expect(files.length).toBe(3);
		});
		it('should handle not having a workspace open', async () => {
			(getConfiguration as Mock).mockReturnValue({ get: vi.fn(() => true) });
			(getWorkspaceFolder as Mock).mockReturnValue(undefined);
			const files = await locateSnippetFiles();
			expect(files.length).toBe(4);
		});
	});

	describe('getGlobalLangSnippetFiles', () => {
		it('should find global snippets within one folder', async () => {
			(exists as Mock).mockResolvedValue(true);
			(fs.readdir as Mock).mockResolvedValue([
				'global.code-snippets',
				'typescript.json',
				'python.json',
			]);
			const files = await _getGlobalLangSnippetFiles('/global/path', 'typescript');
			expect(files.length).toBe(2);
		});
	});

	describe('findCodeSnippetsFiles', () => {
		it('should return an empty array if folder does not exist', async () => {
			(exists as Mock).mockResolvedValue(false);
			const files = await findCodeSnippetsFiles('/path/to/folder');
			expect(files).toEqual([]);
		});

		it('should return only .code-snippets files', async () => {
			(exists as Mock).mockResolvedValue(true);
			(fs.readdir as Mock).mockResolvedValue(['test.code-snippets', 'another.txt', 'data.json']);
			const files = await findCodeSnippetsFiles('/path/to/folder');
			expect(files).toEqual(['/path/to/folder/test.code-snippets']);
		});
	});

	describe('locateAllSnippetFiles', () => {
		it('should locate all snippet files across profiles and workspace', async () => {
			(getConfiguration as Mock).mockReturnValue({ get: vi.fn(() => true) });
			(getLanguages as Mock).mockResolvedValue(['typescript']);
			(getActiveProfile as Mock).mockResolvedValue({ location: 'active' });
			(getProfiles as Mock).mockResolvedValue([{ location: 'active' }, { location: 'other' }]);
			(getPathFromProfileLocation as Mock).mockImplementation((loc) => `/profiles/${loc}/snippets`);

			vi.spyOn(fs, 'readdir').mockImplementation(async (p: any) => {
				if (p.includes('workspace')) {
					return ['local.code-snippets'] as any;
				} else if (p.includes('active')) {
					return ['active.code-snippets'] as any;
				} else if (p.includes('other')) {
					return ['other.code-snippets'] as any;
				}
				return [] as any;
			});
			(exists as Mock).mockResolvedValue(true);

			const [locals, globals, profileSnippetsMap] = await locateAllSnippetFiles();

			expect(locals).toEqual(['/workspace/.vscode/local.code-snippets']);
			const tsSnippets = '/profiles/active/snippets/active.code-snippets';
			expect(globals).toEqual(
				expect.arrayContaining([tsSnippets, '/profiles/active/snippets/typescript.json'])
			);
			expect(profileSnippetsMap).toEqual({
				active: expect.arrayContaining([
					'/profiles/active/snippets/active.code-snippets',
					tsSnippets,
				]),
				other: expect.arrayContaining([
					'/profiles/other/snippets/other.code-snippets',
					'/profiles/other/snippets/typescript.json',
				]),
			});
		});
	});
});
