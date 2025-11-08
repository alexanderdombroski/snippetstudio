import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { initSnippetShellCommands } from './commands';
import { context } from '../../../.vitest/__mocks__/shared';
import { registerCommand } from '../../vscode';
import { getShellSnippets } from './config';
import { getShellView } from './ShellViewProvider';

vi.mock('./config');
vi.mock('./ShellViewProvider');

describe('initSnippetShellCommands', () => {
	beforeEach(() => {
		(getShellSnippets as Mock).mockReturnValue([]);
	});

	it('should register all snippet shell commands', async () => {
		const spy = vi.spyOn(context.subscriptions, 'push');
		await initSnippetShellCommands(context);
		expect(spy).toBeCalled();
		expect(registerCommand).toBeCalledTimes(6);
	});

	it("should lazy load the view logic if there's snippets", async () => {
		await initSnippetShellCommands(context);
		expect(getShellView).not.toBeCalled();
		(getShellSnippets as Mock).mockReturnValue([
			[{ command: 'echo "Hello"', runImmediately: false, profile: 'bash' }],
			[],
		]);
		await initSnippetShellCommands(context);
		expect(getShellView).toBeCalled();
	});
});
