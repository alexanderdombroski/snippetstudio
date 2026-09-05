import { describe, expect, it, vi } from 'vitest';
import { getGistId } from './utils';
import * as vscode from '../vscode';

describe('git utils', () => {
	describe('getGistId', () => {
		const showInputBoxSpy = vi.spyOn(vscode, 'showInputBox');
		const showErrorMessageSpy = vi.spyOn(vscode, 'showErrorMessage');

		it('should extract gist id from share url', async () => {
			showInputBoxSpy.mockResolvedValue(
				'https://gist.github.com/user/1234567890abcdef1234567890abcdef'
			);
			const gistId = await getGistId();
			expect(gistId).toBe('1234567890abcdef1234567890abcdef');
		});

		it('should extract gist id from clone url', async () => {
			showInputBoxSpy.mockResolvedValue(
				'https://gist.github.com/1234567890abcdef1234567890abcdef.git'
			);
			const gistId = await getGistId();
			expect(gistId).toBe('1234567890abcdef1234567890abcdef');
		});

		it('should extract gist id from ssh url', async () => {
			showInputBoxSpy.mockResolvedValue('git@gist.github.com:1234567890abcdef1234567890abcdef.git');
			const gistId = await getGistId();
			expect(gistId).toBe('1234567890abcdef1234567890abcdef');
		});

		it('should return gist id if it is a valid id', async () => {
			showInputBoxSpy.mockResolvedValue('1234567890abcdef1234567890abcdef');
			const gistId = await getGistId();
			expect(gistId).toBe('1234567890abcdef1234567890abcdef');
		});

		it('should return undefined if no identifier is provided', async () => {
			showInputBoxSpy.mockResolvedValue(undefined);
			const gistId = await getGistId();
			expect(gistId).toBeUndefined();
		});

		it('should throw an error for an invalid identifier', async () => {
			const invalidIdentifier = 'invalid-identifier';
			showInputBoxSpy.mockResolvedValue(invalidIdentifier);

			await expect(getGistId()).rejects.toThrow(`Invalid Gist identifier: ${invalidIdentifier}`);
			expect(showErrorMessageSpy).toHaveBeenCalledWith(
				`Invalid Gist identifier: ${invalidIdentifier}`
			);
		});
	});
});
