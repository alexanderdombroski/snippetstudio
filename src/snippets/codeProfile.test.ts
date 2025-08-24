import { vi, describe, it, expect, type Mock } from 'vitest';
import { __fromBuiltIn, __fromGist, importCodeProfileSnippets } from './codeProfile';
import { showInformationMessage, showQuickPick } from '../vscode';
import fs from 'node:fs/promises';
import https from 'node:https';
import { chooseLocalGlobal } from '../utils/user';
import { getGistId } from '../git/utils';
import { context } from '../../.vitest/__mocks__/shared';
import { ClientRequest } from 'node:http';

vi.mock('../utils/jsoncFilesIO');
vi.mock('../utils/user');
vi.mock('../utils/fsInfo');
vi.mock('../git/utils.js');

describe.concurrent('codeProfile', () => {
	describe('importCodeProfileSnippets', () => {
		it('should return if no source is selected', async () => {
			(showQuickPick as Mock).mockResolvedValue(undefined);
			await importCodeProfileSnippets(context);
			expect(chooseLocalGlobal).not.toHaveBeenCalled();
		});

		it('should return if no save directory is chosen', async () => {
			(showQuickPick as Mock).mockResolvedValue({ run: () => Promise.resolve(['content']) });
			(chooseLocalGlobal as Mock).mockResolvedValue(undefined);
			await importCodeProfileSnippets(context);
			expect(fs.writeFile).not.toHaveBeenCalled();
		});
	});

	describe('profile file from gist', () => {
		it.skipIf(!process.env.GITHUB_TOKEN)(
			'should show a warning for a gist with no snippets',
			async () => {
				const gistIdWithNoSnippets = 'ddac491daeff48c5f1346ba2960462fa';
				(getGistId as Mock).mockReturnValue(gistIdWithNoSnippets);

				await __fromGist(context);

				expect(showInformationMessage).toBeCalled();
			}
		);
	});

	describe.sequential('from built in code profiles', () => {
		it('should query built in code profiles', async () => {
			(showQuickPick as Mock).mockReturnValue({ label: 'python' });

			vi.spyOn(https, 'get').mockImplementation((url: string | URL, callback: any) => {
				const mockRes = {
					statusCode: 200,
					on: (_event: string, cb: (chunk?: any) => void) => {
						cb();
					},
					resume: () => {},
				};

				// call the callback with the mocked response
				callback(mockRes);

				// return a mock request object with .on() so .on('error') works
				return {
					on: () => {},
				} as unknown as ClientRequest;
			});

			await __fromBuiltIn();
			expect(https.get).toBeCalledWith(expect.stringContaining('python'), expect.any(Function));
		});
		it('should cancel if no template is selected', async () => {
			(showQuickPick as Mock).mockReturnValue(undefined);
			vi.spyOn(https, 'get');

			await __fromBuiltIn();
			expect(https.get).not.toBeCalled();
		});
	});
});
