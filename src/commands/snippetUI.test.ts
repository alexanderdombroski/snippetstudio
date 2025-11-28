import { describe, it, expect, vi, type Mock } from 'vitest';
import initSnippetUICommands from './snippetUI';
import { registerCommand } from '../vscode';
import { context } from '../../.vitest/__mocks__/shared';

const mockCommandMap = {};

describe('Snippet UI Commands', () => {
	it('should register all UI commands', () => {
		vi.spyOn(context.subscriptions, 'push');
		initSnippetUICommands(context, mockCommandMap);

		expect(registerCommand).toHaveBeenCalledTimes(7);
		expect(context.subscriptions.push).toHaveBeenCalledTimes(6);

		const registeredCommands = (registerCommand as Mock).mock.calls.map((call) => call[0]);
		expect(registeredCommands).toEqual(
			expect.arrayContaining([
				'snippetstudio.openView',
				'snippetstudio.openSettings',
				'snippetstudio.refresh',
				'snippetstudio.refreshLocations',
				'snippetstudio.file.listSnippets',
				'snippetstudio.file.open.Explorer',
				'snippetstudio.file.open.Terminal',
			])
		);
	});
});
