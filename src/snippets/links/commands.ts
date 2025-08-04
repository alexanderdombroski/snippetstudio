// -------------------------------------------------------------------
// ---------- Lazy Loaded - Only import with await import() ----------
// -------------------------------------------------------------------

import vscode from '../../vscode';
import path from 'node:path';
import fs from 'node:fs/promises';
import { addFileLink, getLinkLocations, removeFileLink } from './config';
import {
	getAllGlobalSnippetDirs,
	getPathFromProfileLocation,
	getProfiles,
} from '../../utils/profile';
import { readSnippetFile, writeSnippetFile } from '../../utils/jsoncFilesIO';
import { exists } from '../../utils/fsInfo';
import type { VSCodeSnippets } from '../../types';

export async function manageLinkLocations(isAlreadyLinked: boolean, filepath: string) {
	const linkedSnippetPathDirs = isAlreadyLinked
		? await getLinkLocations(filepath)
		: [path.dirname(filepath)];
	const filename = path.basename(filepath);
	if (isAlreadyLinked || (await canBeLinked(filename))) {
		const items: vscode.QuickPickItem[] = (await getProfiles()).map(({ location, name, icon }) => {
			const detail = getPathFromProfileLocation(location);
			return {
				iconPath: new vscode.ThemeIcon(icon ?? 'account'),
				label: name,
				detail,
				description: location,
				picked: linkedSnippetPathDirs.includes(detail),
			};
		});
		const selected = await vscode.window.showQuickPick(items, {
			canPickMany: true,
			title: `Choose which profiles ${filename} should exist in (none is a complete delete)`,
		});
		if (selected === undefined) {
			return;
		}

		if (selected.length > 1) {
			await addFileLink(
				filename,
				selected.map(({ description }) => description as string)
			);
		} else {
			await removeFileLink(filename);
		}

		const snippets = (await readSnippetFile(filepath)) as VSCodeSnippets;
		Promise.all(
			selected.map(({ detail }) =>
				writeSnippetFile(path.join(detail as string, filename), snippets, '', true)
			)
		);

		const notSelectedSnippetDirs = items
			.map((item) => item.detail as string)
			.filter((detail) => selected.every(({ detail: dir }) => dir !== detail));
		Promise.all(
			notSelectedSnippetDirs.map(async (dir) => {
				const fp = path.join(dir, filename);
				try {
					await fs.rm(fp);
				} catch {}
			})
		);
		vscode.window.showInformationMessage(`${filename} is now used by ${selected.length} profiles`);
	}
}

// -------------------- Helpers --------------------

async function canBeLinked(filename: string): Promise<boolean> {
	const allDirs = await getAllGlobalSnippetDirs();
	if (allDirs.length <= 1) {
		vscode.window.showInformationMessage('You have no other vscode profiles.');
		return false;
	}

	const existenceChecks = await Promise.all(
		allDirs.map(async (dir) => {
			const filePath = path.join(dir, filename);
			return await exists(filePath);
		})
	);

	// Return true only if file does NOT exist in any of the snippetDirs
	const safe = existenceChecks.filter((exists) => exists).length <= 1;
	if (!safe) {
		vscode.window.showWarningMessage(
			"It's not safe to watch for changes across all profiles when another file of it's same name exists in another profile."
		);
	}
	return safe;
}
