// -------------------------------------------------------------------
// ---------- Lazy Loaded - Only import with await import() ----------
// -------------------------------------------------------------------

import type { QuickPickItem, Terminal } from 'vscode';
import vscode, {
	showErrorMessage,
	createTerminal,
	ThemeIcon,
	showInputBox,
	showInformationMessage,
	getConfiguration,
	createQuickPick,
	showWarningMessage,
	executeCommand,
	showQuickPick,
} from '../../vscode';
import { getShellView } from './ShellViewProvider';
import type { ShellTreeDropdown, ShellTreeItem } from '../templates';
import { getShellSnippets, setShellSnippets } from './config';
import { getConfirmation } from '../../utils/user';
import {
	findInactiveTerminal,
	getAllShellProfiles,
	getDefaultShellProfile,
	getPlatformKey,
	isInactive,
} from './utils';

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

type RunOptions = { useActive?: boolean };

/** Command handler to run a shell command snippet */
export async function runShellSnippet(item: ShellTreeItem, { useActive }: RunOptions = {}) {
	try {
		let terminal: Terminal | undefined;
		if (
			useActive &&
			vscode.window.activeTerminal?.state?.shell === item.profile &&
			(await isInactive(vscode.window.activeTerminal as Terminal))
		) {
			terminal = vscode.window.activeTerminal;
		}
		terminal ??= await findInactiveTerminal(item.profile);
		if (!terminal) {
			const profiles = await getAllShellProfiles();
			const config = profiles[item.profile];
			if (!(config?.path || config?.source)) {
				showWarningMessage(
					`Shell profile ${item.profile} not recognized. Recreate command with new profile or add ${item.profile} profile to VS Code configuration.`
				);
				return;
			}
			terminal = createTerminal({
				iconPath: new ThemeIcon('repo'),
				name: `snippetstudio - ${item.profile}`,
				shellPath: config.path,
				shellArgs: config.args,
			});
		}
		terminal.show(true);
		terminal.sendText(item.label, item.runImmediately);
	} catch (err) {
		await showErrorMessage(`Failed to run command because ${err}`);
	}
}

/** Command handler to create a new shell snippet */
export async function createShellSnippet(item?: ShellTreeDropdown) {
	const command = await getCommand();

	if (!command) {
		return;
	}

	const qp = createQuickPick();
	qp.canSelectMany = true;
	qp.title = 'Define command configuration behavior';

	type Item = QuickPickItem & { id: string };
	const options: Item[] = [
		{ label: 'Behavior', id: 'separator', kind: vscode.QuickPickItemKind.Separator },
		{ label: 'Run immediately when executed?', id: 'runImmediately' },
		{ label: 'Remember only for this workspace ', id: 'isLocal' },
	];

	const defaultProfile = getDefaultShellProfile();
	const profiles = await getAllShellProfiles();
	if (!(defaultProfile in profiles)) {
		showWarningMessage(
			`VS Code configuration for \`terminal.integrated.profiles.${getPlatformKey()}\` doesn't contain the default: ${defaultProfile}`
		);
		return;
	}

	options.push(
		{ label: 'Shell Profile', id: 'separator', kind: vscode.QuickPickItemKind.Separator },
		...Object.keys(profiles).map((label): Item => ({ label, id: 'profile' }))
	);

	qp.items = options;
	const prePick = options.find(
		({ id, label }) => id === 'profile' && label === defaultProfile
	) as Item;
	const preselectedOptions = [options[1], prePick];
	if (item?.isLocal === false) preselectedOptions.push(options[2]);
	qp.selectedItems = preselectedOptions;

	qp.show();

	const selected: Item[] | undefined = await new Promise((resolve) => {
		let resolved = false;
		let selectedProfile = defaultProfile;

		qp.onDidAccept(() => {
			resolved = true;
			qp.hide();
			resolve(qp.selectedItems as Item[]);
		});

		qp.onDidHide(() => {
			if (!resolved) {
				resolve(undefined);
			}
		});

		qp.onDidChangeSelection((items) => {
			const selectedProfiles = items.filter((item) => (item as Item).id === 'profile');
			if (selectedProfiles.length > 1) {
				qp.selectedItems = qp.selectedItems.filter((item) => item.label !== selectedProfile);
				selectedProfile = qp.selectedItems.find((item) => (item as Item).id === 'profile')
					?.label as string;
			} else if (selectedProfiles.length === 0) {
				qp.selectedItems = [prePick, ...qp.selectedItems];
				selectedProfile = defaultProfile;
			}
		});
	});

	qp.dispose();

	if (selected === undefined) {
		return;
	}

	const runImmediately = selected.some((opt) => opt.id === 'runImmediately');
	const isLocal = selected.some((opt) => opt.id === 'isLocal');
	const profile = selected.find((item) => item.id === 'profile');

	const snippets = getShellSnippets()[Number(isLocal)];
	snippets.push({
		command,
		runImmediately,
		profile: profile?.label ?? defaultProfile,
	});

	await setShellSnippets(
		snippets,
		isLocal ? vscode.ConfigurationTarget.Workspace : vscode.ConfigurationTarget.Global
	);

	const view = getShellView();
	view.refresh();

	showInformationMessage(`Shell snippet added: ${command}`);
}

/** Get a shell command from the user */
async function getCommand(prevValue: string = ''): Promise<string | undefined> {
	const command = await showInputBox({
		prompt: 'Enter the new shell command',
		placeHolder: 'e.g., ls -la',
		value: prevValue,
	});

	return command?.trim();
}

/** Open vscode settings to manage profiles */
export async function manageProfiles() {
	const key = getPlatformKey();
	const settings: QuickPickItem[] = [
		{ label: `terminal.integrated.profiles.${key}` },
		{ label: `terminal.integrated.defaultProfile.${key}` },
		{ label: 'terminal.integrated.focusAfterRun' },
		{ label: 'terminal.integrated.defaultLocation' },
	];
	const setting = await showQuickPick(settings, { title: 'Pick a setting to open' });

	executeCommand(
		'workbench.action.openSettings',
		setting?.label ?? `terminal.integrated profile ${key}`
	);
}
