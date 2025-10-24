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
} from '../../vscode';
import { getShellView, type ShellTreeItem } from './ShellViewProvider';
import { getShellSnippets, setShellSnippets } from './config';
import { getConfirmation } from '../../utils/user';
import { findInactiveTerminal, getDefaultShellProfile, getShellProfileNames } from './utils';

/** Command handler to edit an existing shell snippet */
export async function editShellSnippet(item: ShellTreeItem) {
	try {
		const command = await getCommand(item.label);

		if (!command) {
			return;
		}

		// Get available shell profiles for editing
		const profileNames = getShellProfileNames();
		const profileItems: QuickPickItem[] = profileNames.map(name => ({
			label: name,
			description: name === item.profile ? 'Current' : undefined,
			picked: name === item.profile
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
		const platform = process.platform === 'win32' ? 'windows' : 
			process.platform === 'darwin' ? 'osx' : 'linux';
		
		const config = getConfiguration('terminal.integrated');
		const profiles = config.get<Record<string, any>>(`profiles.${platform}`) || {};
		const profileConfig = profiles[item.profile];
		
		// Create terminal options based on the profile
		const terminalOptions: any = {
			iconPath: new ThemeIcon('repo'),
			name: `snippetstudio (${item.profile})`
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

	// Get available shell profiles
	const profileNames = getShellProfileNames();
	const defaultProfile = getDefaultShellProfile();

	// Create profile selection items
	const profileItems: QuickPickItem[] = profileNames.map(name => ({
		label: name,
		description: name === defaultProfile ? 'Default' : undefined,
		picked: name === defaultProfile
	}));

	const selectedProfile = await showQuickPick(profileItems, {
		title: 'Select shell profile for this snippet',
		placeHolder: 'Choose the shell profile to use when running this snippet',
	});

	if (selectedProfile === undefined) {
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

	snippets.push({ command, runImmediately, profile: selectedProfile.label });

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
