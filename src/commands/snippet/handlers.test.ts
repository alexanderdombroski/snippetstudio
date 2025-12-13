import { describe, it, expect, vi, beforeAll, type Mock } from 'vitest';
import {
	defaultPrefix,
	getLangFromSnippetFilePath,
	showBodyHandler,
	addGlobalHandler,
	createAtHandler,
	fromSelectionHandler,
	editHandler,
	deleteSnippetHandler,
	moveHandler,
	addKeybindingHandler,
} from './handlers';
import { getConfiguration } from '../../vscode';
import { getCurrentLanguage, selectLanguage } from '../../utils/language';
import { getConfirmation, getSelection } from '../../utils/user';
import { getGlobalLangFile } from '../../utils/profile';
import type { SnippetFileTreeItem, SnippetTreeItem } from '../../ui/templates';
import { promptAddKeybinding } from '../../snippets/keyBindings';
import { deleteSnippet, moveSnippet } from '../../snippets/updateSnippets';
import { refreshAll } from '../utils';

vi.mock('../utils');
vi.mock('../../utils/language');
vi.mock('../../utils/user');
vi.mock('../../utils/profile');
vi.mock('../../ui/peeker/peek.js');
vi.mock('../../ui/editor/startEditor.js');
vi.mock('../../snippets/updateSnippets.js');
vi.mock('../../snippets/keyBindings.js');

beforeAll(() => {
	vi.clearAllMocks();
});

const item: SnippetTreeItem = {
	label: 'test',
	collapsibleState: 1,
	path: '/path/to/snippet.json',
	description: 'mySnippet',
	contextValue: 'snippet',
};

