import { describe, it, expect, type Mock, vi, beforeEach } from 'vitest';
import { getDefaultShellProfile, getAllShellProfiles, getShellProfileNames } from './utils';
import { getConfiguration } from '../../vscode';

const config = { get: vi.fn() };

describe('shell utils', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		(getConfiguration as Mock).mockReturnValue(config);
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

	describe('getShellProfileNames', () => {
		it('should return sorted profile names', () => {
			const profiles = { PowerShell: {}, bash: {}, zsh: {} };
			(config.get as Mock).mockReturnValue(profiles);
			const names = getShellProfileNames();
			expect(names).toEqual(['PowerShell', 'bash', 'zsh']);
		});
	});
});
