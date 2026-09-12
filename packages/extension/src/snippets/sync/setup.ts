// -------------------------------------------------------------------
// ---------- Lazy Loaded - Only import with await import() ----------
// -------------------------------------------------------------------

import { commandExists } from '../../utils/fsInfo';
import {
	createTerminal,
	executeCommand,
	openExternal,
	showInformationMessage,
	showQuickPick,
	ThemeIcon,
	Uri,
} from '../../vscode';
import { getEditorList } from './editors';
import { editConfig, readMachineConfig } from '../../utils/machineConfig';

export async function setup() {
	// 1. Install freefilesync
	if (!commandExists('freefilesync')) {
		await installFreeFileSync();

		const action = await showInformationMessage(
			'Install Freefilesync, restart extension, and run the command again.',
			'Restart Extension'
		);
		if (action === 'Restart Extension') {
			executeCommand('workbench.action.restartExtensionHost');
		}
		return;
	}

	// 2. Pick default editor
	const currentConfig = await readMachineConfig();
	const savedDefaultEditor = currentConfig?.['sync.defaultEditor'] as string | undefined;

	const editors = await getEditorList();
	const selected = await showQuickPick(
		editors.map((editor) => ({
			label: editor.label,
			editor,
			detail: editor.label === savedDefaultEditor ? 'current' : undefined,
		})),
		{
			title: "Which editor's snippets should all other editors use",
			canPickMany: false,
		}
	);

	if (!selected?.editor) return;

	await editConfig('sync.defaultEditor', selected.editor.label);

	// 3. Choose which editors to sync
	const savedSyncedEditors = (currentConfig?.['sync.editors'] as string[] | undefined) ?? null;

	const editorChoices = await showQuickPick(
		editors.map((editor) => ({
			label: editor.label,
			description: editor.userPath,
			editor,
			picked: savedSyncedEditors?.includes(editor.label),
		})),
		{
			title: 'Select editors to sync',
			canPickMany: true,
		}
	);

	if (!editorChoices) return;

	await editConfig(
		'sync.editors',
		editorChoices.map((choice) => choice.editor.label)
	);

	await editConfig('sync.enabled', true);
}

// TODO: Move everything to use freefilesync or have my extension own the sync?
async function installFreeFileSync() {
	if (process.platform === 'win32') {
		if (commandExists('winget')) {
			return await installUsingCli('winget install -e --id Syncthing.Syncthing');
		}
	} else if (process.platform === 'darwin') {
		if (commandExists('brew')) {
			return await installUsingCli('brew install --cask freefilesync');
		}
	} else if (process.platform === 'linux') {
		if (commandExists('apk')) {
			return await installUsingCli('apk add --update syncthing');
		} else if (commandExists('apt-get')) {
			return await openExternal(Uri.parse('https://apt.syncthing.net'));
		}
	}

	await openExternal(Uri.parse('https://freefilesync.org/download.php'));
}

async function installUsingCli(cmd: string) {
	const terminal = createTerminal({
		iconPath: new ThemeIcon('repo'),
		name: 'snippetstudio',
	});
	terminal.sendText(cmd, false);
	terminal.show();
}
