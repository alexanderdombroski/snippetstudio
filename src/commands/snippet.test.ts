import { describe, it, expect, vi, beforeEach } from 'vitest';
import initSnippetCommands, { defaultPrefix, getLangFromSnippetFilePath } from './snippet';
import { getConfiguration, registerCommand } from '../vscode';
import onDoubleClick from './doubleClickHandler';
import * as langUtils from '../utils/language';
import * as userUtils from '../utils/user';
import * as profileUtils from '../utils/profile';
import * as stringUtils from '../utils/string';
import type { WorkspaceConfiguration } from 'vscode';

// Mock dependencies
vi.mock('./doubleClickHandler');
vi.mock('../utils/language');
vi.mock('../utils/user');
vi.mock('../utils/profile');
vi.mock('../utils/string');

vi.mock('../ui/editor/startEditor.js', () => ({
	editSnippet: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../snippets/updateSnippets.js', () => ({
	readSnippet: vi.fn().mockResolvedValue({ prefix: 'test', body: 'test' }),
	deleteSnippet: vi.fn().mockResolvedValue(undefined),
	moveSnippet: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../snippets/keyBindings.js', () => ({
	promptAddKeybinding: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../snippets/extension/transfer.js', () => ({
	extractAndModify: vi.fn().mockResolvedValue(undefined),
}));

describe('Snippet Commands', () => {
	let mockContext: any;

	beforeEach(() => {
		vi.clearAllMocks();

		mockContext = {
			subscriptions: {
				push: vi.fn(),
			},
		};

		// Mock implementations for non-dynamically imported modules
		vi.mocked(onDoubleClick).mockImplementation((fn) => fn as any);
		vi.mocked(getConfiguration).mockReturnValue({
			get: vi.fn().mockReturnValue(''),
		} as any);
		vi.mocked(langUtils.getCurrentLanguage).mockReturnValue('typescript');
		vi.mocked(profileUtils.getGlobalLangFile).mockResolvedValue('global.code-snippets');
		vi.mocked(userUtils.getSelection).mockResolvedValue('');
		vi.mocked(langUtils.selectLanguage).mockResolvedValue('javascript');
		vi.mocked(stringUtils.snippetBodyAsString).mockReturnValue('');
		vi.mocked(userUtils.getConfirmation).mockResolvedValue(true);
	});

	it('should register all snippet commands', () => {
		initSnippetCommands(mockContext);

		expect(vi.mocked(registerCommand)).toHaveBeenCalledTimes(9);
		expect(mockContext.subscriptions.push).toHaveBeenCalledTimes(9);

		const registeredCommands = vi.mocked(registerCommand).mock.calls.map((call) => call[0]);

		expect(registeredCommands).toEqual(
			expect.arrayContaining([
				'snippetstudio.snippet.showBody',
				'snippetstudio.snippet.addGlobal',
				'snippetstudio.file.createSnippetAt',
				'snippetstudio.snippet.createGlobalLangSnippetFromSelection',
				'snippetstudio.snippet.edit',
				'snippetstudio.snippet.delete',
				'snippetstudio.snippet.move',
				'snippetstudio.snippet.addKeybinding',
				'snippetstudio.extension.modify',
			])
		);
	});

	describe('defaultPrefix', () => {
		it('should return the configured default prefix', () => {
			const mockGet = vi.fn().mockReturnValue('snip');
			vi.mocked(getConfiguration).mockReturnValue({ get: mockGet } as any);

			const prefix = defaultPrefix();

			expect(getConfiguration).toHaveBeenCalledWith('snippetstudio');
			expect(mockGet).toHaveBeenCalledWith('defaultSnippetPrefix');
			expect(prefix).toBe('snip');
		});

		it('should return an empty string if prefix is not configured', () => {
			const mockGet = vi.fn().mockReturnValue(undefined);
			vi.mocked(getConfiguration).mockReturnValue({ get: mockGet } as any);

			const prefix = defaultPrefix();
			expect(prefix).toBe('');
		});

		it('should return an empty string if configuration is not found', () => {
			vi.mocked(getConfiguration).mockReturnValue(undefined as unknown as WorkspaceConfiguration);
			const prefix = defaultPrefix();
			expect(prefix).toBe('');
		});
	});

	describe('getLangFromSnippetFilePath', () => {
		it('should return undefined for .code-snippets files', () => {
			const lang = getLangFromSnippetFilePath('/path/to/my.code-snippets');
			expect(lang).toBeUndefined();
		});

		it('should extract language from filename like typescript.json', () => {
			const lang = getLangFromSnippetFilePath('typescript.json');
			expect(lang).toBe('typescript');
		});

		it('should extract language from filename with full path', () => {
			const lang = getLangFromSnippetFilePath('/some/path/javascript.json');
			expect(lang).toBe('javascript');
		});

		it('should return undefined for files with no extension', () => {
			const lang = getLangFromSnippetFilePath('/path/to/file');
			expect(lang).toBeUndefined();
		});

		it('should return an empty string for dotfiles like .gitignore', () => {
			const lang = getLangFromSnippetFilePath('.gitignore');
			expect(lang).toBe('');
		});
	});
});
