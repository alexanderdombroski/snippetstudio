import type { QuickPickItem } from 'vscode';
import vscode, {
	showErrorMessage,
	createTerminal,
	ThemeIcon,
	showInputBox,
	showQuickPick,
	showInformationMessage,
} from '../../vscode';
import { getShellView, type ShellTreeItem } from './ShellViewProvider';
import { getShellSnippets, setShellSnippets } from './config';

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
