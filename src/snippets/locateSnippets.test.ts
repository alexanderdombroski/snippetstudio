import { vi, describe, it, expect, type Mock } from 'vitest';
import fs from 'node:fs/promises';
import { findCodeSnippetsFiles, locateAllSnippetFiles } from './locateSnippets';
import { exists, getWorkspaceFolder } from '../utils/fsInfo';
import {
	getActiveProfileSnippetsDir,
	getProfiles,
	getActiveProfile,
	getPathFromProfileLocation,
} from '../utils/profile';

vi.mock('node:fs/promises');
vi.mock('../utils/fsInfo');
vi.mock('../utils/profile');
vi.mock('../utils/language');

describe('locateSnippets', () => {
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
			(getWorkspaceFolder as Mock).mockReturnValue('/workspace');
			(getActiveProfileSnippetsDir as Mock).mockResolvedValue('/profiles/active/snippets');
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
			expect(globals).toEqual(['/profiles/active/snippets/active.code-snippets']);
			expect(profileSnippetsMap).toEqual({
				active: ['/profiles/active/snippets/active.code-snippets'],
				other: ['/profiles/other/snippets/other.code-snippets'],
			});
		});
	});
});
