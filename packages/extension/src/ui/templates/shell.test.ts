import { expect, describe, it } from 'vitest';
import { ShellTreeItem, ShellTreeDropdown } from './shell';

describe('ShellTreeItem', () => {
	it('should correctly initialize a ShellTreeItem', () => {
		const item = new ShellTreeItem('test command', true, true, 'zsh');
		expect(item.label).toBe('test command');
		expect(item.isLocal).toBe(true);
		expect(item.runImmediately).toBe(true);
		expect(item.profile).toBe('zsh');
		expect(item.contextValue).toBe('shell-snippet');
	});
});

describe('ShellTreeDropdown', () => {
	it('should correctly initialize a ShellTreeDropdown with items', () => {
		const dropdown = new ShellTreeDropdown('Global Shell Snippets', true, 'globe', false);
		expect(dropdown.label).toBe('Global Shell Snippets');
		expect(dropdown.hasItems).toBe(true);
		expect(dropdown.isLocal).toBe(false);
		expect(dropdown.contextValue).toBe('shell-dropdown');
	});

	it('should correctly initialize a ShellTreeDropdown without items', () => {
		const dropdown = new ShellTreeDropdown('Local Shell Snippets', false, 'folder', true);
		expect(dropdown.label).toBe('Local Shell Snippets');
		expect(dropdown.hasItems).toBe(false);
		expect(dropdown.isLocal).toBe(true);
		expect(dropdown.contextValue).toBe('shell-dropdown');
	});
});
