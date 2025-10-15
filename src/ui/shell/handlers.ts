import type { QuickPickItem } from 'vscode';
import vscode, {
	showErrorMessage,
	createTerminal,
	ThemeIcon,
	showInputBox,
	showQuickPick,
	showInformationMessage,
	showWarningMessage,
} from '../../vscode';
import { getShellView, type ShellTreeItem } from './ShellViewProvider';
import { getShellSnippets, setShellSnippets } from './config';

/** Command handler to edit an existing shell snippet */
export async function editShellSnippet(item: ShellTreeItem) {
	try {
		const command = await showInputBox({
			prompt: 'Edit shell command',
			placeHolder: 'e.g., ls -la',
			value: String(item.label),
		});

		if (command === undefined || command.trim() === '') {
			return;
		}

		const snippets = getShellSnippets();
		const [globalSnippets, localSnippets] = snippets;

		const list = item.isLocal ? localSnippets : globalSnippets;
		const index = list.findIndex((s) => s.command === item.label);

		if (index === -1) {
			await showErrorMessage('Snippet not found for editing.');
			return;
		}

		list[index].command = command;

		await setShellSnippets(
			list,
			item.isLocal ? vscode.ConfigurationTarget.Workspace : vscode.ConfigurationTarget.Global
		);

		const view = getShellView();
		view.refresh();

		await showInformationMessage(`Shell snippet updated: ${command}`);
	} catch (err) {
		await showErrorMessage(`Failed to edit snippet: ${String(err)}`);
	}
}

/** Command handler to delete a shell snippet */
export async function deleteShellSnippet(item: ShellTreeItem) {
	try {
		const confirm = await showWarningMessage(
			`Delete shell snippet "${item.label}"?`,
			{ modal: true },
			'Yes',
			'No'
		);

		if (confirm !== 'Yes') return;

		const snippets = getShellSnippets();
		const [globalSnippets, localSnippets] = snippets;

		const list = item.isLocal ? localSnippets : globalSnippets;
		const filtered = list.filter((s) => s.command !== item.label);

		await setShellSnippets(
			filtered,
			item.isLocal ? vscode.ConfigurationTarget.Workspace : vscode.ConfigurationTarget.Global
		);

		const view = getShellView();
		view.refresh();

		await showInformationMessage(`Shell snippet deleted: ${item.label}`);
	} catch (err) {
		await showErrorMessage(`Failed to delete snippet: ${String(err)}`);
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
	const command = await showInputBox({
		prompt: 'Enter the new shell command',
		placeHolder: 'e.g., ls -la',
	});

	if (command === undefined) {
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
