import { describe, it, expect, vi, beforeEach } from 'vitest';
import initSnippetFileCommands from './snippetFile';
import { registerCommand } from '../vscode';
import onDoubleClick from './doubleClickHandler';

// Mock dependencies
vi.mock('./doubleClickHandler');
vi.mock('../snippets/newSnippetFile.js', () => ({
	createGlobalLangFile: vi.fn(),
	createLocalSnippetsFile: vi.fn(),
	createGlobalSnippetsFile: vi.fn(),
	exportSnippets: vi.fn(),
}));
vi.mock('../snippets/updateSnippets.js', () => ({
	deleteSnippetFile: vi.fn(),
}));
vi.mock('../snippets/extension/transfer.js', () => ({
	extractAllSnippets: vi.fn(),
}));
vi.mock('../git/extensionsGithub.js', () => ({
	importBuiltinExtension: vi.fn(),
}));
vi.mock('../snippets/codeProfile.js', () => ({
	importCodeProfileSnippets: vi.fn(),
}));

describe('Snippet File Commands', () => {
	let mockContext: any;

	beforeEach(() => {
		vi.clearAllMocks();
		mockContext = { subscriptions: { push: vi.fn() } };
		vi.mocked(onDoubleClick).mockImplementation((fn) => fn as any);
	});

	it('should register all snippet file commands', () => {
		initSnippetFileCommands(mockContext);

		expect(registerCommand).toHaveBeenCalledTimes(10);
		// some commands are registered in a single push call
		expect(mockContext.subscriptions.push).toHaveBeenCalledTimes(8);

		const registeredCommands = vi.mocked(registerCommand).mock.calls.map((call) => call[0]);
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
