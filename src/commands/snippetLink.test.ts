import { describe, it, expect, vi, beforeEach } from 'vitest';
import initSnippetLinkCommands from './snippetLink';
import { registerCommand } from '../vscode';

vi.mock('./snippetFile', () => ({
	refreshAll: vi.fn(),
}));
vi.mock('../snippets/links/commands.js', () => ({
	manageLinkLocations: vi.fn(),
}));

describe('Snippet Link Commands', () => {
	let mockContext: any;

	beforeEach(() => {
		vi.clearAllMocks();
		mockContext = { subscriptions: { push: vi.fn() } };
	});

	it('should register the link command', async () => {
		await initSnippetLinkCommands(mockContext);

		expect(registerCommand).toHaveBeenCalledTimes(1);
		expect(mockContext.subscriptions.push).toHaveBeenCalledTimes(1);
		expect(registerCommand).toHaveBeenCalledWith('snippetstudio.file.link', expect.any(Function));
	});
});
