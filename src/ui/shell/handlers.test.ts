import { describe, expect, it, vi, beforeEach, type Mock } from 'vitest';
import {
	createShellSnippet,
	deleteShellSnippet,
	editShellSnippet,
	manageProfiles,
	runShellSnippet,
} from './handlers';
import { getShellSnippets, setShellSnippets } from './config';
import { getShellView, type ShellTreeItem, type ShellTreeDropdown } from './ShellViewProvider';
import vscode, {
	createQuickPick,
	createTerminal,
	executeCommand,
	getConfiguration,
	showErrorMessage,
	showInformationMessage,
	showInputBox,
	showWarningMessage,
} from '../../vscode';
import {
	findInactiveTerminal,
	getAllShellProfiles,
	getDefaultShellProfile,
	getPlatformKey,
} from './utils';
import { getConfirmation } from '../../utils/user';

vi.mock('./config');
vi.mock('../../utils/user');
vi.mock('./utils');
vi.mock('./ShellViewProvider', () => ({
	getShellView: vi.fn(() => ({
		refresh: vi.fn(),
	})),
}));

describe('Shell Command Handlers', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});
	Object.defineProperty(process, 'platform', {
		value: 'darwin',
	});

	describe('editShellSnippet', () => {
		it('should edit a shell snippet', async () => {
			(showInputBox as Mock).mockResolvedValue('ls -la');
			(getShellSnippets as Mock).mockReturnValue([
				[],
				[{ command: 'ls', runImmediately: false, profile: 'bash' }],
			]);
			const item = { label: 'ls', isLocal: true };

			await editShellSnippet(item as ShellTreeItem);

			expect(showInputBox).toHaveBeenCalled();
			const updatedSnippets = [{ command: 'ls -la', runImmediately: false, profile: 'bash' }];
			const call = (setShellSnippets as Mock).mock.calls[0];

			expect(call[0][0].command).toBe(updatedSnippets[0].command);
			expect(call[1]).toBe(vscode.ConfigurationTarget.Workspace);
			expect(showInformationMessage).toHaveBeenCalledWith('Shell snippet updated: ls -la');
			expect(getShellView).toHaveBeenCalled();
		});

		it('should show error if snippet not found', async () => {
			(showInputBox as Mock).mockResolvedValue('ls -la');
			(getShellSnippets as Mock).mockReturnValue([[], []]);
			const item = { label: 'ls', isLocal: true };

			await editShellSnippet(item as ShellTreeItem);

			expect(showErrorMessage).toHaveBeenCalledWith('Snippet not found for editing.');
			expect(setShellSnippets).not.toHaveBeenCalled();
		});

		it('should not edit if no new command is provided', async () => {
			(showInputBox as Mock).mockResolvedValue(undefined);
			const item = { label: 'ls', isLocal: true };

			await editShellSnippet(item as ShellTreeItem);

			expect(setShellSnippets).not.toHaveBeenCalled();
		});

		it('should handle errors during edit', async () => {
			(showInputBox as Mock).mockResolvedValue('ls -la');
			(getShellSnippets as Mock).mockImplementation(() => {
				throw new Error('test error');
			});
			const item = { label: 'ls', isLocal: true };

			await editShellSnippet(item as ShellTreeItem);

			expect(showErrorMessage).toHaveBeenCalledWith('Failed to edit snippet: Error: test error');
		});
	});

	describe('deleteShellSnippet', () => {
		it('should delete a shell snippet with confirmation', async () => {
			(getConfiguration as Mock).mockReturnValue({ get: () => true } as any);
			(getConfirmation as Mock).mockResolvedValue(true);
			(getShellSnippets as Mock).mockReturnValue([
				[],
				[{ command: 'ls', runImmediately: false, profile: 'bash' }],
			]);
			const item = { label: 'ls', isLocal: true };

			await deleteShellSnippet(item as ShellTreeItem);

			expect(getConfirmation).toHaveBeenCalledWith('Delete shell snippet "ls"?');
			expect(setShellSnippets).toHaveBeenCalledWith([], vscode.ConfigurationTarget.Workspace);
			expect(showInformationMessage).toHaveBeenCalledWith('Shell snippet deleted: ls');
			expect(getShellView).toHaveBeenCalled();
		});

		it('should not delete if confirmation is denied', async () => {
			(getConfiguration as Mock).mockReturnValue({ get: () => true } as any);
			(getConfirmation as Mock).mockResolvedValue(false);
			const item = { label: 'ls', isLocal: true };

			await deleteShellSnippet(item as ShellTreeItem);

			expect(setShellSnippets).not.toHaveBeenCalled();
		});

		it('should delete without confirmation if disabled', async () => {
			(getConfiguration as Mock).mockReturnValue({ get: () => false } as any);
			(getShellSnippets as Mock).mockReturnValue([
				[],
				[{ command: 'ls', runImmediately: false, profile: 'bash' }],
			]);
			const item = { label: 'ls', isLocal: true };

			await deleteShellSnippet(item as ShellTreeItem);

			expect(getConfirmation).not.toHaveBeenCalled();
			expect(setShellSnippets).toHaveBeenCalledWith([], vscode.ConfigurationTarget.Workspace);
		});
	});

	describe('runShellSnippet', () => {
		const terminal = { show: vi.fn(), sendText: vi.fn() };

		it('should run a snippet in an inactive terminal', async () => {
			(findInactiveTerminal as Mock).mockResolvedValue(terminal as any);
			const item = { label: 'echo "hello"', runImmediately: true, profile: 'bash' };

			await runShellSnippet(item as ShellTreeItem);

			expect(findInactiveTerminal).toHaveBeenCalledWith('bash');
			expect(terminal.show).toHaveBeenCalledWith(true);
			expect(terminal.sendText).toHaveBeenCalledWith('echo "hello"', true);
			expect(createTerminal).not.toHaveBeenCalled();
		});

		it('should create a new terminal if no inactive one is found', async () => {
			(findInactiveTerminal as Mock).mockResolvedValue(undefined);
			(getAllShellProfiles as Mock).mockReturnValue({
				bash: { path: '/bin/bash' },
			});
			(createTerminal as Mock).mockReturnValue(terminal as any);
			const item = { label: 'echo "hello"', runImmediately: false, profile: 'bash' };

			await runShellSnippet(item as ShellTreeItem);

			expect(createTerminal).toHaveBeenCalled();
			expect(terminal.show).toHaveBeenCalledWith(true);
			expect(terminal.sendText).toHaveBeenCalledWith('echo "hello"', false);
		});

		it('should show error on failure', async () => {
			(findInactiveTerminal as Mock).mockRejectedValue('test error');
			const item = { label: 'echo "hello"', runImmediately: false, profile: 'bash' };

			await runShellSnippet(item as ShellTreeItem);

			expect(showErrorMessage).toHaveBeenCalledWith('Failed to run command because test error');
		});

		it("should warn if a shell profile isn't recognized.", async () => {
			(findInactiveTerminal as Mock).mockReturnValue(undefined);
			const item = { label: 'echo "hello"', runImmediately: true, profile: 'MacOS Powershell+' };

			await runShellSnippet(item as ShellTreeItem);

			expect(showWarningMessage).toBeCalled();
			expect(createTerminal).not.toBeCalled();
		});
	});

	describe('createShellSnippet', () => {
		beforeEach(() => {
			(getAllShellProfiles as Mock).mockReturnValue({ bash: { path: '/bin/bash' } });
			(getDefaultShellProfile as Mock).mockReturnValue('bash');
			(getShellSnippets as Mock).mockReturnValue([[], []]);
		});

		it('should create a new shell snippet', async () => {
			(showInputBox as Mock).mockResolvedValue('npm install');

			await createShellSnippet({ isLocal: false } as ShellTreeDropdown);

			expect(showInputBox).toHaveBeenCalled();
			expect(createQuickPick).toBeCalled();
			expect(showInformationMessage).toHaveBeenCalledWith('Shell snippet added: npm install');
			expect(getShellView).toHaveBeenCalled();
		});

		it('should not create if user cancels command input', async () => {
			(showInputBox as Mock).mockResolvedValue(undefined);

			await createShellSnippet({ isLocal: false } as ShellTreeDropdown);

			expect(createQuickPick).not.toHaveBeenCalled();
			expect(setShellSnippets).not.toHaveBeenCalled();
		});

		it('should not create if user cancels quick pick', async () => {
			(showInputBox as Mock).mockResolvedValue(undefined);
			await createShellSnippet({ isLocal: false } as ShellTreeDropdown);

			expect(setShellSnippets).not.toHaveBeenCalled();
		});

		it('should show warning if default profile is not in profiles list', async () => {
			(showInputBox as Mock).mockResolvedValue('npm install');
			(getAllShellProfiles as Mock).mockReturnValue({ zsh: { path: '/bin/zsh' } }); // bash is default, but not in list

			await createShellSnippet({ isLocal: false } as ShellTreeDropdown);

			expect(showWarningMessage).toHaveBeenCalled();
		});
	});

	describe('manageProfiles', () => {
		it('should open settings', async () => {
			(getPlatformKey as Mock).mockReturnValue('linux');
			await manageProfiles();
			expect(executeCommand).toBeCalledWith(
				'workbench.action.openSettings',
				expect.stringContaining(getPlatformKey())
			);
		});
	});
});
