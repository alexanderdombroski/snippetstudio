import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import vscode from '../../vscode';
import { getShellView } from './ShellViewProvider';
import { getShellSnippets } from './config';
import { TreeItem } from '../../../.vitest/__mocks__/vscode';
import { ShellTreeItem, ShellTreeDropdown } from '../templates';

// Mock the config and utils modules
vi.mock('./config', () => ({
	getShellSnippets: vi.fn(),
}));
vi.mock('./utils', () => ({
	getDefaultShellProfile: vi.fn(() => 'bash'),
}));

describe('ShellViewProvider', () => {
	let shellViewProvider: any;

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should return a singleton instance of ShellViewProvider', () => {
		(getShellSnippets as Mock).mockReturnValue([[], []]);
		const instance1 = getShellView();
		const instance2 = getShellView();
		expect(instance1).toBe(instance2);
		expect(vscode.window.createTreeView).toHaveBeenCalledTimes(1);
	});

	describe('ShellViewProvider instance', () => {
		beforeEach(() => {
			(getShellSnippets as Mock).mockReturnValue([[], []]);
			shellViewProvider = getShellView();
		});

		it('should refresh the view when refresh is called', () => {
			const fireSpy = vi.spyOn(shellViewProvider['_onDidChangeTreeData'], 'fire');
			shellViewProvider.refresh();
			expect(fireSpy).toHaveBeenCalledWith(null);
		});

		it('should return the element itself for getTreeItem', () => {
			const item = new TreeItem('test');
			expect(shellViewProvider.getTreeItem(item)).toBe(item);
		});

		it('should return global items when element label is "Global Shell Snippets"', () => {
			const globalSnippets = [{ command: 'global1', runImmediately: false, profile: 'bash' }];
			(getShellSnippets as Mock).mockReturnValue([globalSnippets, []]);
			shellViewProvider.refresh();
			const children = shellViewProvider.getChildren({ label: 'Global Shell Snippets' });
			expect(children.length).toBe(1);
			expect(children[0]).toBeInstanceOf(ShellTreeItem);
			expect(children[0].label).toBe('global1');
			expect(children[0].isLocal).toBe(false);
		});

		it('should return local items when element label is "Local Shell Snippets"', () => {
			const localSnippets = [{ command: 'local1', runImmediately: true, profile: 'zsh' }];
			(getShellSnippets as Mock).mockReturnValue([[], localSnippets]);
			shellViewProvider.refresh();
			const children = shellViewProvider.getChildren({ label: 'Local Shell Snippets' });
			expect(children.length).toBe(1);
			expect(children[0]).toBeInstanceOf(ShellTreeItem);
			expect(children[0].label).toBe('local1');
			expect(children[0].isLocal).toBe(true);
		});

		it('should return dropdowns when no element is provided', () => {
			(getShellSnippets as Mock).mockReturnValue([[], []]);
			shellViewProvider.refresh();
			const children = shellViewProvider.getChildren();
			expect(children.length).toBe(2);
			expect(children[0]).toBeInstanceOf(ShellTreeDropdown);
			expect(children[0].label).toBe('Global Shell Snippets');
			expect(children[1]).toBeInstanceOf(ShellTreeDropdown);
			expect(children[1].label).toBe('Local Shell Snippets');
		});

		it('should correctly set hasItems for dropdowns based on snippet presence', () => {
			(getShellSnippets as Mock).mockReturnValue([
				[{ command: 'global1', runImmediately: false, profile: 'bash' }],
				[],
			]);
			shellViewProvider.refresh();
			let children = shellViewProvider.getChildren();
			expect(children[0].hasItems).toBe(true);
			expect(children[1].hasItems).toBe(true);

			(getShellSnippets as Mock).mockReturnValue([
				[],
				[{ command: 'local1', runImmediately: true, profile: 'zsh' }],
			]);
			shellViewProvider.refresh();
			children = shellViewProvider.getChildren();
			expect(children[0].hasItems).toBe(true);
			expect(children[1].hasItems).toBe(true);
		});
	});
});
