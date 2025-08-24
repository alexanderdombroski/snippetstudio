import { describe, it, expect, vi, type Mock } from 'vitest';
import initSnippetUICommands from './snippetUI';
import { registerCommand, showInformationMessage } from '../vscode';
import type { MessageItem } from 'vscode';
import { context } from '../../.vitest/__mocks__/shared';

const mockCommandMap = {};

describe('Snippet UI Commands', () => {
	it('should register all UI commands', () => {
		vi.spyOn(context.subscriptions, 'push');
		initSnippetUICommands(context, mockCommandMap);

		expect(registerCommand).toHaveBeenCalledTimes(6);
		expect(context.subscriptions.push).toHaveBeenCalledTimes(5);

		const registeredCommands = (registerCommand as Mock).mock.calls.map((call) => call[0]);
		expect(registeredCommands).toEqual(
			expect.arrayContaining([
				'snippetstudio.openView',
				'snippetstudio.openSettings',
				'snippetstudio.refresh',
				'snippetstudio.refreshLocations',
				'snippetstudio.file.open.Explorer',
				'snippetstudio.file.open.Terminal',
			])
		);
	});

	it('should prompt walkthrough if not completed', async () => {
		(context.globalState.get as Mock).mockReturnValue(false); // Show walkthrough
		vi.mocked(showInformationMessage).mockResolvedValue(
			'Open Walkthroughs' as unknown as MessageItem
		);

		initSnippetUICommands(context, mockCommandMap);

		// Need to wait for the async IIFE to resolve
		await new Promise(process.nextTick);

		expect(showInformationMessage).toHaveBeenCalled();
		expect(context.globalState.update).toHaveBeenCalledWith('walkthrough-completed', true);
	});

	it('should not update globalState if walkthrough is dismissed', async () => {
		(context.globalState.get as Mock).mockReturnValue(false);
		vi.mocked(showInformationMessage).mockResolvedValue(undefined);

		initSnippetUICommands(context, mockCommandMap);

		expect(showInformationMessage).toHaveBeenCalled();
		expect(context.globalState.update).not.toHaveBeenCalled();
	});
});
