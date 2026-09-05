import type { ConfigurationTarget } from 'vscode';
import type { ShellSnippet } from '../../types';
import { getConfiguration } from '../../vscode';

/**
 * Get the user's shell snippets
 * @returns A tuple containing [user config snippets, workspace config snippets]
 */
export function getShellSnippets(): [ShellSnippet[], ShellSnippet[]] {
	const config = getConfiguration('snippetstudio');

	const inspected = config.inspect<ShellSnippet[]>('shell.snippets');
	const userSnippets = inspected?.globalValue ?? [];
	const workspaceSnippets = inspected?.workspaceValue ?? [];

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
