import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import SnippetViewProvider, { getSnippetViewProvider } from './SnippetViewProvider';
import {} from './templates';
import { getCurrentLanguage } from '../utils/language';
import { getActiveProfile, getActiveProfileSnippetsDir } from '../utils/profile';
import { getWorkspaceFolder, shortenFullPath, isParentDir } from '../utils/fsInfo';
import { getLinkedSnippets } from '../snippets/links/config';
import { getUserPath } from '../utils/context';
import { TreeItem, onDidChangeActiveTextEditor, getConfiguration } from '../vscode';
import { getCacheManager } from '../snippets/SnippetCacheManager';
import type { TreeItem as TreeItemType } from 'vscode';

vi.mock('../snippets/loadSnippets');
vi.mock('./templates');
vi.mock('../utils/language');
vi.mock('../utils/profile');
vi.mock('../utils/fsInfo');
vi.mock('../snippets/extension/locate');
vi.mock('../snippets/links/config');
vi.mock('../utils/context');

describe('ui/SnippetViewProvider', () => {
	let provider: SnippetViewProvider;
	let onDidChangeActiveTextEditorCallback: () => Promise<void>;

	beforeEach(async () => {
		(onDidChangeActiveTextEditor as Mock).mockImplementation((callback) => {
			onDidChangeActiveTextEditorCallback = callback;
			return { dispose: vi.fn() };
		});

		(getCurrentLanguage as Mock).mockReturnValue('typescript');
		(getActiveProfileSnippetsDir as Mock).mockResolvedValue('/active/profile/dir');
		(getActiveProfile as Mock).mockResolvedValue({ location: 'profile1', name: 'profile1' });
		(getWorkspaceFolder as Mock).mockReturnValue('/workspace/folder');
		(shortenFullPath as Mock).mockImplementation((p) => p as string);
		(isParentDir as Mock).mockReturnValue(false);
		(getUserPath as Mock).mockReturnValue('/user/path');
		(getLinkedSnippets as Mock).mockResolvedValue({});

		provider = new SnippetViewProvider();
		// Wait for async constructor parts
		await new Promise(setImmediate);
	});

	it('should be created', () => {
		expect(provider).toBeDefined();
	});

	it('should return a singleton instance', () => {
		const instance1 = getSnippetViewProvider();
		const instance2 = getSnippetViewProvider();
		expect(instance1).toBe(instance2);
	});

	it('getTreeItem should return the element itself', () => {
		const treeItem = new TreeItem('test');
		expect(provider.getTreeItem(treeItem)).toBe(treeItem);
	});

	describe('getChildren', () => {
		it('should return root items when element is undefined', async () => {
			const children = await provider.getChildren();
			expect(children).toHaveLength(1); // selected language only
		});

		it('should return snippet file entries for active-snippets and respect config filtering', async () => {
			const cache = getCacheManager();
			vi.spyOn(cache, 'getLangSnippets').mockResolvedValue([
				[
					'/path/a.code-snippets',
					{
						A: { body: 'a', scope: 'typescript', prefix: 'pre' },
						B: { body: 'b', scope: 'other', prefix: 'pre' },
					},
				],
				['/path/b.json', {}],
			]);
			cache.links = { 'a.code-snippets': ['profile1'] };

			(getConfiguration as Mock).mockReturnValue({ get: () => false });
			const items = await provider.getChildren({ contextValue: 'active-snippets' });
			expect(items).toHaveLength(2);

			(getConfiguration as Mock).mockReturnValue({ get: () => true });
			const itemsAll = await provider.getChildren({ contextValue: 'active-snippets' });
			expect(itemsAll).toHaveLength(2);
		});

		it('should return snippet children for a snippet-filepath (filters by language for code-snippets)', async () => {
			const cache = getCacheManager();
			const filepath = '/local/path/local.code-snippets';
			cache.snippets.set(filepath, {
				One: { body: '1', scope: 'typescript', prefix: 'pre' },
				Two: { body: '2', scope: 'javascript', prefix: 'pre' },
			});
			const result = await provider.getChildren({
				contextValue: 'snippet-filepath',
				filepath,
			} as TreeItemType);
			expect(result).toHaveLength(1);
		});
	});

	it('should refresh when active text editor language changes', async () => {
		const debounceSpy = vi.spyOn(provider, 'debounceRefresh');

		(getCurrentLanguage as Mock).mockReturnValue('javascript');
		await onDidChangeActiveTextEditorCallback();

		expect(debounceSpy).toHaveBeenCalled();
	});

	it('should not refresh when active text editor language is the same', async () => {
		const debounceSpy = vi.spyOn(provider, 'debounceRefresh');

		(getCurrentLanguage as Mock).mockReturnValue('typescript'); // same language
		await onDidChangeActiveTextEditorCallback();

		expect(debounceSpy).not.toHaveBeenCalled();
	});
});
