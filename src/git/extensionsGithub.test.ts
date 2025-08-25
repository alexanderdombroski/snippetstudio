import { beforeAll, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import * as extensionsGithub from './extensionsGithub';
import { getOctokitClient } from './octokit';
import { context } from '../../.vitest/__mocks__/shared';
import { writeSnippetFile } from '../utils/jsoncFilesIO';
import { showQuickPick } from '../vscode';
import { chooseLocalGlobal } from '../utils/user';
import type { Octokit } from '@octokit/core' with { 'resolution-mode': 'import' };

const { __fileTextRequest, __folderRequest, importBuiltinExtension } = extensionsGithub;

vi.mock('../utils/jsoncFilesIO');
vi.mock('../utils/user');

describe.skipIf(!process.env.GITHUB_TOKEN)('extensionsGithub', () => {
	let client: Octokit;
	beforeAll(async () => {
		client = await getOctokitClient(context);
	});
	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetAllMocks();
	});

	describe.concurrent('importBuiltinExtension', () => {
		it("shouldn't save anything if there is no selected file or save location", async () => {
			(showQuickPick as Mock).mockResolvedValue(undefined);
			await importBuiltinExtension(context);

			expect(writeSnippetFile).not.toBeCalled();
		});
		it("shouldn't save if there is no save location", async () => {
			(showQuickPick as Mock).mockResolvedValue(['python-ms', 'ms-dotnet']);
			(chooseLocalGlobal as Mock).mockResolvedValue(undefined);
			await importBuiltinExtension(context);

			expect(writeSnippetFile).not.toBeCalled();
		});
	});

	describe.concurrent('folderRequest', () => {
		it.concurrent('should return data if response is an array', async () => {
			const result = await __folderRequest(client, '');
			const names = result?.map((i) => i.name);
			expect(names).toContain('LICENSE.txt');
			expect(names).toContain('README.md');
		});

		it.concurrent("will throw if the path doesn't exist", async () => {
			await expect(__folderRequest(client, 'foo/bar')).rejects.toThrow();
		});
	});

	describe.concurrent('fileTextRequest', () => {
		it.concurrent('should return decoded text content', async () => {
			const result = await __fileTextRequest(client, 'LICENSE.txt');
			expect(result).toContain('MIT License');
		});
	});
});
