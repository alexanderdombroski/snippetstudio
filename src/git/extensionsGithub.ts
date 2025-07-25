import type { Octokit } from '@octokit/core' with { 'resolution-mode': 'import' };
import getOctokitClient from './octokit';
import * as vscode from 'vscode';
import path from 'path';
import { chooseLocalGlobal } from '../utils/user';
import { getFileName } from '../snippets/newSnippetFile';
import type { PackageJsonSnippetsSection, VSCodeSnippets } from '../types';
import { processJsonWithComments, writeSnippetFile } from '../utils/jsoncFilesIO';
import { flattenScopedExtensionSnippets } from '../snippets/extension';

export async function importBuiltinExtension(context: vscode.ExtensionContext) {
	const client = await getOctokitClient(context);

	const snippetDirs = await getDirsWithSnippets(client);
	if (snippetDirs === undefined) {
		return;
	}

	const options: vscode.QuickPickItem[] = snippetDirs.map((dir) => ({
		label: dir.name,
		description: dir.path,
	}));
	const selected = await vscode.window.showQuickPick(options, {
		title: 'Choose a built in extension to import snippets from.',
	});
	if (selected === undefined) {
		return;
	}

	const snippetFiles = await folderRequest(client, `extensions/${selected.label}/snippets`);
	if (snippetFiles === undefined) {
		return vscode.window.showInformationMessage("Couldn't find any snippets");
	}

	const [pkgContent, dirpath] = await Promise.all([
		fileTextRequest(client, `extensions/${selected.label}/package.json`),
		chooseLocalGlobal(),
	]);
	if (dirpath === undefined) {
		return;
	}

	const pkg: PackageJsonSnippetsSection = JSON.parse(pkgContent);

	const verifiedSnippetFiles = snippetFiles.filter((file) => {
		const ext = path.extname(file.name);
		return file.type === 'file' && (ext === '.code-snippets' || ext === '.json');
	});

	for (const file of verifiedSnippetFiles) {
		const basename =
			((await getFileName(`Type a filename to copy ${file.name} into`, true)) ||
				crypto.randomUUID()) + '.code-snippets';

		const langId = pkg.contributes?.snippets?.find(
			({ path: fp }) => file.name === path.basename(fp)
		)?.language;

		const snippets = flattenScopedExtensionSnippets(
			(await processJsonWithComments(
				await fileTextRequest(client, `extensions/${selected.label}/snippets/${file.name}`)
			)) as VSCodeSnippets
		);
		Object.values(snippets).forEach((s) => (s.scope = langId));
		await writeSnippetFile(path.join(dirpath, basename), snippets);
	}
}

async function getDirsWithSnippets(client: Octokit) {
	const res = await folderRequest(client, 'extensions');
	const folders = res?.filter((item) => item.type === 'dir') ?? [];

	const extFolders = Array(folders.length);

	return await vscode.window.withProgress(
		{
			title: 'Scanning built in extensions for snippets',
			location: vscode.ProgressLocation.Notification,
			cancellable: true,
		},
		async (progress, token) => {
			let index = 0;
			const CONCURRENCY_LIMIT = 10;

			async function worker() {
				while (index < folders.length && !token.isCancellationRequested) {
					const currentIndex = index++;
					const folder = folders[currentIndex];

					progress.report({
						message: `Processing ${index}/${extFolders.length} extensions of the vscode github repo`,
						increment: (1 / extFolders.length) * 100,
					});

					const subItems = await folderRequest(client, `extensions/${folder.name}`);

					const hasSnippets = subItems?.some(
						(item) => item.type === 'dir' && item.name === 'snippets'
					);
					extFolders[currentIndex] = hasSnippets ? folder : undefined;
				}
			}

			// Start workers
			const workers = Array(CONCURRENCY_LIMIT)
				.fill(0)
				.map(() => worker());

			await Promise.all(workers);

			if (token.isCancellationRequested) {
				return;
			}

			const extensionWithSnippets = extFolders.filter((folder) => folder !== undefined);

			return extensionWithSnippets;
		}
	);
}

async function folderRequest(client: Octokit, fp: string) {
	const { data } = await client.request('GET /repos/{owner}/{repo}/contents/{path}', {
		owner: 'microsoft',
		repo: 'vscode',
		path: fp,
	});
	if (Array.isArray(data)) {
		return data;
	}
}

async function fileTextRequest(client: Octokit, path: string): Promise<string> {
	const { data }: any = await client.request('GET /repos/{owner}/{repo}/contents/{path}', {
		owner: 'microsoft',
		repo: 'vscode',
		path,
		headers: {
			accept: 'application/vnd.github+json',
		},
	});

	return Buffer.from(data.content, 'base64').toString('utf8');
}
