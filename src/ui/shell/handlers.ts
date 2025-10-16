import type { QuickPickItem } from 'vscode';
import vscode, {
	showErrorMessage,
	createTerminal,
	ThemeIcon,
	showInputBox,
	showQuickPick,
	showInformationMessage,
	getConfiguration,
} from '../../vscode';
import { getShellView, type ShellTreeItem } from './ShellViewProvider';
import { getShellSnippets, setShellSnippets } from './config';
import { getConfirmation } from '../../utils/user';

/** Command handler to edit an existing shell snippet */
export async function editShellSnippet(item: ShellTreeItem) {
	try {
		const command = await getCommand(item.label);

		if (!command) {
			return;
		}

		const snippets = getShellSnippets()[Number(item.isLocal)];
		const index = snippets.findIndex((s) => s.command === item.label);

		if (index === -1) {
			await showErrorMessage('Snippet not found for editing.');
			return;
		}

		snippets[index].command = command;

		await setShellSnippets(
			snippets,
			item.isLocal ? vscode.ConfigurationTarget.Workspace : vscode.ConfigurationTarget.Global
		);

		const view = getShellView();
		view.refresh();

		await showInformationMessage(`Shell snippet updated: ${command}`);
	} catch (err) {
		await showErrorMessage(`Failed to edit snippet: ${err}`);
	}
}

/** Command handler to delete a shell snippet */
export async function deleteShellSnippet(item: ShellTreeItem) {
	try {
		if (
			getConfiguration('snippetstudio').get<boolean>('confirmSnippetDeletion') &&
			!(await getConfirmation(`Delete shell snippet "${item.label}"?`))
		) {
			return;
		}

		const snippets = getShellSnippets()[Number(item.isLocal)];
		const filtered = snippets.filter((s) => s.command !== item.label);

		await setShellSnippets(
			filtered,
			item.isLocal ? vscode.ConfigurationTarget.Workspace : vscode.ConfigurationTarget.Global
		);

		const view = getShellView();
		view.refresh();

		await showInformationMessage(`Shell snippet deleted: ${item.label}`);
	} catch (err) {
		await showErrorMessage(`Failed to delete snippet: ${err}`);
	}
}

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

/** Command handler to create a new shell snippet */
export async function createShellSnippet() {
	const command = await getCommand();

	if (!command) {
		return;
	}

	const options: (QuickPickItem & { id: string })[] = [
		{ label: 'Run immediately when executed?', id: 'runImmediately' },
		{ label: 'Remember only for this workspace ', id: 'isLocal' },
	];

	const selected = await showQuickPick(options, {
		title: 'Define command configuration behavior',
		canPickMany: true,
	});

	if (selected === undefined) {
		return;
	}

	const runImmediately = selected.some((opt) => opt.id === 'runImmediately');
	const isLocal = selected.some((opt) => opt.id === 'isLocal');

	const snippets = getShellSnippets()[Number(isLocal)];

	snippets.push({ command, runImmediately });

	await setShellSnippets(
		snippets,
		isLocal ? vscode.ConfigurationTarget.Workspace : vscode.ConfigurationTarget.Global
	);

	const view = getShellView();
	view.refresh();

	showInformationMessage(`Shell snippet added: ${command}`);
}

/** Get a shell command from the user */
async function getCommand(value: string = ''): Promise<string | undefined> {
	const command = await showInputBox({
		prompt: 'Enter the new shell command',
		placeHolder: 'e.g., ls -la',
		value,
	});

	return command?.trim();
}
