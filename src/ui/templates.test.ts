import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import path from 'node:path';
import {
	TreePathItem,
	SnippetCategoryTreeItem,
	createTreeItemFromSnippet,
	createTreeItemFromFilePath,
	selectedLanguageTemplate,
	unloadedDropdownTemplate,
	snippetLocationTemplate,
	extensionCategoryDropdown,
	extensionTreeItems,
	extensionSnippetsTreeItems,
	snippetLocationDropdownTemplates,
} from './templates';
import type { TreeItem } from 'vscode';
import { Collapsed, Expanded, getConfiguration, None, ThemeIcon } from '../vscode';
import type { VSCodeSnippet, ExtensionSnippetFilesMap, ExtensionSnippetsMap } from '../types';
import { getWorkspaceFolder, shortenFullPath } from '../utils/fsInfo';
import {
	getActiveProfile,
	getActiveProfileSnippetsDir,
	getPathFromProfileLocation,
	getProfiles,
} from '../utils/profile';

vi.mock('../utils/fsInfo');
vi.mock('../utils/profile');

describe('UI Templates', () => {
	beforeEach(() => {
		vi.mocked(shortenFullPath).mockImplementation((p) => (p ? `~/${path.basename(p)}` : ''));
	});

	describe('createTreeItemFromSnippet', () => {
		const snippet: VSCodeSnippet = {
			prefix: 'test-prefix',
			body: 'test body',
			description: 'test description',
		};

		it('should create a TreePathItem with correct properties', () => {
			const treeItem = createTreeItemFromSnippet(
				'Test Snippet',
				snippet,
				'/path/to/snippet.code-snippets'
			);
			expect(treeItem).toBeInstanceOf(TreePathItem);
			expect(treeItem.label).toBe('test-prefix');
			expect(treeItem.collapsibleState).toBe(None);
			expect(treeItem.path).toBe('/path/to/snippet.code-snippets');
			expect(treeItem.description).toBe('Test Snippet');
			expect(treeItem.contextValue).toBe('snippet');
			expect(treeItem.tooltip).toContain('Keyword: test-prefix');
			expect(treeItem.tooltip).toContain('test body');
			expect(treeItem.tooltip).toContain('test description');
			expect(treeItem.command).toEqual({
				title: 'Show Snippet Body',
				command: 'snippetstudio.snippet.showBody',
				arguments: [treeItem],
			});
		});

		it('should handle array prefix', () => {
			const snippetWithArrayPrefix = { ...snippet, prefix: ['p1', 'p2'] };
			const treeItem = createTreeItemFromSnippet(
				'Test Snippet',
				snippetWithArrayPrefix,
				'/path/to/snippet.code-snippets'
			);
			expect(treeItem.label).toBe('p1,p2');
			expect(treeItem.tooltip).toContain('Keyword: p1,p2');
		});
	});

	describe('createTreeItemFromFilePath', () => {
		it('should create a TreePathItem for a file path', () => {
			const filepath = '/long/path/to/file.json';
			const treeItem = createTreeItemFromFilePath(filepath, Collapsed);

			expect(treeItem).toBeInstanceOf(TreePathItem);
			expect(treeItem.label).toBe('file.json');
			expect(treeItem.collapsibleState).toBe(Collapsed);
			expect(treeItem.path).toBe(filepath);
			expect(treeItem.description).toBe('~/file.json');
			expect(treeItem.tooltip).toContain(filepath);
			expect(treeItem.contextValue).toBe('snippet-filepath');
		});
	});

	describe('selectedLanguageTemplate', () => {
		it('should create a TreeItem for a specific language', () => {
			const treeItem = selectedLanguageTemplate('typescript', true);
			expect(treeItem.label).toBe('TYPESCRIPT');
			expect(treeItem.collapsibleState).toBe(Expanded);
			expect(treeItem.contextValue).toBe('active-snippets');
			expect(treeItem.iconPath).toEqual(new ThemeIcon('code'));
		});

		it('should create a TreeItem for no language', () => {
			const treeItem = selectedLanguageTemplate(undefined, false);
			expect(treeItem.label).toBe('No Language Open');
			expect(treeItem.collapsibleState).toBe(None);
		});
	});

	describe('unloadedDropdownTemplate', () => {
		it('should create a TreeItem for unloaded dropdown', () => {
			const treeItem = unloadedDropdownTemplate();
			expect(treeItem.label).toBe('Other Profiles');
			expect(treeItem.collapsibleState).toBe(Collapsed);
			expect(treeItem.contextValue).toBe('disabled-dropdown');
			expect(treeItem.iconPath).toEqual(new ThemeIcon('organization'));
		});
	});

	describe('snippetLocationTemplate', () => {
		it('should create a TreePathItem for a snippet location', () => {
			const filepath = '/path/to/file.json';
			const treeItem = snippetLocationTemplate(filepath, 'snippet-filepath', true);

			expect(treeItem).toBeInstanceOf(TreePathItem);
			expect(treeItem.label).toBe('file.json');
			expect(treeItem.collapsibleState).toBe(Collapsed);
			expect(treeItem.path).toBe(filepath);
			expect(treeItem.description).toBe('~/file.json');
			expect(treeItem.contextValue).toBe('snippet-filepath');
			expect(treeItem.command).toBeDefined();
		});

		it('should add a link icon for linked context value', () => {
			const treeItem = snippetLocationTemplate('/path/to/file.json', 'linked-snippet', false);
			expect(treeItem.iconPath).toEqual(new ThemeIcon('link'));
		});
	});

	describe('extensionCategoryDropdown', () => {
		it('should create a TreeItem for extension category', () => {
			const treeItem = extensionCategoryDropdown();
			expect(treeItem.label).toBe('Extension Snippets');
			expect(treeItem.collapsibleState).toBe(Collapsed);
			expect(treeItem.iconPath).toEqual(new ThemeIcon('extensions'));
		});
	});

	describe('extensionTreeItems', () => {
		it('should create tree items for extension files', () => {
			const fileMap: ExtensionSnippetFilesMap = {
				'ext.one': {
					name: 'Extension One',
					files: [{ language: 'typescript', path: '/path/to/ts.json' }],
				},
			};
			const result = extensionTreeItems(fileMap);
			expect(result).toHaveLength(1);
			const [dropdown, fileItems] = result[0];
			expect(dropdown.label).toBe('Extension One');
			expect(dropdown.description).toBe('ext.one');
			expect(fileItems).toHaveLength(1);
			expect(fileItems[0].label).toBe('ts.json');
		});
	});

	describe('extensionSnippetsTreeItems', () => {
		it('should create tree items for extension snippets', () => {
			const snippetsMap: ExtensionSnippetsMap = {
				'ext.one': {
					name: 'Extension One',
					snippets: [
						{
							language: 'typescript',
							path: '/path/to/ts.json',
							snippets: {
								'My Snippet': { prefix: 'ts-snip', body: 'console.log' },
							},
						},
					],
				},
			};
			const result = extensionSnippetsTreeItems(snippetsMap);
			expect(result).toHaveLength(1);
			const [extDropdown, fileDropdowns] = result[0];
			expect(extDropdown.label).toBe('Extension One');
			expect(fileDropdowns).toHaveLength(1);
			const [fileDropdown, snippetItems] = fileDropdowns[0];
			expect(fileDropdown.label).toBe('ts.json');
			expect(snippetItems).toHaveLength(1);
			expect(snippetItems[0].label).toBe('ts-snip');
			expect(snippetItems[0].description).toBe('My Snippet');
		});
	});

	describe('snippetLocationDropdownTemplates', () => {
		beforeEach(() => {
			(getConfiguration as Mock).mockReturnValue({ get: vi.fn(() => true) });
			vi.mocked(getActiveProfileSnippetsDir).mockResolvedValue('/path/to/active/snippets');
			vi.mocked(getActiveProfile).mockResolvedValue({
				name: 'Default',
				location: 'default/location',
				icon: 'person',
			});
			vi.mocked(getProfiles).mockResolvedValue([
				{ name: 'Default', location: 'default/location', icon: 'person' },
				{ name: 'Work', location: 'work/location', icon: 'briefcase' },
			]);
			vi.mocked(getWorkspaceFolder).mockReturnValue('/path/to/workspace');
			vi.mocked(getPathFromProfileLocation).mockImplementation((loc) => `/path/to/profiles/${loc}`);
		});

		it('should create dropdowns for all categories', async () => {
			const [topLevel, profileDropdowns] = await snippetLocationDropdownTemplates(
				false,
				false,
				true,
				{}
			);

			expect(topLevel.length).toBe(4); // Global, Local, Extension, Profiles
			expect(profileDropdowns.length).toBe(2);

			const global = topLevel[0] as SnippetCategoryTreeItem;
			expect(global.label).toBe('Global Snippets');
			expect(global.contextValue).toContain('global-dropdown');

			const local = topLevel[1] as SnippetCategoryTreeItem;
			expect(local.label).toBe('Local Snippets');
			expect(local.contextValue).toContain('local-dropdown');

			const extension = topLevel[2] as TreeItem;
			expect(extension.label).toBe('Extension Snippets');

			const profiles = topLevel[3] as TreeItem;
			expect(profiles.label).toBe('Profiles Snippets');

			expect(profileDropdowns[0].description).toBe('~/location');
		});

		it('should not show local snippets if no workspace folder is open', async () => {
			vi.mocked(getWorkspaceFolder).mockReturnValue(undefined);
			const [topLevel] = await snippetLocationDropdownTemplates(false, false, true, {});
			expect(topLevel.length).toBe(3); // Global, Extension, Profiles
			expect(topLevel.find((item) => item.label === 'Local Snippets')).toBeUndefined();
		});

		it('should not show extension snippets if extension_showing is false (none found)', async () => {
			const [topLevel] = await snippetLocationDropdownTemplates(false, false, false, {});
			expect(topLevel.length).toBe(3); // Global, Local, Profiles
			expect(topLevel.find((item) => item.label === 'Extension Snippets')).toBeUndefined();
		});

		it('should not create profile dropdowns if only one profile exists', async () => {
			vi.mocked(getProfiles).mockResolvedValue([{ name: 'Default', location: 'default/location' }]);
			const [topLevel, profileDropdowns] = await snippetLocationDropdownTemplates(
				false,
				false,
				true,
				{}
			);
			expect(topLevel.find((item) => item.label === 'Profiles Snippets')).toBeUndefined();
			expect(profileDropdowns.length).toBe(0);
		});
		it('should not create profile dropdowns if showProfiles config is disabled', async () => {
			vi.mocked(getProfiles).mockResolvedValue([
				{ name: 'Default', location: 'default/location' },
				{ name: 'profile2', location: 'profile2/location' },
			]);
			(getConfiguration as Mock).mockReturnValue({ get: vi.fn(() => false) });
			const [topLevel, profileDropdowns] = await snippetLocationDropdownTemplates(
				false,
				false,
				true,
				{}
			);
			expect(topLevel.find((item) => item.label === 'Profiles Snippets')).toBeUndefined();
			expect(profileDropdowns.length).toBe(0);
		});
	});
});
