import fs from 'node:fs/promises';
import type { AppName } from '../../types';
import { editorAppNames, getUserPath } from '../../utils/context';
import { exists } from '../../utils/fsInfo';
import { getDeviceSettings, getLocalDataDir, writeDeviceSettings } from '../../utils/local';
import { getConfirmation } from '../../utils/user';
import vscode, { executeCommand, showInformationMessage, showQuickPick } from '../../vscode';
import path from 'node:path';
import type { QuickPickItem } from 'vscode';

const upgradeWarning = `
Snippet Studio v5 changes how snippets are stored.

v4: Snippets are specific to each IDE.
v5+: Shared snippets across IDEs, with optional cloud sync

Project-specific snippets work in both versions.
Profiles are IDE-specific, so their snippets remain IDE-sepcific.

Continue with v5?
`.trim();

export async function showUpgradeWarning() {
	const shouldContinue = await getConfirmation(upgradeWarning);
	if (!shouldContinue) {
		// navigate the user to install version 4
		showInformationMessage(
			"Install v4 if you'd like. If you change your mind, restart the extension to complete setup of v5."
		);
		executeCommand('workbench.extensions.action.showExtensionsWithIds', [
			'AlexDombroski.snippetstudio',
		]);
	}
	return shouldContinue;
}

export async function isSetup() {
	const config = await getDeviceSettings();
	return !!config?.['sync.editors']?.includes(vscode.env.appName as AppName);
}

async function pickEditor(prompt: string) {
	const items: QuickPickItem[] = [];
	for (const editor of editorAppNames) {
		if (await exists(getUserPath(editor))) {
			items.push({ label: editor });
		}
	}

	const editor = await showQuickPick(items, { prompt });
	if (!editor?.label) {
		await pickEditor(prompt);
	}
	return editor!.label as AppName;
}

/** Setups sync and returns setup success status */
export async function runSetupFlow(): Promise<boolean> {
	if (await isSetup()) return true;

	const shouldContinue = await showUpgradeWarning();
	if (!shouldContinue) return false;

	const config = (await getDeviceSettings()) ?? {};
	if (!config['sync.startingEditor']) {
		const editor = await pickEditor(
			"Which editor's snippets would you like SnippetStudio to use as a starting point?"
		);
		config['sync.startingEditor'] = editor;
		await fs.cp(
			path.join(getUserPath(editor), 'snippets'),
			path.join(getLocalDataDir(), 'snippets'),
			{ recursive: true }
		);
	}

	if (config['sync.startingEditor'] !== vscode.env.appName) {
		await fs.cp(
			path.join(getUserPath(config['sync.startingEditor']), 'snippets'),
			path.join(getUserPath(), 'snippets'),
			{ recursive: true }
		);
	}

	const enabledEditors = config['sync.editors'] ?? [];
	enabledEditors.push(vscode.env.appName as AppName);
	config['sync.editors'] = enabledEditors;
	await writeDeviceSettings(config);
	return true;
}
