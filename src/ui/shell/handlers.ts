import vscode, { showErrorMessage, createTerminal, ThemeIcon } from '../../vscode';
import type { ShellTreeItem } from './ShellViewProvider';

/** Command handler to create a new shell snippet */
export function createShellSnippet() {}

/** Command handler to edit an existing shell snippet */
// eslint-disable-next-line no-unused-vars
export function editShellSnippet(item: ShellTreeItem) {}

/** Command handler to delete a shell snippet */
// eslint-disable-next-line no-unused-vars
export function deleteShellSnippet(item: ShellTreeItem) {}

/** Command handler to run a shell command snippet */
export async function runShellSnippet(item: ShellTreeItem) {
	try {
		const terminals = vscode.window.terminals;
		let terminal = terminals.find(
			(terminal) => terminal.name === 'snippetstudio' && terminal.exitStatus === undefined
		);
		terminal ??= createTerminal({ iconPath: new ThemeIcon('repo'), name: 'snippetstudio' });
		terminal.show(true);
		terminal.sendText(String(item.label), item.runImmediately);
	} catch (error) {
		await showErrorMessage(`Failed to run command because ${JSON.stringify(error)}`);
	}
}

/** Command handler to define a new shell snippet */
export async function defineShellSnippet() {
	// Step 1: Ask user for command string
	const command = await vscode.window.showInputBox({
		prompt: 'Enter the new shell command',
		placeHolder: 'e.g., ls -la',
	});
	// eslint-disable-next-line curly
	if (!command) return; // user cancelled

	// Step 2: Ask if it should run immediately
	const runImmediatelyPick = await vscode.window.showQuickPick(['Yes', 'No'], {
		placeHolder: 'Run immediately when executed?',
	});
	const runImmediately = runImmediatelyPick === 'Yes';

	// Step 3: Get current shell snippets (local or global)
	const config = vscode.workspace.getConfiguration('snippetstudio.shell');
	const snippets = config.get<{ command: string; runImmediately: boolean }[]>('snippets') || [];

	// Step 4: Add the new snippet
	snippets.push({ command, runImmediately });

	// Step 5: Save back to configuration (workspace)
	await config.update('snippets', snippets, vscode.ConfigurationTarget.Workspace);

	// Step 6: Refresh the tree view
	await vscode.commands.executeCommand('snippetstudio.shell.refresh');

	// Step 7: Optionally run immediately in the terminal
	if (runImmediately) {
		const terminal = vscode.window.createTerminal('Snippet Terminal');
		terminal.show();
		terminal.sendText(command);
	}

	vscode.window.showInformationMessage(`Shell snippet added: ${command}`);
}
