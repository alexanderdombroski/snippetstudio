import { describe, it, expect, vi, beforeEach } from 'vitest';
import initSnippetUICommands from './snippetUI';
import { registerCommand, showInformationMessage } from '../vscode';
import type { MessageItem } from 'vscode';

describe('Snippet UI Commands', () => {
	let mockContext: any;
	let mockCommandMap: any;

	beforeEach(() => {
		vi.clearAllMocks();
		mockContext = {
			subscriptions: { push: vi.fn() },
			globalState: { get: vi.fn(), update: vi.fn() },
		};
		mockCommandMap = {
			'snippetstudio.refresh': vi.fn(),
			'snippetstudio.refreshLocations': vi.fn(),
		};
	});

	it('should register all UI commands', () => {
		mockContext.globalState.get.mockReturnValue(true); // Don't show walkthrough
		initSnippetUICommands(mockContext, mockCommandMap);

		expect(registerCommand).toHaveBeenCalledTimes(6);
		expect(mockContext.subscriptions.push).toHaveBeenCalledTimes(5);

		const registeredCommands = vi.mocked(registerCommand).mock.calls.map((call) => call[0]);
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
		mockContext.globalState.get.mockReturnValue(false); // Show walkthrough
		vi.mocked(showInformationMessage).mockResolvedValue(
			'Open Walkthroughs' as unknown as MessageItem
		);

		initSnippetUICommands(mockContext, mockCommandMap);

		// Need to wait for the async IIFE to resolve
		await new Promise(process.nextTick);

		expect(showInformationMessage).toHaveBeenCalled();
		expect(mockContext.globalState.update).toHaveBeenCalledWith('walkthrough-completed', true);
	});

	it('should not update globalState if walkthrough is dismissed', async () => {
		mockContext.globalState.get.mockReturnValue(false);
		vi.mocked(showInformationMessage).mockResolvedValue(undefined);

		initSnippetUICommands(mockContext, mockCommandMap);

		await new Promise(process.nextTick);

		expect(showInformationMessage).toHaveBeenCalled();
		expect(mockContext.globalState.update).not.toHaveBeenCalled();
	});
});
