// import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
// import LocationTreeProvider from './LocationTreeProvider';
// import { locateAllSnippetFiles } from '../snippets/locateSnippets';
// import {
// 	TreePathItem,
// 	snippetLocationTemplate,
// 	extensionTreeItems,
// 	snippetLocationDropdownTemplates,
// } from './templates';
// import { findAllExtensionSnippetsFiles } from '../snippets/extension/locate';
// import { getLinkedSnippets } from '../snippets/links/config';
// import { getActiveProfile } from '../utils/profile';
// import { TreeItem } from '../vscode';
// import { context } from '../../.vitest/__mocks__/shared';

// vi.mock('../snippets/locateSnippets');
// vi.mock('./templates');
// vi.mock('../snippets/extension/locate');
// vi.mock('../snippets/links/config');
// vi.mock('../utils/profile');

// function createTreeItem(label: string, contextValue?: string, description?: string) {
// 	const item = new TreePathItem(label, 0, description ?? '');
// 	item.contextValue = contextValue;
// 	return item;
// }

// describe('ui/LocationTreeProvider', () => {
// 	let provider: LocationTreeProvider;

// 	beforeEach(async () => {
// 		// Mock implementations
// 		(locateAllSnippetFiles as Mock).mockResolvedValue([
// 			['/local/path/local.code-snippets'],
// 			['/global/path/global.code-snippets'],
// 			{ profile1: ['/profile1/path/profile.code-snippets'] },
// 		]);
// 		(getLinkedSnippets as Mock).mockResolvedValue({
// 			'global.code-snippets': ['profile1'],
// 		});
// 		(getActiveProfile as Mock).mockResolvedValue({ location: 'profile1', name: 'profile1' });
// 		(findAllExtensionSnippetsFiles as Mock).mockResolvedValue(
// 			new Map([['publisher.extension', ['/ext/path/extension.json']]])
// 		);

// 		(snippetLocationTemplate as Mock).mockImplementation((p, cv) =>
// 			createTreeItem(p as string, cv, p as string)
// 		);
// 		(extensionTreeItems as Mock).mockReturnValue([
// 			[
// 				createTreeItem('publisher.extension', 'extension-dropdown', 'publisher.extension'),
// 				[createTreeItem('extension.json', 'snippet-filepath', '/ext/path/extension.json')],
// 			],
// 		]);
// 		(snippetLocationDropdownTemplates as Mock).mockResolvedValue([
// 			[
// 				createTreeItem('Global Snippets', 'global-dropdown'),
// 				createTreeItem('Local Snippets', 'local-dropdown'),
// 				createTreeItem('Profile Snippets', 'profile-dropdown'),
// 				createTreeItem('Extension Snippets', 'extension-dropdown-container'),
// 			],
// 			[createTreeItem('profile1', 'category-dropdown', 'profile1')],
// 		]);

// 		provider = new LocationTreeProvider(context);
// 		// The constructor calls refresh, so we need to wait for promises to resolve.
// 		await new Promise(setImmediate);
// 	});

// 	it('should be created', () => {
// 		expect(provider).toBeDefined();
// 	});

// 	it('getTreeItem should return the element itself', () => {
// 		const treeItem = new TreeItem('test');
// 		expect(provider.getTreeItem(treeItem)).toBe(treeItem);
// 	});

// 	describe('getChildren', () => {
// 		it('should return top level dropdowns for root', async () => {
// 			const children = await provider.getChildren(undefined);
// 			expect(children).toHaveLength(4);
// 			expect(snippetLocationDropdownTemplates).toHaveBeenCalled();
// 		});
// 	});

// 	it('should debounce refresh calls', async () => {
// 		vi.useFakeTimers();
// 		const refreshSpy = vi.spyOn(provider, '_refresh');

// 		provider.debounceRefresh();
// 		provider.debounceRefresh();
// 		provider.debounceRefresh();

// 		expect(refreshSpy).not.toHaveBeenCalled();

// 		await vi.advanceTimersByTimeAsync(400);

// 		expect(refreshSpy).toHaveBeenCalledTimes(1);
// 		vi.useRealTimers();
// 	});
// });
