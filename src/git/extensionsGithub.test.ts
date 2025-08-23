import { beforeEach, describe, expect, it, vi, type Mock, type Mocked } from 'vitest';
import vscode, { showQuickPick, showInformationMessage } from '../vscode';
import { importBuiltinExtension } from './extensionsGithub';
import { getOctokitClient } from './octokit';
import * as user from '../utils/user';
import * as jsonc from '../utils/jsoncFilesIO';
import * as fsInfo from '../utils/fsInfo';
import * as locate from '../snippets/extension/locate';
import path from 'node:path';
import { context } from '../../.vitest/__mocks__/shared';

// Mock dependencies
vi.mock('./octokit');
vi.mock('../utils/user');
vi.mock('../utils/jsoncFilesIO');
vi.mock('../utils/fsInfo');
vi.mock('../snippets/extension/locate');

const mockedGetOctokitClient = getOctokitClient as Mock;
const mockedUser = user as Mocked<typeof user>;
const mockedJsonc = jsonc as Mocked<typeof jsonc>;
const mockedFsInfo = fsInfo as Mocked<typeof fsInfo>;
const mockedLocate = locate as Mocked<typeof locate>;

const mockOctokit = {
	request: vi.fn(),
};

describe.skip('extensionsGithub', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		mockedGetOctokitClient.mockResolvedValue(mockOctokit);
		// It's better to mock the implementation of withProgress to just run the task
		// The default mock might do this, but being explicit is safer.
		(vscode.window.withProgress as Mock).mockImplementation(async (options, task) => {
			return await task({ report: vi.fn() }, { isCancellationRequested: false } as any);
		});
	});

	describe('importBuiltinExtension', () => {
		it('should do nothing if fetching initial extension directories fails', async () => {
			mockOctokit.request.mockImplementation((route, opts) => {
				if (route === 'GET /repos/{owner}/{repo}/contents/{path}' && opts.path === 'extensions') {
					// Simulate folderRequest returning undefined
					return Promise.resolve({ data: 'not an array' });
				}
				return Promise.resolve({ data: [] });
			});

			await importBuiltinExtension(context);

			expect(showQuickPick).not.toHaveBeenCalled();
		});

		it('should do nothing if user cancels extension selection', async () => {
			mockOctokit.request.mockResolvedValue({ data: [] }); // for getDirsWithSnippets
			(showQuickPick as Mock).mockResolvedValue(undefined);

			await importBuiltinExtension(context);

			expect(mockedUser.chooseLocalGlobal).not.toHaveBeenCalled();
		});

		it('should do nothing if user cancels location selection', async () => {
			mockOctokit.request.mockImplementation((route, opts) => {
				if (opts.path === 'extensions') {
					return Promise.resolve({ data: [{ name: 'foo', type: 'dir', path: 'extensions/foo' }] });
				}
				if (opts.path === 'extensions/foo') {
					return Promise.resolve({ data: [{ name: 'snippets', type: 'dir' }] });
				}
				return Promise.resolve({ data: [] });
			});
			(showQuickPick as Mock).mockResolvedValue([{ label: 'foo', description: 'extensions/foo' }]);
			mockedUser.chooseLocalGlobal.mockResolvedValue(undefined);

			await importBuiltinExtension(context);

			expect(mockedUser.getFileName).not.toHaveBeenCalled();
		});

		it('should show info message if no snippets found for a selection', async () => {
			mockOctokit.request.mockImplementation((route, opts) => {
				if (opts.path === 'extensions') {
					return Promise.resolve({ data: [{ name: 'foo', type: 'dir', path: 'extensions/foo' }] });
				}
				if (opts.path === 'extensions/foo') {
					return Promise.resolve({ data: [{ name: 'snippets', type: 'dir' }] });
				}
				if (opts.path === 'extensions/foo/snippets') {
					// Simulate folderRequest returning undefined
					return Promise.resolve({ data: 'not an array' });
				}
				if (opts.path === 'extensions/foo/package.json') {
					return Promise.resolve({ data: { content: Buffer.from('{}').toString('base64') } });
				}
				return Promise.resolve({ data: [] });
			});
			(showQuickPick as Mock).mockResolvedValue([{ label: 'foo' }]);
			mockedUser.chooseLocalGlobal.mockResolvedValue('/some/path');

			await importBuiltinExtension(context);

			expect(showInformationMessage).toHaveBeenCalledWith("Couldn't find any snippets for foo");
		});

		it('should import snippets from a selected extension', async () => {
			const pkgJson = {
				contributes: {
					snippets: [{ language: 'typescript', path: './snippets/ts.json' }],
				},
			};
			const snippetFileContent = {
				'my-snippet': {
					prefix: 'ts-prefix',
					body: ['console.log("$1");'],
					description: 'A ts snippet',
				},
			};

			mockOctokit.request.mockImplementation((route, opts) => {
				switch (opts.path) {
					case 'extensions':
						return Promise.resolve({
							data: [{ name: 'foo', type: 'dir', path: 'extensions/foo' }],
						});
					case 'extensions/foo':
						return Promise.resolve({ data: [{ name: 'snippets', type: 'dir' }] });
					case 'extensions/foo/snippets':
						return Promise.resolve({ data: [{ name: 'ts.json', type: 'file' }] });
					case 'extensions/foo/package.json':
						return Promise.resolve({
							data: { content: Buffer.from(JSON.stringify(pkgJson)).toString('base64') },
						});
					case 'extensions/foo/snippets/ts.json':
						return Promise.resolve({
							data: { content: Buffer.from(JSON.stringify(snippetFileContent)).toString('base64') },
						});
					default:
						return Promise.resolve({ data: [] });
				}
			});

			(showQuickPick as Mock).mockResolvedValue([{ label: 'foo' }]);
			mockedUser.chooseLocalGlobal.mockResolvedValue('/user/snippets');
			mockedUser.getFileName.mockResolvedValue('my-ts-snippets');
			mockedJsonc.processJsonWithComments.mockResolvedValue(snippetFileContent);
			const flattenedSnippets = { ...snippetFileContent };
			mockedLocate.flattenScopedExtensionSnippets.mockReturnValue(flattenedSnippets);
			mockedFsInfo.exists.mockResolvedValue(false);

			await importBuiltinExtension(context);

			expect(mockedUser.getFileName).toHaveBeenCalled();
			expect(mockedJsonc.writeSnippetFile).toHaveBeenCalled();

			const writtenSnippets = mockedJsonc.writeSnippetFile.mock.calls[0][1];
			expect(writtenSnippets['my-snippet'].scope).toBe('typescript');

			const writtenPath = mockedJsonc.writeSnippetFile.mock.calls[0][0];
			expect(writtenPath).toBe(path.join('/user/snippets', 'my-ts-snippets.code-snippets'));
		});

		it('should handle multiple selections and create new files for existing ones', async () => {
			const pkgJson1 = {
				contributes: { snippets: [{ language: 'typescript', path: './snippets/ts.json' }] },
			};
			const snippetContent1 = { 'my-snippet': { prefix: 'p1', body: 'b1' } };
			const pkgJson2 = {
				contributes: { snippets: [{ language: 'javascript', path: './snippets/js.json' }] },
			};
			const snippetContent2 = { 'my-snippet-2': { prefix: 'p2', body: 'b2' } };

			mockOctokit.request.mockImplementation((route, opts) => {
				switch (opts.path) {
					case 'extensions':
						return Promise.resolve({
							data: [
								{ name: 'foo', type: 'dir', path: 'extensions/foo' },
								{ name: 'bar', type: 'dir', path: 'extensions/bar' },
							],
						});
					case 'extensions/foo':
					case 'extensions/bar':
						return Promise.resolve({ data: [{ name: 'snippets', type: 'dir' }] });
					case 'extensions/foo/snippets':
						return Promise.resolve({ data: [{ name: 'ts.json', type: 'file' }] });
					case 'extensions/bar/snippets':
						return Promise.resolve({ data: [{ name: 'js.json', type: 'file' }] });
					case 'extensions/foo/package.json':
						return Promise.resolve({
							data: { content: Buffer.from(JSON.stringify(pkgJson1)).toString('base64') },
						});
					case 'extensions/bar/package.json':
						return Promise.resolve({
							data: { content: Buffer.from(JSON.stringify(pkgJson2)).toString('base64') },
						});
					case 'extensions/foo/snippets/ts.json':
						return Promise.resolve({
							data: { content: Buffer.from(JSON.stringify(snippetContent1)).toString('base64') },
						});
					case 'extensions/bar/snippets/js.json':
						return Promise.resolve({
							data: { content: Buffer.from(JSON.stringify(snippetContent2)).toString('base64') },
						});
					default:
						return Promise.resolve({ data: [] });
				}
			});

			(showQuickPick as Mock).mockResolvedValue([{ label: 'foo' }, { label: 'bar' }]);
			mockedUser.chooseLocalGlobal.mockResolvedValue('/user/snippets');
			mockedUser.getFileName.mockResolvedValueOnce('file1').mockResolvedValueOnce('file2');
			mockedJsonc.processJsonWithComments
				.mockResolvedValueOnce(snippetContent1)
				.mockResolvedValueOnce(snippetContent2);
			mockedLocate.flattenScopedExtensionSnippets
				.mockReturnValueOnce(snippetContent1)
				.mockReturnValueOnce(snippetContent2);
			mockedFsInfo.exists
				.mockResolvedValueOnce(true) // first file exists
				.mockResolvedValueOnce(false); // second does not

			await importBuiltinExtension(context);

			expect(mockedJsonc.writeSnippetFile).toHaveBeenCalledTimes(2);

			const firstCallArgs = mockedJsonc.writeSnippetFile.mock.calls[0];
			expect(firstCallArgs[0]).toMatch(/\/user\/snippets\/[a-f0-9-]+\.code-snippets/);

			const secondCallArgs = mockedJsonc.writeSnippetFile.mock.calls[1];
			expect(secondCallArgs[0]).toBe('/user/snippets/file2.code-snippets');
		});
	});
});
