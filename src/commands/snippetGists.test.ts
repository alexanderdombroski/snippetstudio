import { describe, it, expect, vi, beforeEach } from 'vitest';
import initSnippetGistsCommands from './snippetGists';
import { registerCommand } from '../vscode';

vi.mock('../git/snippetGists.js', () => ({
	createGist: vi.fn(),
	importGist: vi.fn(),
}));

describe('Snippet Gists Commands', () => {
	let mockContext: any;

	beforeEach(() => {
		vi.clearAllMocks();
		mockContext = { subscriptions: { push: vi.fn() } };
	});

	it('should register all gist commands', async () => {
		await initSnippetGistsCommands(mockContext);

		expect(registerCommand).toHaveBeenCalledTimes(3);
		expect(mockContext.subscriptions.push).toHaveBeenCalledTimes(1);

		const registeredCommands = vi.mocked(registerCommand).mock.calls.map((call) => call[0]);
		expect(registeredCommands).toEqual(
			expect.arrayContaining([
				'snippetstudio.github.export',
				'snippetstudio.github.import',
				'snippetstudio.github.browse',
			])
		);
	});
});
