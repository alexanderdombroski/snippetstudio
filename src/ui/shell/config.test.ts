import { describe, it, expect, type Mock, vi, beforeEach } from 'vitest';
import { getShellSnippets, setShellSnippets } from './config';
import vscode, { getConfiguration } from '../../vscode';

const config = { inspect: vi.fn(), update: vi.fn() };

describe('shell snippets config io', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		(getConfiguration as Mock).mockReturnValue(config);
	});

	describe('getShellSnippets', () => {
		it('should return workspace and global snippets', () => {
			const globalValue = ['ffmpeg convert out.gif'];
			const workspaceValue = ['docker compose up'];
			(config.inspect as Mock).mockReturnValue({ globalValue, workspaceValue });
			const snippets = getShellSnippets();
			expect(snippets).toStrictEqual([globalValue, workspaceValue]);
		});
		it('should return empty arrays if there is no config value', () => {
			(config.inspect as Mock).mockReturnValue({});
			const snippets = getShellSnippets();
			expect(snippets).toStrictEqual([[], []]);
		});
	});

	describe('setShellSnippets', () => {
		it('should update snippets', async () => {
			await setShellSnippets([], vscode.ConfigurationTarget.Global);
			expect(config.update).toBeCalledWith('shell.snippets', [], vscode.ConfigurationTarget.Global);
		});
	});
});
