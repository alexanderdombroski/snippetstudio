// -------------------------------------------------------------------
// ---------- Lazy Loaded - Only import with await import() ----------
// -------------------------------------------------------------------

import type { ExtensionContext, QuickPickItem } from 'vscode';
import vscode, { showQuickPick, showInformationMessage } from '../vscode';
import type { Octokit } from '@octokit/core' with { 'resolution-mode': 'import' };
import { getOctokitClient } from './octokit';
import path from 'node:path';
import { chooseLocalGlobal, getFileName } from '../utils/user';
import type { PackageJsonSnippetsSection, VSCodeSnippets } from '../types';
import { processJsonWithComments, writeSnippetFile } from '../utils/jsoncFilesIO';
import { flattenScopedExtensionSnippets } from '../snippets/extension/locate';
import { exists } from '../utils/fsInfo';

export async function importBuiltinExtension(context: ExtensionContext) {
	const client = await getOctokitClient(context);

	const snippetDirs = await __getDirsWithSnippets(client);
	if (snippetDirs === undefined) {
		return;
	}

	const options: QuickPickItem[] = snippetDirs.map((dir) => ({
		label: dir.name,
		description: dir.path,
	}));
	const selections = await showQuickPick(options, {
		title: 'Choose a built in extension to import snippets from.',
		canPickMany: true,
	});
	if (!selections?.length) {
		return;
	}

	const dirpath = await chooseLocalGlobal();
	if (dirpath === undefined) {
		return;
	}

	for (const selection of selections) {
		const [snippetFiles, pkgContent] = await Promise.all([
			__folderRequest(client, `extensions/${selection.label}/snippets`),
			__fileTextRequest(client, `extensions/${selection.label}/package.json`),
		]);

		if (snippetFiles === undefined) {
			showInformationMessage(`Couldn't find any snippets for ${selection.label}`);
			continue;
		}

		const pkg: PackageJsonSnippetsSection = JSON.parse(pkgContent);

		const verifiedSnippetFiles = snippetFiles.filter((file) => {
			const ext = path.extname(file.name);
			return file.type === 'file' && (ext === '.code-snippets' || ext === '.json');
		});

		const snippetContents = await Promise.all(
			verifiedSnippetFiles.map((file) =>
				__fileTextRequest(client, `extensions/${selection.label}/snippets/${file.name}`)
			)
		);

		for (const [i, file] of verifiedSnippetFiles.entries()) {
			const basename =
				(await getFileName(
					`Type a filename to copy ${file.name} from ${selection.label} into`,
					true
				)) + '.code-snippets';

			const langId = pkg.contributes?.snippets?.find(
				({ path: fp }) => file.name === path.basename(fp)
			)?.language;

			const snippets = flattenScopedExtensionSnippets(
				(await processJsonWithComments(snippetContents[i])) as VSCodeSnippets
			);

			Object.values(snippets).forEach((s) => (s.scope = langId));
			const fp = path.join(dirpath, basename);
			await writeSnippetFile(
				(await exists(fp)) ? path.join(dirpath, crypto.randomUUID() + '.code-snippets') : fp,
				snippets
			);
		}
	}
}

export async function __getDirsWithSnippets(client: Octokit) {
	const res = await __folderRequest(client, 'extensions');
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

					const subItems = await __folderRequest(client, `extensions/${folder.name}`);

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

export async function __folderRequest(client: Octokit, fp: string) {
	const { data } = await client.request('GET /repos/{owner}/{repo}/contents/{path}', {
		owner: 'microsoft',
		repo: 'vscode',
		path: fp,
	});
	if (Array.isArray(data)) {
		return data;
	}
}

export async function __fileTextRequest(client: Octokit, path: string): Promise<string> {
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
