import { describe, it, expect, vi, beforeAll, type Mock } from 'vitest';
import {
	_defaultPrefix,
	_getLangFromScope,
	_getLangFromSnippetFilePath,
	_getFileTypePattern,
	_getUriInfo,
	createGlobalSnippet,
	createSnippetAt,
	createSnippetFromSelection,
	createSnippetUsingFileExtension,
	createFileTemplate,
	editExistingSnippet,
} from './actions';
import { getConfiguration, showInformationMessage, openTextDocument } from '../../vscode';
import { getCurrentLanguage, selectLanguage } from '../../utils/language';
import { getSelection } from '../../utils/user';
import { getGlobalLangFile } from '../../utils/profile';
import type { SnippetFileTreeItem, SnippetTreeItem } from '../../ui/templates';
import { editSnippet } from './startEditor';
import { readSnippet } from '../../snippets/updateSnippets';
import path from 'node:path';
import type { Uri } from 'vscode';

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

			await createGlobalSnippet();

			expect(editSnippet).toBeCalledWith(
				'typescript',
				{
					filepath: '/path/to/typescript.json',
					snippetTitle: '',
					prefix: 'prefix',
				},
				'const x = 1;'
			);
		});

		it('should should end the operation if no language is selected', async () => {
			(getCurrentLanguage as Mock).mockReturnValue(null);

			await createGlobalSnippet();
			expect(showInformationMessage).toBeCalled();
			expect(editSnippet).not.toBeCalled();
		});

		it('should use empty string when no selection', async () => {
			(getCurrentLanguage as Mock).mockReturnValue('typescript');
			(getGlobalLangFile as Mock).mockResolvedValue('/path/to/typescript.json');
			(getSelection as Mock).mockResolvedValue(null);
			const mockGet = vi.fn().mockReturnValue('');
			(getConfiguration as Mock).mockReturnValue({ get: mockGet });

			await createGlobalSnippet();

			expect(editSnippet).toBeCalledWith(
				'typescript',
				{
					filepath: '/path/to/typescript.json',
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

			await createSnippetAt(item.filepath);

			expect(editSnippet).toBeCalledWith(
				'typescript',
				{
					filepath: '/path/to/snippets.code-snippets',
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
					filepath: '/path/to/snippets.code-snippets',
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
					filepath: '/path/to/snippets.code-snippets',
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
					filepath: '/path/to/snippets.code-snippets',
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

			await createSnippetFromSelection();

			expect(editSnippet).toBeCalledWith(
				'python',
				{
					filepath: '/path/to/python.json',
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
					filepath: '/path/to/plaintext.json',
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

			await createSnippetFromSelection();

			expect(editSnippet).toBeCalledWith(
				'python',
				{
					filepath: '/path/to/python.json',
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
			(readSnippet as Mock).mockResolvedValue({
				prefix: 'test',
				body: ['line 1', 'line 2'],
				description: 'Test snippet',
			});

			await editExistingSnippet({ ...item, path: '/path/to/snippet.code-snippets' });

			expect(readSnippet).toBeCalledWith('/path/to/snippet.code-snippets', 'mySnippet');
			expect(editSnippet).toBeCalledWith(
				'typescript',
				{
					prefix: 'test',
					body: ['line 1', 'line 2'],
					description: 'Test snippet',
					filepath: '/path/to/snippet.code-snippets',
					snippetTitle: 'mySnippet',
				},
				'line 1\nline 2'
			);
		});

		it('should fall back to plaintext when no current language', async () => {
			(getCurrentLanguage as Mock).mockReturnValue(null);
			(selectLanguage as Mock).mockResolvedValue(undefined);
			(readSnippet as Mock).mockResolvedValue({
				prefix: 'test',
				body: 'single line',
			});
			await editExistingSnippet({ ...item, path: '/path/to/snippet.code-snippets' });

			expect(editSnippet).toBeCalledWith(
				'plaintext',
				expect.objectContaining({
					filepath: '/path/to/snippet.code-snippets',
					snippetTitle: 'mySnippet',
				}),
				'single line'
			);
		});

		it('should handle missing description', async () => {
			(getCurrentLanguage as Mock).mockReturnValue('typescript');
			const { readSnippet } = await import('../../snippets/updateSnippets.js');
			(readSnippet as Mock).mockResolvedValue({
				prefix: 'test',
				body: 'code',
			});

			const itemNoDescription: SnippetTreeItem = {
				...item,
				path: 'typescript.json',
				description: 'title',
			};

			await editExistingSnippet(itemNoDescription);

			expect(readSnippet).toBeCalledWith('typescript.json', 'title');
			expect(editSnippet).toBeCalledWith(
				'typescript',
				expect.objectContaining({
					snippetTitle: 'title',
					body: 'code',
					filepath: 'typescript.json',
					prefix: 'test',
				}),
				'code'
			);
		});
	});

	describe('createSnippetUsingFileExtension', () => {
		it('should create snippet with file extension pattern', async () => {
			const fp = path.join('path', 'to', 'file.tsx');
			const snippetsFilepath = path.join('path', 'to', 'typescript.json');
			const mockUri = { path: fp } as Uri;
			const mockDoc = { languageId: 'typescript', getText: vi.fn() };
			(openTextDocument as Mock).mockResolvedValue(mockDoc);
			(getSelection as Mock).mockResolvedValue('const App = () => {};');
			(getGlobalLangFile as Mock).mockResolvedValue(snippetsFilepath);
			const mockGet = vi.fn().mockReturnValue('tsx');
			(getConfiguration as Mock).mockReturnValue({ get: mockGet });

			await createSnippetUsingFileExtension(mockUri);

			expect(editSnippet).toBeCalledWith(
				'typescript',
				expect.objectContaining({
					filepath: snippetsFilepath,
					snippetTitle: '',
					prefix: 'tsx',
					include: '*.tsx',
				}),
				'const App = () => {};'
			);
		});

		it('should use empty string for body when no selection', async () => {
			const fp = path.join('path', 'to', 'template.py');
			const snippetsFilepath = path.join('path', 'to', 'python.json');
			const mockUri = { path: fp } as Uri;
			const mockDoc = { languageId: 'python' };
			(openTextDocument as Mock).mockResolvedValue(mockDoc);
			(getSelection as Mock).mockResolvedValue(null);
			(getGlobalLangFile as Mock).mockResolvedValue(snippetsFilepath);
			const mockGet = vi.fn().mockReturnValue('');
			(getConfiguration as Mock).mockReturnValue({ get: mockGet });

			await createSnippetUsingFileExtension(mockUri);

			expect(editSnippet).toBeCalledWith(
				'python',
				expect.objectContaining({
					filepath: snippetsFilepath,
					include: '*.py',
					prefix: '',
					snippetTitle: '',
				}),
				''
			);
		});
	});

	describe('createFileTemplate', () => {
		it('should create a file template with document content', async () => {
			const fp = path.join('path', 'to', 'template.tsx');
			const mockUri = { path: fp } as Uri;
			const mockDoc = {
				languageId: 'typescript',
				getText: vi.fn().mockReturnValue('const Template = () => <div></div>;'),
			};
			(openTextDocument as Mock).mockResolvedValue(mockDoc);
			(getGlobalLangFile as Mock).mockResolvedValue('templates.json');
			const mockGet = vi.fn().mockReturnValue('');
			(getConfiguration as Mock).mockReturnValue({ get: mockGet });

			await createFileTemplate(mockUri);

			expect(mockDoc.getText).toBeCalled();
			expect(editSnippet).toBeCalledWith(
				'typescript',
				expect.objectContaining({
					filepath: 'templates.json',
					snippetTitle: 'template.tsx Template',
					prefix: '',
					include: 'template.tsx',
					isFileTemplate: true,
				}),
				'const Template = () => <div></div>;'
			);
		});

		it('should use basename as include pattern', async () => {
			const fp = path.join('some', 'nested', 'path', 'myComponent.jsx');
			const mockUri = { path: fp } as Uri;
			const mockDoc = {
				languageId: 'javascript',
				getText: vi.fn().mockReturnValue('export default function() {}'),
			};
			(openTextDocument as Mock).mockResolvedValue(mockDoc);
			(getGlobalLangFile as Mock).mockResolvedValue('templates.json');
			const mockGet = vi.fn().mockReturnValue('comp');
			(getConfiguration as Mock).mockReturnValue({ get: mockGet });

			await createFileTemplate(mockUri);

			expect(editSnippet).toBeCalledWith(
				'javascript',
				expect.objectContaining({
					snippetTitle: 'myComponent.jsx Template',
					include: 'myComponent.jsx',
					isFileTemplate: true,
					filepath: 'templates.json',
				}),
				expect.anything()
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

	describe('getFileTypePattern', () => {
		it('should extract file extension with wildcard', () => {
			const pattern = _getFileTypePattern('/path/to/file.tsx');
			expect(pattern).toBe('*.tsx');
		});

		it('should work with simple filename', () => {
			const pattern = _getFileTypePattern('component.jsx');
			expect(pattern).toBe('*.jsx');
		});

		it('should handle multiple extensions (take first dot onward)', () => {
			const pattern = _getFileTypePattern('archive.tar.gz');
			expect(pattern).toBe('*.tar.gz');
		});

		it('should return the filename when no extension', () => {
			const pattern = _getFileTypePattern('/path/to/Makefile');
			expect(pattern).toBe('Makefile');
		});

		it('should handle dotfiles', () => {
			const pattern = _getFileTypePattern('.bashrc');
			expect(pattern).toBe('*.bashrc');
		});
	});

	describe('getUriInfo', () => {
		it('should open document and return doc and language id', async () => {
			const mockUri = { path: '/path/to/file.ts' };
			const mockDoc = { languageId: 'typescript', getText: vi.fn() };
			(openTextDocument as Mock).mockResolvedValue(mockDoc);

			const result = await _getUriInfo(mockUri as any);

			expect(openTextDocument).toBeCalledWith(mockUri);
			expect(result).toEqual({ doc: mockDoc, langId: 'typescript' });
		});

		it('should work with python files', async () => {
			const mockUri = { path: '/path/to/script.py' };
			const mockDoc = { languageId: 'python' };
			(openTextDocument as Mock).mockResolvedValue(mockDoc);

			const result = await _getUriInfo(mockUri as any);

			expect(result.langId).toBe('python');
			expect(result.doc).toBe(mockDoc);
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

	describe('getLangFromScope', () => {
		it('should return undefined if no scope', async () => {
			const lang = await _getLangFromScope();
			expect(lang).toBeUndefined();
		});
		it('should return the only scope if there is only one', async () => {
			const lang = await _getLangFromScope('python');
			expect(lang).toBe('python');
		});
		it('should allow a choice if there is more than one', async () => {
			(selectLanguage as Mock).mockResolvedValue('typescript');
			const lang = await _getLangFromScope('javascript,typescript');
			expect(lang).toBe('typescript');
		});
	});
});
