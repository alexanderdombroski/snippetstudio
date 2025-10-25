import { beforeAll, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import * as extensionsGithub from './extensionsGithub';
import { getOctokitClient } from './octokit';
import { context } from '../../.vitest/__mocks__/shared';
import { writeSnippetFile } from '../utils/jsoncFilesIO';
import vscode, { showInformationMessage, showQuickPick } from '../vscode';
import { chooseLocalGlobal, getFileName } from '../utils/user';
import type { Octokit } from '@octokit/core' with { 'resolution-mode': 'import' };

const { _fileTextRequest, _folderRequest, importBuiltinExtension } = extensionsGithub;

vi.mock('../utils/jsoncFilesIO', async () => {
	const mod = await vi.importActual('../utils/jsoncFilesIO');
	return {
		...mod,
		writeSnippetFile: vi.fn(),
	};
});
vi.mock('../utils/user');

describe.skipIf(!process.env.GITHUB_TOKEN)('extensionsGithub', () => {
	let client: Octokit;
	beforeAll(async () => {
		client = await getOctokitClient(context);
	});
	beforeEach(() => {
		vi.resetAllMocks();
		(vscode.window.withProgress as Mock).mockResolvedValue(['cpp', 'csharp', 'html', 'java']);
	});

	describe.concurrent('importBuiltinExtension--success', () => {
		it.concurrent('should make requests for all selections', async () => {
			(showQuickPick as Mock).mockResolvedValue([{ label: 'csharp' }]);
			(chooseLocalGlobal as Mock).mockResolvedValue('example/path');
			(getFileName as Mock).mockReturnValue('ms-snippets');
			await importBuiltinExtension(context);

			expect(showInformationMessage).not.toBeCalled();
			expect(writeSnippetFile).toBeCalled();
		});
	});

	describe('importBuiltinExtension--fail', () => {
		it.concurrent(
			"shouldn't save anything if there is no selected file or save location",
			async () => {
				(showQuickPick as Mock).mockResolvedValue(undefined);
				await importBuiltinExtension(context);

				expect(writeSnippetFile).not.toBeCalled();
			}
		);
		it.concurrent("shouldn't save if there is no save location", async () => {
			(showQuickPick as Mock).mockResolvedValue([{ label: 'python-ms' }, { label: 'ms-dotnet' }]);
			(chooseLocalGlobal as Mock).mockResolvedValue(undefined);
			await importBuiltinExtension(context);

			expect(writeSnippetFile).not.toBeCalled();
		});
	});

	describe.concurrent('folderRequest', () => {
		it.concurrent('should return data if response is an array', async () => {
			const result = await _folderRequest(client, '');
			const names = result?.map((i) => i.name);
			expect(names).toContain('LICENSE.txt');
			expect(names).toContain('README.md');
		});

		it.concurrent("will throw if the path doesn't exist", async () => {
			await expect(_folderRequest(client, 'foo/bar')).rejects.toThrow();
		});
	});

	describe.concurrent('fileTextRequest', () => {
		it.concurrent('should return decoded text content', async () => {
			const result = await _fileTextRequest(client, 'LICENSE.txt');
			expect(result).toContain('MIT License');
		});
	});
});
