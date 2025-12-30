import { describe, it, expect, type Mock, vi, beforeEach } from 'vitest';
import {
	getDefaultShellProfile,
	getAllShellProfiles,
	findInactiveTerminal,
	_hasActiveChild,
	_isExecutablePath,
	commandExists,
} from './utils';
import vscode, { getConfiguration } from '../../vscode';
import { execSync } from 'node:child_process';
import { access } from 'node:fs/promises';

const config = { get: vi.fn() };

vi.mock('node:child_process');
vi.mock('fs/promises', () => ({
	access: vi.fn(() => Promise.resolve()),
	constants: { X_OK: 1 },
}));

describe('shell utils', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		(getConfiguration as Mock).mockReturnValue(config);
		Object.defineProperty(process, 'platform', {
			value: 'win32',
		});
	});

	describe('hasActiveChild', () => {
		const mockPid = 54234;
		it('should find if a terminal process has children processes', () => {
			(execSync as Mock).mockReturnValue('56432');
			const active = _hasActiveChild(mockPid);
			expect(execSync).toBeCalled();
			expect(active).toBe(true);
		});
		it('should report false when terminal process has no children processes', () => {
			(execSync as Mock).mockImplementationOnce(() => {
				throw new Error();
			});
			const active = _hasActiveChild(mockPid);
			expect(active).toBe(false);
		});
		it('should run with different command on unix platforms', () => {
			Object.defineProperty(process, 'platform', {
				value: 'linux',
			});
			_hasActiveChild(mockPid);
			expect(execSync).toBeCalledWith(expect.stringContaining('pgrep'));
		});
	});

	describe('findInactiveTerminal', () => {
		it('should return undefined if no terminal is inactive', async () => {
			const terminal = await findInactiveTerminal('zsh');
			expect(terminal).toBeUndefined();
		});
		it('should find an terminal never used', async () => {
			const mockTerminal = {
				name: 'snippetstudio - bash',
				processId: Promise.resolve(undefined),
			};
			Object.defineProperty(vscode.window, 'terminals', {
				value: [mockTerminal],
			});
			const terminal = await findInactiveTerminal('bash');
			expect(terminal).toBe(mockTerminal);
		});
		it('should not return active terminals', async () => {
			const mockTerminal = {
				name: 'snippetstudio - bash',
				processId: Promise.resolve(12345),
			};
			Object.defineProperty(vscode.window, 'terminals', {
				value: [mockTerminal],
			});
			const terminal = await findInactiveTerminal('bash');
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
		it('should return zsh for mac', () => {
			Object.defineProperty(process, 'platform', {
				value: 'darwin',
			});
			const profile = getDefaultShellProfile();
			expect(profile).toBe('zsh');
		});
		it('should default to bash', () => {
			Object.defineProperty(process, 'platform', {
				value: 'linux',
			});
			const profile = getDefaultShellProfile();
			expect(profile).toBe('bash');
		});
	});

	describe('getAllShellProfiles', () => {
		it('should return configured profiles', async () => {
			const profiles = { PowerShell: {}, bash: {} };
			(config.get as Mock).mockReturnValue(profiles);
			const result = await getAllShellProfiles();
			expect(result).toEqual(profiles);
			expect(config.get).toBeCalledWith('profiles.windows');
		});

		it('should return empty object when no profiles', async () => {
			(config.get as Mock).mockReturnValue(undefined);
			const result = await getAllShellProfiles();
			expect(result).toEqual({});
		});

		it('should filter out non executables', async () => {
			const profiles = { PowerShell: {}, bash: {} };
			(config.get as Mock).mockReturnValue(profiles);
			(execSync as Mock).mockImplementationOnce(() => {
				throw new Error();
			});
			(access as Mock).mockImplementationOnce(() => {
				throw new Error();
			});
			const result = await getAllShellProfiles();
			expect(result).toEqual({ bash: {} });
			expect(config.get).toBeCalledWith('profiles.windows');
		});
	});

	describe('isExecutablePath', () => {
		it('should report when a path is an executable', async () => {
			const mockPath = 'user/example/bin/git';
			const isExe = await _isExecutablePath(mockPath);
			expect(isExe).toBe(true);
		});
		it("should report when a path isn't executable", async () => {
			const mockPath = 'user/example.txt';
			(access as Mock).mockImplementationOnce(() => {
				throw new Error();
			});
			const isExe = await _isExecutablePath(mockPath);
			expect(isExe).toBe(false);
		});
	});

	describe('commandExists', () => {
		it("should return false if a command doesn't exist", () => {
			(execSync as Mock).mockImplementationOnce(() => {
				throw new Error();
			});
			const exists = commandExists('jq');
			expect(exists).toBe(false);
		});
		it('should use a different command for unix', () => {
			Object.defineProperty(process, 'platform', {
				value: 'darwin',
			});
			const exists = commandExists('jq');
			expect(execSync).toBeCalledWith(expect.stringContaining('command -v'), expect.anything());
			expect(exists).toBe(true);
		});
	});
});
