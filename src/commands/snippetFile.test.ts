import { describe, it, expect, vi, type Mock } from 'vitest';
import initSnippetFileCommands from './snippetFile';
import { registerCommand } from '../vscode';
import { context } from '../../.vitest/__mocks__/shared';

describe('Snippet File Commands', () => {
	it('should register all snippet file commands', () => {
		vi.spyOn(context.subscriptions, 'push');
		initSnippetFileCommands(context);

		expect(registerCommand).toHaveBeenCalledTimes(10);
		expect(context.subscriptions.push).toHaveBeenCalledTimes(8);

		const registeredCommands = (registerCommand as Mock).mock.calls.map((call) => call[0]);
		expect(registeredCommands).toEqual(
			expect.arrayContaining([
				'snippetstudio.file.open',
				'snippetstudio.file.openFromDouble',
				'snippetstudio.file.createGlobalLang',
				'snippetstudio.file.createProjectSnippets',
				'snippetstudio.file.createGlobalSnippets',
				'snippetstudio.file.delete',
				'snippetstudio.snippet.export',
				'snippetstudio.extension.extract',
				'snippetstudio.extension.fetch',
				'snippetstudio.profile.import',
			])
		);
	});
});
