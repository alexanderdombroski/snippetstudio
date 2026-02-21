import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import SnippetCacheManager, { getCacheManager } from './SnippetCacheManager';
import { readSnippetFile } from '../utils/jsoncFilesIO';
import { isExtensionSnippetPath } from '../utils/fsInfo';
import { getLinkedSnippets } from './links/config';
import {
	locateActiveSnippetFiles,
	locateProfileSnippetFiles,
	locateSnippetFiles,
} from './locateSnippets';
import type { VSCodeSnippets, ProfileSnippetsMap, ExtensionSnippetFilesMap } from '../types';

vi.mock('../utils/jsoncFilesIO');
vi.mock('../utils/fsInfo');
vi.mock('./links/config');
vi.mock('./locateSnippets');
vi.mock('./extension/locate.js', () => ({
	findAllExtensionSnippetsFiles: vi.fn(),
}));

describe('SnippetCacheManager', () => {
	let manager: SnippetCacheManager;

	beforeEach(() => {
		vi.clearAllMocks();
		manager = new SnippetCacheManager();
	});

	describe('getCacheManager', () => {
		it('should return a singleton instance', () => {
			const instance1 = getCacheManager();
			const instance2 = getCacheManager();
			expect(instance1).toBe(instance2);
		});
	});

	describe('addFile', () => {
		it('should add a file to the map', async () => {
			await manager.addFile('/path/to/snippet.json');
			expect(manager.snippets.has('/path/to/snippet.json')).toBe(true);
			expect(manager.snippets.get('/path/to/snippet.json')).toBeNull();
		});

		it('should not add file if it already exists', async () => {
			await manager.addFile('/path/to/snippet.json');
			const size = manager.snippets.size;
			await manager.addFile('/path/to/snippet.json');
			expect(manager.snippets.size).toBe(size);
		});
	});

	describe('addSnippets', () => {
		it('should read and cache snippets from file', async () => {
			const mockSnippets: VSCodeSnippets = {
				test: { prefix: 'test', body: 'test body' },
			};
			(readSnippetFile as Mock).mockResolvedValue(mockSnippets);

			await manager.addSnippets('/path/to/snippet.json');

			expect(readSnippetFile).toBeCalledWith('/path/to/snippet.json', {
				tryFlatten: undefined,
				showError: undefined,
			});
			expect(manager.snippets.get('/path/to/snippet.json')).toBe(mockSnippets);
		});

		it('should use tryFlatten option for extension snippets', async () => {
			const mockSnippets: VSCodeSnippets = {
				test: { prefix: 'test', body: 'test body' },
			};
			(readSnippetFile as Mock).mockResolvedValue(mockSnippets);

			await manager.addSnippets('/path/to/snippet.json', { isExtensionSnippet: true });

			expect(readSnippetFile).toBeCalledWith('/path/to/snippet.json', {
				tryFlatten: true,
				showError: undefined,
			});
		});

		it('should set error object when read fails', async () => {
			(readSnippetFile as Mock).mockResolvedValue(null);

			await manager.addSnippets('/path/to/snippet.json');

			const result = manager.snippets.get('/path/to/snippet.json');
			expect(result).toEqual({
				'file incorrect format': {
					body: 'Need to fix json file!',
					prefix: 'error',
				},
			});
		});
	});

	describe('remove', () => {
		it('should remove a file from cache', async () => {
			await manager.addFile('/path/to/snippet.json');
			expect(manager.snippets.has('/path/to/snippet.json')).toBe(true);

			manager.remove('/path/to/snippet.json');
			expect(manager.snippets.has('/path/to/snippet.json')).toBe(false);
		});
	});

	describe('getSnippets', () => {
		it('should return cached snippets if available', async () => {
			const mockSnippets: VSCodeSnippets = {
				test: { prefix: 'test', body: 'test body' },
			};
			manager.snippets.set('/path/to/snippet.json', mockSnippets);

			const result = await manager.getSnippets('/path/to/snippet.json');

			expect(result).toBe(mockSnippets);
			expect(readSnippetFile).not.toBeCalled();
		});

		it('should read snippets if not cached', async () => {
			const mockSnippets: VSCodeSnippets = {
				test: { prefix: 'test', body: 'test body' },
			};
			(readSnippetFile as Mock).mockResolvedValue(mockSnippets);

			const result = await manager.getSnippets('/path/to/snippet.json');

			expect(readSnippetFile).toBeCalled();
			expect(result).toBe(mockSnippets);
		});

		it('should return null if snippets fail to load', async () => {
			(readSnippetFile as Mock).mockResolvedValue(null);

			const result = await manager.getSnippets('/path/to/snippet.json');

			expect(result).toEqual({
				'file incorrect format': {
					body: 'Need to fix json file!',
					prefix: 'error',
				},
			});
		});
	});

	describe('getFiles', () => {
		it('should return array of all file paths', async () => {
			await manager.addFile('/path/to/file1.json');
			await manager.addFile('/path/to/file2.json');
			await manager.addFile('/path/to/file3.json');

			const files = manager.getFiles();

			expect(files).toEqual(['/path/to/file1.json', '/path/to/file2.json', '/path/to/file3.json']);
		});

		it('should return empty array when no files', () => {
			const files = manager.getFiles();
			expect(files).toEqual([]);
		});
	});

	describe('hardRefresh', () => {
		it('should refresh all cached snippet files', async () => {
			const mockSnippets1: VSCodeSnippets = { test1: { prefix: 't1', body: 'body1' } };
			const mockSnippets2: VSCodeSnippets = { test2: { prefix: 't2', body: 'body2' } };

			manager.snippets.set('/path/to/file1.json', mockSnippets1);
			manager.snippets.set('/path/to/file2.json', mockSnippets2);

			(isExtensionSnippetPath as Mock).mockResolvedValue(false);
			(readSnippetFile as Mock).mockResolvedValue(mockSnippets1);

			await manager.hardRefresh();

			expect(readSnippetFile).toHaveBeenCalledTimes(2);
		});

		it('should not refresh files with null snippets', async () => {
			manager.snippets.set('/path/to/file1.json', null);
			manager.snippets.set('/path/to/file2.json', { test: { prefix: 't', body: 'b' } });

			(isExtensionSnippetPath as Mock).mockResolvedValue(false);
			(readSnippetFile as Mock).mockResolvedValue({});

			await manager.hardRefresh();

			expect(readSnippetFile).toHaveBeenCalledTimes(1);
			expect(readSnippetFile).toHaveBeenCalledWith('/path/to/file2.json', expect.any(Object));
		});
	});

	describe('updateActiveFiles', () => {
		it('should update locals, globals, and links', async () => {
			const mockLocals = ['/local/file1.json'];
			const mockGlobals = ['/global/file1.json', '/global/file2.json'];
			const mockLinks = { link1: '/linked/file.json' };

			(locateActiveSnippetFiles as Mock).mockResolvedValue([mockLocals, mockGlobals]);
			(getLinkedSnippets as Mock).mockResolvedValue(mockLinks);

			await manager.updateActiveFiles();

			expect(manager.locals).toEqual(mockLocals);
			expect(manager.globals).toEqual(mockGlobals);
			expect(manager.links).toEqual(mockLinks);
			expect(manager.snippets.has('/local/file1.json')).toBe(true);
			expect(manager.snippets.has('/global/file1.json')).toBe(true);
			expect(manager.snippets.has('/global/file2.json')).toBe(true);
		});
	});

	describe('updateExtensionFiles', () => {
		it('should update extension files', async () => {
			const mockExtension: ExtensionSnippetFilesMap = {
				ext1: {
					name: 'Extension 1',
					files: [
						{ language: 'typescript', path: '/ext/ts.json' },
						{ language: 'javascript', path: '/ext/js.json' },
					],
				},
			};

			const { findAllExtensionSnippetsFiles } = await import('./extension/locate.js');
			(findAllExtensionSnippetsFiles as Mock).mockResolvedValue(mockExtension);

			await manager.updateExtensionFiles();

			expect(manager.extension).toEqual(mockExtension);
			expect(manager.snippets.has('/ext/ts.json')).toBe(true);
			expect(manager.snippets.has('/ext/js.json')).toBe(true);
		});
	});

	describe('updateProfileFiles', () => {
		it('should update profile files', async () => {
			const mockProfiles: ProfileSnippetsMap = {
				profile1: ['/profile/file1.json', '/profile/file2.json'],
				profile2: ['/profile/file3.json'],
			};

			(locateProfileSnippetFiles as Mock).mockResolvedValue(mockProfiles);

			await manager.updateProfileFiles();

			expect(manager.profile).toEqual(mockProfiles);
			expect(manager.snippets.has('/profile/file1.json')).toBe(true);
			expect(manager.snippets.has('/profile/file2.json')).toBe(true);
			expect(manager.snippets.has('/profile/file3.json')).toBe(true);
		});
	});

	describe('getLangSnippets', () => {
		it('should return snippets for all located files', async () => {
			const mockFiles = ['/path/file1.json', '/path/file2.json'];
			const mockSnippets1: VSCodeSnippets = { test1: { prefix: 't1', body: 'b1' } };
			const mockSnippets2: VSCodeSnippets = { test2: { prefix: 't2', body: 'b2' } };

			(locateSnippetFiles as Mock).mockResolvedValue(mockFiles);
			(readSnippetFile as Mock)
				.mockResolvedValueOnce(mockSnippets1)
				.mockResolvedValueOnce(mockSnippets2);

			const result = await manager.getLangSnippets();

			expect(result).toEqual([
				['/path/file1.json', mockSnippets1],
				['/path/file2.json', mockSnippets2],
			]);
		});

		it('should handle files with no snippets', async () => {
			const mockFiles = ['/path/file1.json'];
			(locateSnippetFiles as Mock).mockResolvedValue(mockFiles);
			(readSnippetFile as Mock).mockResolvedValue({});

			const result = await manager.getLangSnippets();

			expect(result).toEqual([['/path/file1.json', {}]]);
		});
	});
});
