import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import SnippetViewProvider, { getSnippetViewProvider } from './SnippetViewProvider';
import {} from './templates';
import { getCurrentLanguage } from '../utils/language';
import { getActiveProfile, getActiveProfileSnippetsDir } from '../utils/profile';
import { getWorkspaceFolder, shortenFullPath, isParentDir } from '../utils/fsInfo';
import { findAllExtensionSnipppetsByLang } from '../snippets/extension/locate';
import { getLinkedSnippets } from '../snippets/links/config';
import { getUserPath } from '../utils/context';
import { TreeItem, onDidChangeActiveTextEditor } from '../vscode';

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
		(findAllExtensionSnipppetsByLang as Mock).mockResolvedValue({});

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
