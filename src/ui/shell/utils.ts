import { execSync } from 'node:child_process';
import type { Terminal } from 'vscode';
import vscode, { getConfiguration } from '../../vscode';

/** Tells whether a shell PID has a command running */
function hasActiveChild(pid: number): boolean {
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

/** Gets the platform-specific configuration key for terminal profiles */
function getPlatformKey(): string {
	switch (process.platform) {
		case 'win32':
			return 'windows';
		case 'darwin':
			return 'osx';
		case 'linux':
			return 'linux';
		default:
			return 'linux'; // fallback
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
			case 'linux':
				return 'bash';
			default:
				return 'bash';
		}
	}
	
	return defaultProfile;
}

/** Gets all available shell profiles for the current platform */
export function getAllShellProfiles(): Record<string, any> {
	const platform = getPlatformKey();
	const config = getConfiguration('terminal.integrated');
	const profiles = config.get<Record<string, any>>(`profiles.${platform}`) || {};
	
	// Add the default profile if it's not in the profiles list
	const defaultProfile = getDefaultShellProfile();
	if (!profiles[defaultProfile]) {
		profiles[defaultProfile] = {};
	}
	
	return profiles;
}

/** Gets an array of profile names for quick pick selection */
export function getShellProfileNames(): string[] {
	const profiles = getAllShellProfiles();
	return Object.keys(profiles).sort();
}

/** Finds a snippetstudio terminal that is availabe for use */
export async function findInactiveTerminal(): Promise<Terminal | undefined> {
	const terminals = vscode.window.terminals.filter((t) => t.name === 'snippetstudio');
	for (const terminal of terminals) {
		const pid = await terminal.processId;
		if (pid === undefined || !hasActiveChild(pid)) {
			return terminal;
		}
	}
}
