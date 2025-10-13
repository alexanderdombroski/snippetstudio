import type { ConfigurationTarget } from 'vscode';
import { getConfiguration } from '../../vscode';

/** Represents a shell snippet configuration */
export interface ShellSnippet {
	/** The shell command to be executed or pasted */
	command: string;

	/** If true, the command is executed immediately; otherwise, it is pasted into the terminal */
	runImmediately?: boolean;
}

/**
 * Returns a tuple of shell snippets stored in [user, workspace] configuration.
 * @returns A tuple containing [user config snippets, workspace config snippets]
 */
export function getShellSnippets(): [ShellSnippet[], ShellSnippet[]] {
	const userConfig = getConfiguration('snippetstudio', null);
	const workspaceConfig = getConfiguration('snippetstudio');

	const userSnippets = userConfig.inspect<ShellSnippet[]>('shell.snippets')?.globalValue ?? [];
	const workspaceSnippets =
		workspaceConfig.inspect<ShellSnippet[]>('shell.snippets')?.workspaceValue ?? [];

	return [userSnippets, workspaceSnippets];
}

/**
 * Updates the shell snippets configuration.
 * @param snippets - The array of shell snippets to store
 * @param target - The configuration target (Global for user settings, Workspace for workspace settings)
 * @returns A promise that resolves when the configuration is updated
 */
export async function setShellSnippets(
	snippets: ShellSnippet[],
	target: ConfigurationTarget
): Promise<void> {
	const config = getConfiguration('snippetstudio');
	await config.update('shell.snippets', snippets, target);
}
