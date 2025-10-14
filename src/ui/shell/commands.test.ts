import { describe, expect, it, vi } from 'vitest';
import { initSnippetShellCommands } from './commands';
import { context } from '../../../.vitest/__mocks__/shared';
import { registerCommand } from '../../vscode';

describe('initSnippetShellCommands', () => {
	it('should register all snippet shell commands', async () => {
		const spy = vi.spyOn(context.subscriptions, 'push');
		await initSnippetShellCommands(context);
		expect(spy).toBeCalled();
		expect(registerCommand).toBeCalledTimes(4);
	});
});
