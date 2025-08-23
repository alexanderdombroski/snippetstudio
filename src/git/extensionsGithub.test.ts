import { beforeEach, describe, expect, it, vi } from 'vitest';
import { __folderRequest, __fileTextRequest } from './extensionsGithub';
import { getOctokitClient } from './octokit';
import { context } from '../../.vitest/__mocks__/shared';

describe.skipIf(!process.env.GITHUB_TOKEN)('extensionsGithub', async () => {
	const client = await getOctokitClient(context);
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('folderRequest', async () => {
		it('should return data if response is an array', async () => {
			const result = await __folderRequest(client, '');
			const names = result?.map((i) => i.name);
			expect(names).toContain('LICENSE.txt');
			expect(names).toContain('README.md');
		});

		it("will throw if the path doesn't exist", async () => {
			await expect(__folderRequest(client, 'foo/bar')).rejects.toThrow();
		});
	});

	describe('fileTextRequest', () => {
		it('should return decoded text content', async () => {
			const result = await __fileTextRequest(client, 'LICENSE.txt');
			expect(result).toContain('MIT License');
		});
	});
});
