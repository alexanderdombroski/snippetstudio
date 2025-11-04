import { describe, it, expect, type Mock, vi, beforeEach } from 'vitest';
import {
	getDefaultShellProfile,
	getAllShellProfiles,
	findInactiveTerminal,
	_hasActiveChild,
} from './utils';
import { getConfiguration } from '../../vscode';
import { execSync } from 'node:child_process';

const config = { get: vi.fn() };

vi.mock('node:child_process');

describe('shell utils', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		(getConfiguration as Mock).mockReturnValue(config);
		Object.defineProperty(process, 'platform', {
			value: 'win32',
		});
	});

	describe('hasActiveChild', () => {
		it('should find if a terminal process has children processes', () => {
			const mockPid = 54234;
			(execSync as Mock).mockReturnValue('56432');
			const active = _hasActiveChild(mockPid);
			expect(execSync).toBeCalled();
			expect(active).toBe(true);
		});
	});

	describe('findInactiveTerminal', () => {
		it('should return undefined if no terminal is inactive', async () => {
			const terminal = await findInactiveTerminal('zsh');
			expect(terminal).toBeUndefined();
		});
	});

	describe('getDefaultShellProfile', () => {
		it('should return configured default profile', () => {
			(config.get as Mock).mockReturnValue('PowerShell');
			const profile = getDefaultShellProfile();
			expect(profile).toBe('PowerShell');
			expect(config.get).toBeCalledWith('defaultProfile.windows');
		});

		it('should return platform-specific default when no config', () => {
			(config.get as Mock).mockReturnValue(undefined);
			const profile = getDefaultShellProfile();
			expect(['PowerShell', 'zsh', 'bash']).toContain(profile);
		});
	});

	describe('getAllShellProfiles', () => {
		it('should return configured profiles', () => {
			const profiles = { PowerShell: {}, bash: {} };
			(config.get as Mock).mockReturnValue(profiles);
			const result = getAllShellProfiles();
			expect(result).toEqual(profiles);
			expect(config.get).toBeCalledWith('profiles.windows');
		});

		it('should return empty object when no profiles', () => {
			(config.get as Mock).mockReturnValue(undefined);
			const result = getAllShellProfiles();
			expect(result).toEqual({});
		});
	});
});
