import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import LocationTreeProvider, { getLocationTreeProvider } from './LocationTreeProvider';
import { locateActiveSnippetFiles } from '../snippets/locateSnippets';
import { findAllExtensionSnippetsFiles } from '../snippets/extension/locate';
import { getLinkedSnippets } from '../snippets/links/config';
import { getActiveProfile, getProfiles } from '../utils/profile';
import { TreeItem } from '../vscode';
import { getWorkspaceFolder } from '../utils/fsInfo';
import { getCurrentLanguage } from '../utils/language';

vi.mock('../snippets/locateSnippets');
vi.mock('./templates');
vi.mock('../snippets/extension/locate');
vi.mock('../snippets/links/config');
vi.mock('../utils/profile');
vi.mock('../utils/fsInfo');
vi.mock('../utils/language');

describe('ui/LocationTreeProvider', () => {
	let provider: LocationTreeProvider;

	beforeEach(async () => {
		// Mock implementations
		(getWorkspaceFolder as Mock).mockReturnValue('/local/path');
		(locateActiveSnippetFiles as Mock).mockResolvedValue([
			['/local/path/local.code-snippets'],
			['/global/path/global.code-snippets'],
		]);
		(getLinkedSnippets as Mock).mockResolvedValue({
			'global.code-snippets': ['profile1'],
		});
		(getActiveProfile as Mock).mockResolvedValue({ location: 'profile1', name: 'profile1' });
		(getProfiles as Mock).mockResolvedValue([
			{ location: 'profile1', name: 'profile1' },
			{ location: 'profile2', name: 'profile2' },
		]);
		(findAllExtensionSnippetsFiles as Mock).mockResolvedValue({
			'publisher.extension': {
				files: [{ path: '/ext/path/extension.json', language: 'typescript' }],
				name: 'test',
			},
		});
		(getCurrentLanguage as Mock).mockReturnValue('typescript');

		provider = new LocationTreeProvider();
		// The constructor calls refresh, so we need to wait for promises to resolve.
		await new Promise(setImmediate);
	});

	it('should be created', () => {
		expect(provider).toBeDefined();
	});

	it('should return a singleton instance', () => {
		const instance1 = getLocationTreeProvider();
		const instance2 = getLocationTreeProvider();
		expect(instance1).toBe(instance2);
	});

	it('getTreeItem should return the element itself', () => {
		const treeItem = new TreeItem('test');
		expect(provider.getTreeItem(treeItem)).toBe(treeItem);
	});

	describe('getChildren', () => {
		it('should return top level dropdowns for root', async () => {
			const children = await provider.getChildren();
			expect(children).toHaveLength(4);
		});
	});

	it('should debounce refresh calls', async () => {
		vi.useFakeTimers();
		const refreshSpy = vi.spyOn(provider, '_refresh');

		provider.debounceRefresh();
		provider.debounceRefresh();
		provider.debounceRefresh();

		expect(refreshSpy).not.toHaveBeenCalled();

		await vi.advanceTimersByTimeAsync(400);

		expect(refreshSpy).toHaveBeenCalledTimes(1);
		vi.useRealTimers();
	});
});
