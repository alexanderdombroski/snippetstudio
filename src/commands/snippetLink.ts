import * as vscode from 'vscode';
import path from 'path';
import fs from 'fs';
import { refreshAll } from './snippetFile';
import type { TreePathItem } from '../ui/templates';
import { addFileLink, getLinkLocations, removeFileLink } from '../snippets/links';
import {
	getActiveProfileSnippetsDir,
	getAllGlobalSnippetDirs,
	getPathFromProfileLocation,
	getProfiles,
} from '../utils/profile';
import { readSnippetFile, writeSnippetFile } from '../utils/jsoncFilesIO';
import type { VSCodeSnippets } from '../types';

async function initSnippetLinkCommands(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('snippetstudio.file.link', async (item: TreePathItem) => {
			const isAlreadyLinked = item.contextValue?.includes('linked');
			const linkedSnippetPathDirs = isAlreadyLinked
				? await getLinkLocations(item.path)
				: [path.dirname(item.path)];

			if (isAlreadyLinked || (await canBeLinked(item.label))) {
				const items: vscode.QuickPickItem[] = (await getProfiles()).map(
					({ location, name, icon }) => {
						const detail = getPathFromProfileLocation(location);
						return {
							iconPath: new vscode.ThemeIcon(icon ?? 'account'),
							label: name,
							detail,
							description: location,
							picked: linkedSnippetPathDirs.includes(detail),
						};
					}
				);
				const selected = await vscode.window.showQuickPick(items, {
					canPickMany: true,
					title: `Choose which profiles ${item.label} should exist in (none is a complete delete)`,
				});
				if (selected === undefined) {
					return;
				}

				if (selected.length > 1) {
					await addFileLink(
						item.label,
						selected.map(({ description }) => description as string)
					);
				} else {
					await removeFileLink(item.label);
				}

				const snippets = (await readSnippetFile(item.path)) as VSCodeSnippets;
				Promise.all(
					selected.map(({ detail }) =>
						writeSnippetFile(path.join(detail as string, item.label), snippets, '', true)
					)
				);

				const notSelectedSnippetDirs = items
					.map((item) => item.detail as string)
					.filter((detail) => selected.every(({ detail: dir }) => dir !== detail));
				Promise.all(
					notSelectedSnippetDirs.map(async (dir) => {
						const fp = path.join(dir, item.label);
						try {
							await fs.promises.rm(fp);
						} catch {}
					})
				);
				vscode.window.showInformationMessage(
					`${item.label} is now used by ${selected.length} profiles`
				);
				refreshAll();
			}
		})
	);
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
			try {
				await fs.promises.access(filePath);
				return true; // File exists
			} catch {
				return false; // File doesn't exist
			}
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

export default initSnippetLinkCommands;
