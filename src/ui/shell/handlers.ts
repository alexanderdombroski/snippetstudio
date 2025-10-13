import vscode from '../../vscode';
import type { ShellTreeItem } from './ShellViewProvider';

/** Command handler to create a new shell snippet */
export function createShellSnippet() {
	vscode.window.showInformationMessage('Create Shell Snippet - implement UI or logic here');
}

/** Command handler to edit an existing shell snippet */
export function editShellSnippet(item: ShellTreeItem) {
	vscode.window.showInformationMessage(`Edit Shell Snippet: ${item.label}`);
}

/** Command handler to delete a shell snippet */
export function deleteShellSnippet(item: ShellTreeItem) {
	vscode.window.showInformationMessage(`Delete Shell Snippet: ${item.label}`);
}

/** Command handler to run a shell command snippet */
export async function runShellSnippet(item: ShellTreeItem) {
	const terminal = vscode.window.createTerminal('Snippet Terminal');
	terminal.show();

	if (item.command) {
		const commandText =
			typeof item.command === 'string' ? item.command : String(item.command);

		terminal.sendText(commandText);

		if (item.runImmediately) {
			terminal.sendText(commandText);
		}

		vscode.window.showInformationMessage(`Running Shell Snippet: ${item.label}`);
	} else {
		vscode.window.showErrorMessage('No command found for this shell snippet.');
	}
}

/** Command handler to define a new shell snippet */
export async function defineShellSnippet() {
	// Step 1: Ask user for command string
	const command = await vscode.window.showInputBox({
		prompt: 'Enter the new shell command',
		placeHolder: 'e.g., ls -la',
	});
	if (!command) return; // user cancelled

	// Step 2: Ask if it should run immediately
	const runImmediatelyPick = await vscode.window.showQuickPick(['Yes', 'No'], {
		placeHolder: 'Run immediately when executed?',
	});
	const runImmediately = runImmediatelyPick === 'Yes';

	// Step 3: Get current shell snippets (local or global)
	const config = vscode.workspace.getConfiguration('snippetstudio.shell');
	const snippets =
		config.get<{ command: string; runImmediately: boolean }[]>('snippets') || [];

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
