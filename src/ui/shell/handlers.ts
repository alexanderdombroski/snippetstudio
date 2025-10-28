// -------------------------------------------------------------------
// ---------- Lazy Loaded - Only import with await import() ----------
// -------------------------------------------------------------------

import type { QuickPickItem } from 'vscode';
import vscode, {
	showErrorMessage,
	createTerminal,
	ThemeIcon,
	showInputBox,
	showQuickPick,
	showInformationMessage,
	getConfiguration,
	createQuickPick,
	showWarningMessage,
} from '../../vscode';
import { getShellView, type ShellTreeItem } from './ShellViewProvider';
import { getShellSnippets, setShellSnippets } from './config';
import { getConfirmation } from '../../utils/user';
import {
	findInactiveTerminal,
	getAllShellProfiles,
	getDefaultShellProfile,
	getShellProfileNames,
} from './utils';

/** Command handler to edit an existing shell snippet */
export async function editShellSnippet(item: ShellTreeItem) {
	try {
		const command = await getCommand(item.label);

		if (!command) {
			return;
		}

		// Get available shell profiles for editing
		const profileNames = getShellProfileNames();
		const profileItems: QuickPickItem[] = profileNames.map((name) => ({
			label: name,
			description: name === item.profile ? 'Current' : undefined,
			picked: name === item.profile,
		}));

		const selectedProfile = await showQuickPick(profileItems, {
			title: 'Select shell profile for this snippet',
			placeHolder: 'Choose the shell profile to use when running this snippet',
		});

		if (selectedProfile === undefined) {
			return;
		}

		const snippets = getShellSnippets()[Number(item.isLocal)];
		const index = snippets.findIndex((s) => s.command === item.label);

		if (index === -1) {
			await showErrorMessage('Snippet not found for editing.');
			return;
		}

		snippets[index].command = command;
		snippets[index].profile = selectedProfile.label;

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
		// Get the profile configuration to create the correct terminal
		const platform =
			process.platform === 'win32' ? 'windows' : process.platform === 'darwin' ? 'osx' : 'linux';

		const config = getConfiguration('terminal.integrated');
		const profiles = config.get<Record<string, any>>(`profiles.${platform}`) || {};
		const profileConfig = profiles[item.profile];

		// Create terminal options based on the profile
		const terminalOptions: any = {
			iconPath: new ThemeIcon('repo'),
			name: `snippetstudio (${item.profile})`,
		};

		// If profile has specific configuration, use it
		if (profileConfig) {
			if (profileConfig.path) {
				terminalOptions.shellPath = profileConfig.path;
			}
			if (profileConfig.args) {
				terminalOptions.shellArgs = profileConfig.args;
			}
		}

		// Find an existing terminal with the same profile or create a new one
		let terminal = await findInactiveTerminal();

		// If no inactive terminal or we need a specific profile, create a new terminal
		if (!terminal || item.profile !== getDefaultShellProfile()) {
			terminal = createTerminal(terminalOptions);
		}

		terminal.show(true);
		terminal.sendText(item.label, item.runImmediately);
	} catch (err) {
		await showErrorMessage(`Failed to run command because ${err}`);
	}
}

/** Command handler to create a new shell snippet */
export async function createShellSnippet() {
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
	const profiles = getAllShellProfiles();
	if (!(defaultProfile in profiles)) {
		showWarningMessage(
			"VS Code configuration for `terminal.integrated.profiles` will cause issues because profile list is empty or doesn't contain the default."
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
	qp.selectedItems = [prePick];

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
