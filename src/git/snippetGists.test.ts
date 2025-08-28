import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { createGist, importGist } from './snippetGists';
import { context } from '../../.vitest/__mocks__/shared';
import { chooseLocalGlobal, getFileName, getSavePathFromDialog } from '../utils/user';
import { mergeSnippetFiles } from '../snippets/newSnippetFile';
import type { VSCodeSnippets } from '../types';
import { getConfiguration, showInformationMessage, showInputBox } from '../vscode';
import fs from 'node:fs/promises';
import * as octo from './octokit';
import type { Octokit } from '@octokit/core' with { 'resolution-mode': 'import' };
import { getGistId } from './utils';

vi.mock('../utils/user');
vi.mock('./utils');
vi.mock('../snippets/newSnippetFile');

const snippets: VSCodeSnippets = {
	log: {
		prefix: 'log',
		body: 'console.log($1)',
	},
};

describe('snippetGists', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.restoreAllMocks();
	});

	describe('createGist', () => {
		beforeEach(() => {
			vi.spyOn(octo, 'getOctokitClient').mockResolvedValue({
				request: vi.fn().mockResolvedValue({ data: { html_url: 'http://fake.gist' } }),
			} as unknown as Octokit);
		});
		it('should end early if user escapes quickpicks', async () => {
			(getFileName as Mock).mockReturnValue(undefined);
			await createGist(context);

			(getFileName as Mock).mockReturnValue('backup');
			(mergeSnippetFiles as Mock).mockReturnValue(undefined);
			await createGist(context);

			expect(showInputBox).not.toBeCalled();
		});
		it('should send out an octokit request', async () => {
			(getFileName as Mock).mockReturnValue('backup');
			(mergeSnippetFiles as Mock).mockReturnValue(snippets);
			(showInputBox as Mock).mockReturnValue(undefined);

			await createGist(context);

			expect(showInformationMessage).toBeCalled();
		});
	});

	describe.skipIf(!process.env.GITHUB_TOKEN)('importGist', () => {
		const gistIdWithNoSnippets = 'ddac491daeff48c5f1346ba2960462fa';
		it('should end command early if no gistId or save location given', async () => {
			const spy = vi.spyOn(octo, 'getOctokitClient');

			(getGistId as Mock).mockReturnValue(undefined);
			await importGist(context);

			(getGistId as Mock).mockReturnValue(gistIdWithNoSnippets);
			(chooseLocalGlobal as Mock).mockReturnValue(undefined);
			await importGist(context);

			expect(spy).not.toBeCalled();
		});

		it('only saves .code snippets files if configured to do so', async () => {
			const savePath = '/downloads';

			const gistIdWithNoSnippets = 'ddac491daeff48c5f1346ba2960462fa';
			(getGistId as Mock).mockReturnValue(gistIdWithNoSnippets);
			(chooseLocalGlobal as Mock).mockReturnValue(savePath);
			(getSavePathFromDialog as Mock).mockResolvedValue(savePath);
			(getConfiguration as Mock).mockReturnValue({ get: vi.fn(() => true) });

			const client = await octo.getOctokitClient(context);
			const spy = vi.spyOn(client, 'request');
			vi.spyOn(octo, 'getOctokitClient').mockResolvedValue(client);

			await importGist(context);

			expect(spy).toBeCalledWith('GET /gists/{gist_id}', { gist_id: gistIdWithNoSnippets });
			expect(fs.writeFile).not.toBeCalled();
			expect(showInformationMessage).toBeCalledWith(expect.stringContaining('Saved 0 files'));
		});
	});
});
