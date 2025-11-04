import { execSync } from 'node:child_process';
import type { Terminal } from 'vscode';
import vscode, { getConfiguration } from '../../vscode';

/** Tells whether a shell PID has a command running */
export function _hasActiveChild(pid: number): boolean {
	try {
		const cmd =
			process.platform === 'win32'
				? `powershell -Command "(Get-CimInstance Win32_Process | Where-Object { $_.ParentProcessId -eq ${pid} }).ProcessId"`
				: `pgrep -P ${pid}`;

		const output = execSync(cmd).toString().trim();
		return output.length > 0;
	} catch {
		return false; // no children
	}
}

/** Finds a snippetstudio terminal that is availabe for use */
export async function findInactiveTerminal(profile: string): Promise<Terminal | undefined> {
	const terminals = vscode.window.terminals.filter((t) => t.name === `snippetstudio - ${profile}`);
	for (const terminal of terminals) {
		const pid = await terminal.processId;
		if (pid === undefined || !_hasActiveChild(pid)) {
			return terminal;
		}
	}
}

/** Gets the platform-specific configuration key for terminal profiles */
function getPlatformKey(): string {
	switch (process.platform) {
		case 'win32':
			return 'windows';
		case 'darwin':
			return 'osx';
		default:
			return 'linux';
	}
}

/** Gets the default shell profile name for the current platform */
export function getDefaultShellProfile(): string {
	const platform = getPlatformKey();
	const config = getConfiguration('terminal.integrated');
	const defaultProfile = config.get<string>(`defaultProfile.${platform}`);

	// If no default profile is set, return a reasonable default
	if (!defaultProfile) {
		switch (platform) {
			case 'windows':
				return 'PowerShell';
			case 'osx':
				return 'zsh';
			default:
				return 'bash';
		}
	}

	return defaultProfile;
}

type ShellProfiles = {
	[name: string]: ShellProfileConfig;
};

type ShellProfileConfig = {
	path: string;
	args?: string[];
};

/** Gets all available shell profiles for the current platform */
export function getAllShellProfiles(): ShellProfiles {
	const platform = getPlatformKey();
	const config = getConfiguration('terminal.integrated');
	const profiles = config.get<ShellProfiles>(`profiles.${platform}`) || {};

	return profiles;
}
