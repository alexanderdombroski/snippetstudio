import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import SnippetViewProvider from './SnippetViewProvider';
import loadSnippets from '../snippets/loadSnippets';
import {
	selectedLanguageTemplate,
	unloadedDropdownTemplate,
	extensionCategoryDropdown,
} from './templates';
import { getCurrentLanguage } from '../utils/language';
import { getActiveProfile, getActiveProfileSnippetsDir } from '../utils/profile';
import { getWorkspaceFolder, shortenFullPath, isParentDir } from '../utils/fsInfo';
import { findAllExtensionSnipppetsByLang } from '../snippets/extension/locate';
import { getLinkedSnippets } from '../snippets/links/config';
import { getUserPath } from '../utils/context';
import { TreeItem, onDidChangeActiveTextEditor } from '../vscode';
import { context } from '../../.vitest/__mocks__/shared';

vi.mock('../snippets/loadSnippets');
vi.mock('./templates');
vi.mock('../utils/language');
vi.mock('../utils/profile');
vi.mock('../utils/fsInfo');
vi.mock('../snippets/extension/locate');
vi.mock('../snippets/links/config');
vi.mock('../utils/context');

function createTreeItem(label: string, contextValue?: string, description?: string) {
	const item = new TreeItem(label);
	item.contextValue = contextValue;
	item.description = description;
	return item;
}

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
		(loadSnippets as Mock).mockResolvedValue([
			[
				createTreeItem(
					'active.code-snippets',
					'snippet-filepath',
					'/active/profile/dir/active.code-snippets'
				),
				[createTreeItem('active-snippet-1', 'snippet')],
			],
			[
				createTreeItem(
					'disabled.code-snippets',
					'snippet-filepath',
					'/some/other/path/disabled.code-snippets'
				),
				[createTreeItem('disabled-snippet-1', 'snippet')],
			],
		]);
		(findAllExtensionSnipppetsByLang as Mock).mockResolvedValue({});
		(selectedLanguageTemplate as Mock).mockReturnValue(
			createTreeItem('typescript', 'active-snippets')
		);
		(unloadedDropdownTemplate as Mock).mockReturnValue(
			createTreeItem('Disabled Snippets', 'disabled-dropdown')
		);
		(extensionCategoryDropdown as Mock).mockReturnValue(createTreeItem('Extension Snippets'));

		provider = new SnippetViewProvider(context);
		// Wait for async constructor parts
		await new Promise(setImmediate);
	});

	it('should be created', () => {
		expect(provider).toBeDefined();
	});

	it('getTreeItem should return the element itself', () => {
		const treeItem = new TreeItem('test');
		expect(provider.getTreeItem(treeItem)).toBe(treeItem);
	});

	describe('getChildren', () => {
		it('should return root items when element is undefined', async () => {
			const children = await provider.getChildren(undefined);
			expect(children).toHaveLength(2); // selected language and disabled dropdown
			expect(selectedLanguageTemplate).toHaveBeenCalled();
			expect(unloadedDropdownTemplate).toHaveBeenCalled();
		});

		it('should return active dropdowns for "active-snippets"', async () => {
			const element = createTreeItem('typescript', 'active-snippets');
			const children = await provider.getChildren(element);
			expect(children).toHaveLength(1);
			if (children) {
				expect(children[0].label).toBe('active.code-snippets');
			}
		});

		it('should return disabled dropdowns for "disabled-dropdown"', async () => {
			const element = createTreeItem('Disabled Snippets', 'disabled-dropdown');
			const children = await provider.getChildren(element);
			expect(children).toHaveLength(1);
			if (children) {
				expect(children[0].label).toBe('disabled.code-snippets');
			}
		});

		it('should return snippets for a file path', async () => {
			const element = createTreeItem(
				'active.code-snippets',
				'snippet-filepath',
				'/active/profile/dir/active.code-snippets'
			);
			const children = await provider.getChildren(element);
			expect(children).toHaveLength(1);
			if (children) {
				expect(children[0].label).toBe('active-snippet-1');
			}
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
