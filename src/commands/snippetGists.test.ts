import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import initSnippetGistsCommands from './snippetGists';
import { registerCommand } from '../vscode';
import { context } from '../../.vitest/__mocks__/shared';

describe('Snippet Gists Commands', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should register all gist commands', async () => {
		vi.spyOn(context.subscriptions, 'push');
		await initSnippetGistsCommands(context);

		expect(registerCommand).toHaveBeenCalledTimes(3);
		expect(context.subscriptions.push).toHaveBeenCalledTimes(1);

		const registeredCommands = (registerCommand as Mock).mock.calls.map((call) => call[0]);
		expect(registeredCommands).toEqual(
			expect.arrayContaining([
				'snippetstudio.github.export',
				'snippetstudio.github.import',
				'snippetstudio.github.browse',
			])
		);
	});
});