describe('handlers', () => {
	describe('showBodyHandler', () => {
		it('should peek at snippet', async () => {
			const { peekAtSnippet } = await import('../../ui/peeker/peek.js');

			await showBodyHandler(item);
			expect(peekAtSnippet).toBeCalledWith('/path/to/snippet.json', 'mySnippet');
		});
	});

	describe('addGlobalHandler', () => {
		it('should create a global snippet', async () => {
			(getCurrentLanguage as Mock).mockReturnValue('typescript');
			(getGlobalLangFile as Mock).mockResolvedValue('/path/to/typescript.json');
			(getSelection as Mock).mockResolvedValue('const x = 1;');
			const mockGet = vi.fn().mockReturnValue('prefix');
			(getConfiguration as Mock).mockReturnValue({ get: mockGet });

			const { editSnippet } = await import('../../ui/editor/startEditor.js');

			await addGlobalHandler();

			expect(editSnippet).toBeCalledWith(
				'typescript',
				{
					filename: '/path/to/typescript.json',
					snippetTitle: '',
					prefix: 'prefix',
				},
				'const x = 1;'
			);
		});

		it('should use plaintext when no current language', async () => {
			(getCurrentLanguage as Mock).mockReturnValue(null);
			(getGlobalLangFile as Mock).mockResolvedValue('/path/to/plaintext.json');
			(getSelection as Mock).mockResolvedValue('text');
			const mockGet = vi.fn().mockReturnValue('');
			(getConfiguration as Mock).mockReturnValue({ get: mockGet });

			const { editSnippet } = await import('../../ui/editor/startEditor.js');

			await addGlobalHandler();

			expect(editSnippet).toBeCalledWith(
				'plaintext',
				{
					filename: '/path/to/plaintext.json',
					snippetTitle: '',
					prefix: '',
				},
				'text'
			);
		});

		it('should use empty string when no selection', async () => {
			(getCurrentLanguage as Mock).mockReturnValue('typescript');
			(getGlobalLangFile as Mock).mockResolvedValue('/path/to/typescript.json');
			(getSelection as Mock).mockResolvedValue(null);
			const mockGet = vi.fn().mockReturnValue('');
			(getConfiguration as Mock).mockReturnValue({ get: mockGet });

			const { editSnippet } = await import('../../ui/editor/startEditor.js');

			await addGlobalHandler();

			expect(editSnippet).toBeCalledWith(
				'typescript',
				{
					filename: '/path/to/typescript.json',
					snippetTitle: '',
					prefix: '',
				},
				''
			);
		});
	});

	describe('createSnippetAtHandler', () => {
		it('should create snippet at specified file', async () => {
			(selectLanguage as Mock).mockResolvedValue(null);
			(getCurrentLanguage as Mock).mockReturnValue('typescript');
			(getSelection as Mock).mockResolvedValue('code');
			const mockGet = vi.fn().mockReturnValue('p');
			(getConfiguration as Mock).mockReturnValue({ get: mockGet });

			const { editSnippet } = await import('../../ui/editor/startEditor.js');
			const item: SnippetFileTreeItem = {
				label: 'test',
				collapsibleState: 1,
				filepath: '/path/to/javascript.json',
				contextValue: 'snippet-filepath',
			};

			await createAtHandler(item);

			expect(editSnippet).toBeCalledWith(
				'javascript',
				{
					filename: '/path/to/javascript.json',
					snippetTitle: '',
					prefix: 'p',
					scope: 'javascript',
				},
				'code'
			);
		});

		it('should use selected language when file does not have language in name', async () => {
			(selectLanguage as Mock).mockResolvedValue('python');
			(getCurrentLanguage as Mock).mockReturnValue('typescript');
			(getSelection as Mock).mockResolvedValue('code');
			const mockGet = vi.fn().mockReturnValue('');
			(getConfiguration as Mock).mockReturnValue({ get: mockGet });

			const { editSnippet } = await import('../../ui/editor/startEditor.js');
			const item: SnippetFileTreeItem = {
				label: 'test',
				collapsibleState: 1,
				filepath: '/path/to/snippets.code-snippets',
				contextValue: 'snippet-filepath',
			};

			await createAtHandler(item);

			expect(editSnippet).toBeCalledWith(
				'python',
				{
					filename: '/path/to/snippets.code-snippets',
					snippetTitle: '',
					prefix: '',
					scope: 'python',
				},
				'code'
			);
		});

		it('should use current language when no selection and file has no language', async () => {
			(selectLanguage as Mock).mockResolvedValue(null);
			(getCurrentLanguage as Mock).mockReturnValue('typescript');
			(getSelection as Mock).mockResolvedValue('code');
			const mockGet = vi.fn().mockReturnValue('');
			(getConfiguration as Mock).mockReturnValue({ get: mockGet });

			const { editSnippet } = await import('../../ui/editor/startEditor.js');
			const item: SnippetFileTreeItem = {
				label: 'test',
				collapsibleState: 1,
				filepath: '/path/to/snippets.code-snippets',
				contextValue: 'snippet-filepath',
			};

			await createAtHandler(item);

			expect(editSnippet).toBeCalledWith(
				'typescript',
				{
					filename: '/path/to/snippets.code-snippets',
					snippetTitle: '',
					prefix: '',
					scope: 'typescript',
				},
				'code'
			);
		});

		it('should use plaintext as final fallback', async () => {
			(selectLanguage as Mock).mockResolvedValue(null);
			(getCurrentLanguage as Mock).mockReturnValue(null);
			(getSelection as Mock).mockResolvedValue(null);
			const mockGet = vi.fn().mockReturnValue('');
			(getConfiguration as Mock).mockReturnValue({ get: mockGet });

			const { editSnippet } = await import('../../ui/editor/startEditor.js');
			const item: SnippetFileTreeItem = {
				label: 'test',
				collapsibleState: 1,
				filepath: '/path/to/snippets.code-snippets',
				contextValue: 'snippet-filepath',
			};

			await createAtHandler(item);

			expect(editSnippet).toBeCalledWith(
				'plaintext',
				{
					filename: '/path/to/snippets.code-snippets',
					snippetTitle: '',
					prefix: '',
					scope: 'plaintext',
				},
				''
			);
		});
	});

	describe('createGlobalLangSnippetFromSelectionHandler', () => {
		it('should create global language snippet from selection', async () => {
			(getCurrentLanguage as Mock).mockReturnValue('python');
			(getGlobalLangFile as Mock).mockResolvedValue('/path/to/python.json');
			(getSelection as Mock).mockResolvedValue('print("hello")');
			const mockGet = vi.fn().mockReturnValue('');
			(getConfiguration as Mock).mockReturnValue({ get: mockGet });

			const { editSnippet } = await import('../../ui/editor/startEditor.js');

			await fromSelectionHandler();

			expect(editSnippet).toBeCalledWith(
				'python',
				{
					filename: '/path/to/python.json',
					snippetTitle: '',
					prefix: '',
				},
				'print("hello")'
			);
		});

		it('should use plaintext when no current language', async () => {
			(getCurrentLanguage as Mock).mockReturnValue(null);
			(getGlobalLangFile as Mock).mockResolvedValue('/path/to/plaintext.json');
			(getSelection as Mock).mockResolvedValue('text');
			const mockGet = vi.fn().mockReturnValue('');
			(getConfiguration as Mock).mockReturnValue({ get: mockGet });

			const { editSnippet } = await import('../../ui/editor/startEditor.js');

			await fromSelectionHandler();

			expect(editSnippet).toBeCalledWith(
				'plaintext',
				{
					filename: '/path/to/plaintext.json',
					snippetTitle: '',
					prefix: '',
				},
				'text'
			);
		});

		it('should use empty string when no selection', async () => {
			(getCurrentLanguage as Mock).mockReturnValue('python');
			(getGlobalLangFile as Mock).mockResolvedValue('/path/to/python.json');
			(getSelection as Mock).mockResolvedValue(null);
			const mockGet = vi.fn().mockReturnValue('');
			(getConfiguration as Mock).mockReturnValue({ get: mockGet });

			const { editSnippet } = await import('../../ui/editor/startEditor.js');

			await fromSelectionHandler();

			expect(editSnippet).toBeCalledWith(
				'python',
				{
					filename: '/path/to/python.json',
					snippetTitle: '',
					prefix: '',
				},
				''
			);
		});
	});

	describe('editHandler', () => {
		it('should edit an existing snippet', async () => {
			(getCurrentLanguage as Mock).mockReturnValue('typescript');
			const { readSnippet } = await import('../../snippets/updateSnippets.js');
			const { editSnippet } = await import('../../ui/editor/startEditor.js');
			(readSnippet as Mock).mockResolvedValue({
				prefix: 'test',
				body: ['line 1', 'line 2'],
				description: 'Test snippet',
			});

			await editHandler(item);

			expect(readSnippet).toBeCalledWith('/path/to/snippet.json', 'mySnippet');
			expect(editSnippet).toBeCalledWith(
				'typescript',
				{
					prefix: 'test',
					body: ['line 1', 'line 2'],
					description: 'Test snippet',
					filename: '/path/to/snippet.json',
					snippetTitle: 'mySnippet',
				},
				'line 1\nline 2'
			);
			expect(refreshAll).toBeCalled();
		});

		it('should use plaintext when no current language', async () => {
			(getCurrentLanguage as Mock).mockReturnValue(null);
			const { readSnippet } = await import('../../snippets/updateSnippets.js');
			const { editSnippet } = await import('../../ui/editor/startEditor.js');
			(readSnippet as Mock).mockResolvedValue({
				prefix: 'test',
				body: 'single line',
			});
			await editHandler(item);

			expect(editSnippet).toBeCalledWith(
				'plaintext',
				expect.objectContaining({
					filename: '/path/to/snippet.json',
					snippetTitle: 'mySnippet',
				}),
				'single line'
			);
		});

		it('should handle missing description', async () => {
			(getCurrentLanguage as Mock).mockReturnValue('typescript');
			const { readSnippet } = await import('../../snippets/updateSnippets.js');
			const { editSnippet } = await import('../../ui/editor/startEditor.js');
			(readSnippet as Mock).mockResolvedValue({
				prefix: 'test',
				body: 'code',
			});

			const itemNoDescription: SnippetTreeItem = {
				...item,
				description: 'title',
			};

			await editHandler(itemNoDescription);

			expect(readSnippet).toBeCalledWith('/path/to/snippet.json', 'title');
			expect(editSnippet).toBeCalledWith(
				'typescript',
				expect.objectContaining({
					snippetTitle: 'title',
					body: 'code',
					filename: '/path/to/snippet.json',
					prefix: 'test',
				}),
				'code'
			);
		});
	});

	describe('deleteSnippetHandler', () => {
		it('should delete a snippet when confirmed', async () => {
			const mockGet = vi.fn().mockReturnValue(true);
			(getConfiguration as Mock).mockReturnValue({ get: mockGet });
			(getConfirmation as Mock).mockResolvedValue(true);

			const { deleteSnippet } = await import('../../snippets/updateSnippets.js');

			await deleteSnippetHandler(item);

			expect(getConfirmation).toBeCalledWith('Are you sure you want to delete "mySnippet"?');
			expect(deleteSnippet).toBeCalledWith('/path/to/snippet.json', 'mySnippet');
			expect(refreshAll).toBeCalled();
		});

		it('should not delete snippet when not confirmed', async () => {
			const mockGet = vi.fn().mockReturnValue(true);
			(getConfiguration as Mock).mockReturnValue({ get: mockGet });
			(getConfirmation as Mock).mockResolvedValue(false);

			await deleteSnippetHandler(item);

			expect(deleteSnippet).not.toBeCalled();
		});

		it('should delete without confirmation when confirmSnippetDeletion is false', async () => {
			const mockGet = vi.fn().mockReturnValue(false);
			(getConfiguration as Mock).mockReturnValue({ get: mockGet });

			await deleteSnippetHandler(item);

			expect(getConfirmation).not.toBeCalled();
			expect(deleteSnippet).toBeCalledWith('/path/to/snippet.json', 'mySnippet');
			expect(refreshAll).toBeCalled();
		});
	});

	describe('moveHandler', () => {
		it('should move a snippet', async () => {
			await moveHandler(item);
			expect(moveSnippet).toBeCalledWith(item);
			expect(refreshAll).toBeCalled();
		});
	});

	describe('addKeybindingHandler', () => {
		it('should prompt to add a keybinding', async () => {
			await addKeybindingHandler(item);
			expect(promptAddKeybinding).toBeCalledWith(item);
		});
	});
});

describe('snippet handler utils', () => {
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
