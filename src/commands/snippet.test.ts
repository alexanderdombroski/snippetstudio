import { describe, it, expect, vi, type Mock } from 'vitest';
import initSnippetCommands, { defaultPrefix, getLangFromSnippetFilePath } from './snippet';
import { getConfiguration, registerCommand } from '../vscode';
import { context } from '../../.vitest/__mocks__/shared';

describe('Snippet Commands', () => {
	it('should register all snippet commands', () => {
		vi.spyOn(context.subscriptions, 'push');
		initSnippetCommands(context);

		expect(registerCommand).toHaveBeenCalledTimes(9);
		expect(context.subscriptions.push).toHaveBeenCalledTimes(9);

		const registeredCommands = (registerCommand as Mock<typeof registerCommand>).mock.calls.map(
			(call: any[]) => call[0]
		);

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
			(getConfiguration as Mock).mockReturnValue({ get: mockGet });

			const prefix = defaultPrefix();

			expect(getConfiguration).toHaveBeenCalledWith('snippetstudio');
			expect(mockGet).toHaveBeenCalledWith('defaultSnippetPrefix');
			expect(prefix).toBe('snip');
		});

		it('should return an empty string if prefix is not configured', () => {
			const mockGet = vi.fn().mockReturnValue(undefined);
			(getConfiguration as Mock).mockReturnValue({ get: mockGet });

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
