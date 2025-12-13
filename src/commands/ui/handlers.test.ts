import { describe, it, expect, vi, beforeAll, type Mock } from 'vitest';
import {
	openViewHandler,
	openSettingsHandler,
	openExplorerHandler,
	openTerminalHandler,
} from './handlers';
import { executeCommand, openExternal, Uri, createTerminal, ThemeIcon } from '../../vscode';
import type { SnippetCategoryDropdown } from '../../ui/templates';

beforeAll(() => {
	vi.clearAllMocks();
});

describe('handlers', () => {
	describe('openViewHandler', () => {
		it('should execute the workbench view command', () => {
			openViewHandler();
			expect(executeCommand).toBeCalledWith('workbench.view.extension.snippet-manager-view');
		});
	});

	describe('openSettingsHandler', () => {
		it('should execute the open settings command', () => {
			openSettingsHandler();
			expect(executeCommand).toBeCalledWith(
				'workbench.action.openSettings',
				'@ext:alexdombroski.snippetstudio'
			);
		});
	});

	describe('openExplorerHandler', () => {
		it('should open external with the folder path', () => {
			const mockTreeItem: SnippetCategoryDropdown = {
				label: 'Global Snippets',
				folderPath: '/path/to/snippets',
				collapsibleState: 1,
			};

			openExplorerHandler(mockTreeItem);
			expect(openExternal).toBeCalledWith(Uri.file('/path/to/snippets'));
		});
	});

	describe('openTerminalHandler', () => {
		it('should create and show a terminal with the folder path', () => {
			const mockTreeItem: SnippetCategoryDropdown = {
				label: 'Global Snippets',
				folderPath: '/path/to/snippets',
				collapsibleState: 1,
			};
			const mockTerminal = {
				show: vi.fn(),
			};
			(createTerminal as Mock).mockReturnValue(mockTerminal);

			openTerminalHandler(mockTreeItem);
			expect(createTerminal).toBeCalledWith({
				name: 'Global Snippets',
				cwd: '/path/to/snippets',
				iconPath: new ThemeIcon('repo'),
			});
			expect(mockTerminal.show).toBeCalled();
		});
	});
});
