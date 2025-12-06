import { vi, describe, it, expect, type Mock } from 'vitest';
import { _fromBuiltIn, _fromGist, _fromUrl, importCodeProfileSnippets } from './codeProfile';
import { showInformationMessage, showInputBox, showQuickPick } from '../vscode';
import fs from 'node:fs/promises';
import https from 'node:https';
import { chooseLocalGlobal } from '../utils/user';
import { getGistId } from '../git/utils';
import type { ClientRequest } from 'node:http';

vi.mock('../utils/jsoncFilesIO');
vi.mock('../utils/user');
vi.mock('../utils/fsInfo');
vi.mock('../git/utils.js');

function mockHttps() {
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
}

describe.concurrent('codeProfile', () => {
	describe('importCodeProfileSnippets', () => {
		it('should return if no source is selected', async () => {
			(showQuickPick as Mock).mockResolvedValue(undefined);
			await importCodeProfileSnippets();
			expect(chooseLocalGlobal).not.toHaveBeenCalled();
		});

		it('should return if no save directory is chosen', async () => {
			(showQuickPick as Mock).mockResolvedValue({ run: () => Promise.resolve(['content']) });
			(chooseLocalGlobal as Mock).mockResolvedValue(undefined);
			await importCodeProfileSnippets();
			expect(fs.writeFile).not.toHaveBeenCalled();
		});
	});

	describe('profile file from gist', () => {
		it.skipIf(!process.env.GITHUB_TOKEN)(
			'should show a warning for a gist with no snippets',
			async () => {
				const gistIdWithNoSnippets = 'ddac491daeff48c5f1346ba2960462fa';
				(getGistId as Mock).mockReturnValue(gistIdWithNoSnippets);

				await _fromGist();

				expect(showInformationMessage).toBeCalled();
			}
		);
	});

	describe('profile file from raw url', () => {
		it('should fetch a profile from a url', async () => {
			const url =
				'https://gist.githubusercontent.com/example/0123456789/raw/abcdef12345/test.code-profile';
			(showInputBox as Mock).mockResolvedValue(url);
			mockHttps();

			await _fromUrl();
			expect(https.get).toBeCalledWith(url, expect.any(Function));
		});
	});

	describe.sequential('from built in code profiles', () => {
		it('should query built in code profiles', async () => {
			(showQuickPick as Mock).mockReturnValue({ label: 'python' });
			mockHttps();

			await _fromBuiltIn();
			expect(https.get).toBeCalledWith(expect.stringContaining('python'), expect.any(Function));
		});
		it('should cancel if no template is selected', async () => {
			(showQuickPick as Mock).mockReturnValue(undefined);
			mockHttps();

			await _fromBuiltIn();
			expect(https.get).not.toBeCalled();
		});
	});
});
