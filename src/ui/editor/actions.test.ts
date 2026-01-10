import { describe, it, expect, vi, beforeAll, type Mock } from 'vitest';
import {
	_defaultPrefix,
	_getLangFromSnippetFilePath,
	createGlobalSnippet,
	createSnippetAt,
	createSnippetFromSelection,
	editExistingSnippet,
} from './actions';
import { getConfiguration } from '../../vscode';
import { getCurrentLanguage, selectLanguage } from '../../utils/language';
import { getSelection } from '../../utils/user';
import { getGlobalLangFile } from '../../utils/profile';
import type { SnippetFileTreeItem, SnippetTreeItem } from '../../ui/templates';
import { editSnippet } from './startEditor';
import { readSnippet } from '../../snippets/updateSnippets';

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
	describe('createGlobalSnippet', () => {
		it('should create a global snippet', async () => {
			(getCurrentLanguage as Mock).mockReturnValue('typescript');
			(getGlobalLangFile as Mock).mockResolvedValue('/path/to/typescript.json');
			(getSelection as Mock).mockResolvedValue('const x = 1;');
			const mockGet = vi.fn().mockReturnValue('prefix');
			(getConfiguration as Mock).mockReturnValue({ get: mockGet });

			const { editSnippet } = await import('../../ui/editor/startEditor.js');

			await createGlobalSnippet();

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

			await createGlobalSnippet();

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

			await createGlobalSnippet();

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
		const item: SnippetFileTreeItem = {
			label: 'test',
			collapsibleState: 1,
			filepath: '/path/to/snippets.code-snippets',
			contextValue: 'snippet-filepath',
		};

		it('should create snippet at specified file', async () => {
			(selectLanguage as Mock).mockResolvedValue(null);
			(getCurrentLanguage as Mock).mockReturnValue('typescript');
			(getSelection as Mock).mockResolvedValue('code');
			const mockGet = vi.fn().mockReturnValue('p');
			(getConfiguration as Mock).mockReturnValue({ get: mockGet });

			const { editSnippet } = await import('../../ui/editor/startEditor.js');

			await createSnippetAt(item.filepath);

			expect(editSnippet).toBeCalledWith(
				'typescript',
				{
					filename: '/path/to/snippets.code-snippets',
					snippetTitle: '',
					prefix: 'p',
					scope: 'typescript',
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

			await createSnippetAt(item.filepath);

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

			await createSnippetAt(item.filepath);

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

			await createSnippetAt(item.filepath);

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

			await createSnippetFromSelection();

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

			await createSnippetFromSelection();

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

			await createSnippetFromSelection();

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

	describe('editExistingSnippet', () => {
		it('should edit an existing snippet', async () => {
			(getCurrentLanguage as Mock).mockReturnValue('typescript');
			const { readSnippet } = await import('../../snippets/updateSnippets.js');
			const { editSnippet } = await import('../../ui/editor/startEditor.js');
			(readSnippet as Mock).mockResolvedValue({
				prefix: 'test',
				body: ['line 1', 'line 2'],
				description: 'Test snippet',
			});

			await editExistingSnippet(item);

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
		});

		it('should use plaintext when no current language', async () => {
			(getCurrentLanguage as Mock).mockReturnValue(null);
			(readSnippet as Mock).mockResolvedValue({
				prefix: 'test',
				body: 'single line',
			});
			await editExistingSnippet(item);

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

			await editExistingSnippet(itemNoDescription);

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
});

describe('snippet handler utils', () => {
	describe('defaultPrefix', () => {
		it('should return the configured default prefix', () => {
			const mockGet = vi.fn().mockReturnValue('snip');
			(getConfiguration as Mock).mockReturnValue({ get: mockGet });

			const prefix = _defaultPrefix();

			expect(getConfiguration).toHaveBeenCalledWith('snippetstudio');
			expect(mockGet).toHaveBeenCalledWith('defaultSnippetPrefix');
			expect(prefix).toBe('snip');
		});

		it('should return an empty string if prefix is not configured', () => {
			const mockGet = vi.fn().mockReturnValue(undefined);
			(getConfiguration as Mock).mockReturnValue({ get: mockGet });

			const prefix = _defaultPrefix();
			expect(prefix).toBe('');
		});
	});

	describe('getLangFromSnippetFilePath', () => {
		it('should return undefined for .code-snippets files', () => {
			const lang = _getLangFromSnippetFilePath('/path/to/my.code-snippets');
			expect(lang).toBeUndefined();
		});

		it('should extract language from filename like typescript.json', () => {
			const lang = _getLangFromSnippetFilePath('typescript.json');
			expect(lang).toBe('typescript');
		});

		it('should extract language from filename with full path', () => {
			const lang = _getLangFromSnippetFilePath('/some/path/javascript.json');
			expect(lang).toBe('javascript');
		});

		it('should return undefined for files with no extension', () => {
			const lang = _getLangFromSnippetFilePath('/path/to/file');
			expect(lang).toBeUndefined();
		});

		it('should return an empty string for dotfiles like .gitignore', () => {
			const lang = _getLangFromSnippetFilePath('.gitignore');
			expect(lang).toBe('');
		});
	});
});
