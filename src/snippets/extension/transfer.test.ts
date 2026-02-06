import { vi, describe, it, expect, type Mock, beforeEach } from 'vitest';
import path from 'node:path';
import { extractAllSnippets, extractAndModify } from './transfer';
import { readSnippetFile, writeSnippetFile } from '../../utils/jsoncFilesIO';
import { chooseLocalGlobal, getFileName } from '../../utils/user';
import { SnippetFileTreeItem, SnippetTreeItem } from '../../ui/templates';
import { getExtensionSnippetLangs } from './locate';
import type { VSCodeSnippet, VSCodeSnippets } from '../../types';
import { findCodeSnippetsFiles, locateSnippetFiles } from '../locateSnippets';
import { showQuickPick } from '../../vscode';
import { readSnippet } from '../../snippets/updateSnippets';
import { editSnippet } from '../../ui/editor/startEditor';
import { getCurrentLanguage } from '../../utils/language';
import { getWorkspaceFolder } from '../../utils/fsInfo';
import { getActiveProfileSnippetsDir } from '../../utils/profile';

vi.mock('../../utils/jsoncFilesIO');
vi.mock('../../utils/user');
vi.mock('./locate');
vi.mock('../locateSnippets');
vi.mock('../../snippets/updateSnippets.js', () => ({
	readSnippet: vi.fn(),
}));
vi.mock('../../ui/editor/startEditor.js', () => ({
	editSnippet: vi.fn(),
}));
vi.mock('../../utils/language');
vi.mock('../../utils/profile');
vi.mock('../../utils/fsInfo');

describe('transfer extension snippets', () => {
	describe('extractAllSnippets', () => {
		const item = new SnippetFileTreeItem(0, 'label', '/snippets/test.code-snippets');

		it("should end early if user doesn't select from quickpick", async () => {
			(getFileName as Mock).mockReturnValue(undefined);
			await extractAllSnippets(item);

			(getFileName as Mock).mockReturnValue('web-dev');
			(chooseLocalGlobal as Mock).mockReturnValue(undefined);
			await extractAllSnippets(item);

			expect(writeSnippetFile).not.toBeCalled();
		});

		it('should extract all snippets from the extension', async () => {
			const snippetsPath = path.join('/user', 'snippets');
			(getFileName as Mock).mockReturnValue('web-dev');
			(chooseLocalGlobal as Mock).mockReturnValue(snippetsPath);
			(getExtensionSnippetLangs as Mock).mockReturnValue(['typescript', 'javascript']);
			const snippets: VSCodeSnippets = {
				'simple-log': {
					prefix: 'log',
					body: 'console.log($0)',
				},
			};
			(readSnippetFile as Mock).mockReturnValue(snippets);

			await extractAllSnippets(item);
			expect(writeSnippetFile).toBeCalledWith(
				path.join(snippetsPath, 'web-dev.code-snippets'),
				snippets,
				expect.any(String)
			);
		});
	});

	describe('extractAndModify', () => {
		const snippet: VSCodeSnippet = {
			prefix: 'prefix',
			body: 'body',
		};
		const item = new SnippetTreeItem('label', snippet, '/path/to/extension/snippets.code-snippets');

		beforeEach(() => {
			(getWorkspaceFolder as Mock).mockReturnValue('/workspace');
			(getActiveProfileSnippetsDir as Mock).mockReturnValue('/path');
			(findCodeSnippetsFiles as Mock).mockReturnValue([]);
		});

		it('should end early if user cancels file picking', async () => {
			(getExtensionSnippetLangs as Mock).mockResolvedValue(['typescript']);
			(locateSnippetFiles as Mock).mockResolvedValue(['/path/to/snippets.json']);
			(showQuickPick as Mock).mockResolvedValue(undefined);

			await extractAndModify(item);

			expect(editSnippet).not.toBeCalled();
		});

		it('should extract and open snippet in editor with scope', async () => {
			(getExtensionSnippetLangs as Mock).mockResolvedValue(['typescript', 'javascript']);
			(locateSnippetFiles as Mock).mockResolvedValue([]);
			(showQuickPick as Mock).mockResolvedValue({
				label: 'snippets.code-snippets',
				description: '/path/to/snippets.code-snippets',
			});
			(readSnippet as Mock).mockResolvedValue(snippet);
			(getCurrentLanguage as Mock).mockReturnValue('typescript');

			await extractAndModify(item);

			expect(editSnippet).toBeCalledWith(
				'typescript',
				expect.objectContaining({
					scope: 'typescript,javascript',
					filepath: '/path/to/snippets.code-snippets',
				}),
				'body'
			);
		});

		it('should extract and open snippet in editor without scope for language file', async () => {
			(getExtensionSnippetLangs as Mock).mockResolvedValue(['typescript']);
			(locateSnippetFiles as Mock).mockResolvedValue(['/path/to/typescript.json']);
			(showQuickPick as Mock).mockResolvedValue({
				label: 'typescript.json',
				description: '/path/to/typescript.json',
			});
			(readSnippet as Mock).mockResolvedValue(snippet);
			(getCurrentLanguage as Mock).mockReturnValue('typescript');

			await extractAndModify(item);

			expect(editSnippet).toBeCalledWith(
				'typescript',
				expect.not.objectContaining({
					scope: expect.any(String),
				}),
				'body'
			);
		});

		it('should use first lang if current lang is not in snippet langs', async () => {
			(getExtensionSnippetLangs as Mock).mockResolvedValue(['javascript', 'typescript']);
			(locateSnippetFiles as Mock).mockResolvedValue([]);
			(showQuickPick as Mock).mockResolvedValue({
				label: 'snippets.code-snippets',
				description: '/path/to/snippets.code-snippets',
			});
			(readSnippet as Mock).mockResolvedValue(snippet);
			(getCurrentLanguage as Mock).mockReturnValue('rust');

			await extractAndModify(item);

			expect(editSnippet).toBeCalledWith('javascript', expect.any(Object), 'body');
		});
	});
});
