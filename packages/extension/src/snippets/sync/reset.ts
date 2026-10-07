import fs from 'node:fs/promises';
import path from 'node:path';
import type { AppName } from '../../types';
import { getUserPath } from '../../utils/context';
import { exists } from '../../utils/fsInfo';
import { getDeviceSettings } from '../../utils/local';
import { getConfirmation } from '../../utils/user';
import vscode, { showErrorMessage, showInformationMessage, showWarningMessage } from '../../vscode';
import { getLinkLocations, isSnippetLinked } from '../links/config';

/**
 * Resets global snippets in the current IDE using snippets from the default (starting) IDE.
 * Also updates any linked files across profiles and configured editors.
 */
export async function resetGlobalSnippets(skipConfirmation: boolean = false): Promise<boolean> {
	const config = await getDeviceSettings();
	const startingEditor = config?.['sync.startingEditor'];
	if (!startingEditor) {
		showErrorMessage('No default IDE (starting editor) configured to reset from.');
		return false;
	}

	if (startingEditor === vscode.env.appName) {
		showWarningMessage(
			'Current editor is already the default IDE. No need to reset global snippets.'
		);
		return false;
	}

	if (!skipConfirmation) {
		const confirmation = await getConfirmation(
			`Are you sure you want to reset your global snippets? This will overwrite your current IDE snippets to match your default IDE (${startingEditor}).`
		);
		if (!confirmation) {
			return false;
		}
	}

	const sourceSnippetsDir = path.join(getUserPath(startingEditor), 'snippets');
	if (!(await exists(sourceSnippetsDir))) {
		showErrorMessage(
			`Source snippets directory not found for ${startingEditor}: ${sourceSnippetsDir}`
		);
		return false;
	}

	const targetSnippetsDir = path.join(getUserPath(), 'snippets');

	// Reset snippets folder in target IDE
	await fs.rm(targetSnippetsDir, { recursive: true, force: true });
	await fs.mkdir(targetSnippetsDir, { recursive: true });
	await fs.cp(sourceSnippetsDir, targetSnippetsDir, { recursive: true });

	// Update linked files
	const editors = config?.['sync.editors'] ?? [vscode.env.appName as AppName];
	const entries = await fs.readdir(targetSnippetsDir);

	for (const filename of entries) {
		const targetFilePath = path.join(targetSnippetsDir, filename);
		const stat = await fs.stat(targetFilePath);
		if (!stat.isFile()) continue;

		for (const editor of editors) {
			if (await isSnippetLinked(targetFilePath, true, editor)) {
				const linkLocations = await getLinkLocations(targetFilePath, editor);
				if (linkLocations.length > 0) {
					const content = await fs.readFile(targetFilePath, 'utf-8');
					await Promise.all(
						linkLocations.map(async (dir) => {
							const destPath = path.join(dir, filename);
							await fs.mkdir(path.dirname(destPath), { recursive: true });
							await fs.writeFile(destPath, content, 'utf-8');
						})
					);
				}
			}
		}
	}

	showInformationMessage('Successfully reset global snippets.');
	return true;
}
