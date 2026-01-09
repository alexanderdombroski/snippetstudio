import { execSync } from 'node:child_process';
import type { Terminal } from 'vscode';
import vscode, { getConfiguration } from '../../vscode';
import { access, constants } from 'node:fs/promises';

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
export function getPlatformKey(): string {
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
export async function getAllShellProfiles(): Promise<ShellProfiles> {
	const platform = getPlatformKey();
	const config = getConfiguration('terminal.integrated');
	const profiles = config.get<ShellProfiles>(`profiles.${platform}`) || {};

	const entries = await Promise.all(
		Object.entries(profiles).map(async ([key, profile]) =>
			commandExists(profile.path) || (await _isExecutablePath(profile.path)) ? [key, profile] : null
		)
	);

	return Object.fromEntries(entries.filter((kvp) => kvp !== null));
}

/**
 * Check if a given path exists and is executable.
 * @param filePath - Absolute or relative path to a file.
 * @returns true if the file exists and is executable, false otherwise.
 */
export async function _isExecutablePath(filePath: string): Promise<boolean> {
	try {
		await access(filePath, constants.X_OK);
		return true;
	} catch {
		return false;
	}
}

/** Check if a command or path to an executable exists. */
export function commandExists(command: string): boolean {
	try {
		const cmd = process.platform === 'win32' ? `where ${command}` : `command -v ${command}`;
		execSync(cmd, { stdio: 'ignore' });
		return true;
	} catch {
		return false;
	}
}
