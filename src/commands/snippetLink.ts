import * as vscode from 'vscode';
import path from 'path';
import fs from 'fs';
import { refreshAll } from './snippetFile';
import type { TreePathItem } from '../ui/templates';
import { addFileLink, removeFileLink } from '../snippets/links';
import { getActiveProfileSnippetsDir, getAllGlobalSnippetDirs } from '../utils/profile';
import { readSnippetFile, writeSnippetFile } from '../utils/jsoncFilesIO';
import type { VSCodeSnippets } from '../types';

async function initSnippetLinkCommands(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('snippetstudio.file.link.add', async (item: TreePathItem) => {
			if (await canBeLinked(path.basename(item.label))) {
				await copyToOtherProfiles(item.path);
				await addFileLink(item.label);
				refreshAll();
			} else {
				vscode.window.showWarningMessage(
					"It's not safe to watch for changes across all profiles when another file of it's same name exists in another profile."
				);
			}
		}),
		vscode.commands.registerCommand(
			'snippetstudio.file.link.remove',
			async (item: TreePathItem) => {
				await removeFileLink(item.label);
				vscode.window.showInformationMessage(
					'You can now delete the snippet file from your other profiles, if you would like.'
				);
				refreshAll();
			}
		)
	);
}

// -------------------- Helpers --------------------

async function canBeLinked(filename: string): Promise<boolean> {
	const snippetDirs = await getOtherProfileSnippetFolders();

	const existenceChecks = await Promise.all(
		snippetDirs.map(async (dir) => {
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
	return existenceChecks.every((exists) => !exists);
}

async function copyToOtherProfiles(filepath: string) {
	const basename = path.basename(filepath);
	const snippets = (await readSnippetFile(filepath)) as VSCodeSnippets;
	const dirs = await getOtherProfileSnippetFolders();
	await Promise.all(
		dirs.map(async (dir) => {
			const fp = path.join(dir, basename);
			await writeSnippetFile(fp, snippets, '', true);
		})
	);
}

async function getOtherProfileSnippetFolders(): Promise<string[]> {
	const activeDir = await getActiveProfileSnippetsDir();
	const allDirs = await getAllGlobalSnippetDirs();
	return allDirs.filter((dir) => dir !== activeDir);
}

export default initSnippetLinkCommands;
