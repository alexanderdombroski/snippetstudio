import fs from 'fs';
import path from 'path';

export async function expandGitignore(repoPath: string) {
	const ignorePath = path.join(repoPath, '.gitignore');
	const entriesToAdd = ['.env', 'temp/', '.DS_Store'];

	if (!fs.existsSync(ignorePath)) {
		fs.writeFileSync(ignorePath, entriesToAdd.join('\n') + '\n');
	} else {
		const current = fs
			.readFileSync(ignorePath, 'utf8')
			.split('\n')
			.map((line) => line.trim());
		const updated = [...new Set([...current, ...entriesToAdd])].filter(Boolean);
		await fs.promises.writeFile(ignorePath, updated.join('\n') + '\n');
	}
}
export async function createReadme(repoPath: string) {
	const readPath = path.join(repoPath, 'README.md');
	if (!fs.existsSync(readPath)) {
		const text = [
			'# My VS Code Snippets',
			'Read [documentation](https://code.visualstudio.com/docs/editing/userdefinedsnippets) to learn more about snippets!',
			'Use the [SnippetStudio extension](https://marketplace.visualstudio.com/items?itemName=AlexDombroski.snippetstudio) to easier manage and create snippets! Or also check out the source code on [GitHub](https://github.com/alexanderdombroski/snippetstudio)',
		].join('\n\n');
		await fs.promises.writeFile(readPath, text);
	}
}
