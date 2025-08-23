import { describe, it, expect, vi, beforeEach } from 'vitest';
import initSnippetLinkCommands from './snippetLink';
import { registerCommand } from '../vscode';
import { context } from '../../.vitest/__mocks__/shared';

describe('Snippet Link Commands', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should register the link command', async () => {
		vi.spyOn(context.subscriptions, 'push');
		await initSnippetLinkCommands(context);

		expect(registerCommand).toHaveBeenCalledTimes(1);
		expect(context.subscriptions.push).toHaveBeenCalledTimes(1);
		expect(registerCommand).toHaveBeenCalledWith('snippetstudio.file.link', expect.any(Function));
	});
});
