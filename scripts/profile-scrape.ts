import * as https from 'https';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { processJsonWithComments } from '../src/utils/jsoncFilesIO';

async function fetchProfile(url: string): Promise<any> {
	return new Promise((resolve, reject) => {
		https
			.get(url, (res) => {
				if (res.statusCode !== 200) {
					reject(new Error(`Failed to get ${url}, status: ${res.statusCode}`));
					res.resume();
					return;
				}
				let data = '';
				res.on('data', (chunk) => (data += chunk));
				res.on('end', async () => resolve(await processJsonWithComments(data)));
			})
			.on('error', reject);
	});
}

async function saveSnippets() {
	try {
		// Replace this URL to test other profiles
		const validProfiles = [
			'python',
			'angular',
			'doc-writer',
			'data-science',
			'java-general',
			'java-spring',
			'nodejs',
		];
		const url = `https://main.vscode-cdn.net/core/${validProfiles[0]}.code-profile`; // only python, data-science, and java-spring have snippets

		console.log(`Fetching profile from ${url}...`);
		let profile = await fetchProfile(url);

		if (!profile.snippets) {
			console.error('No snippets key found in profile');
			return;
		}

		const downloads = path.join(os.homedir(), 'Downloads');

		const snippets = await processJsonWithComments(profile.snippets);

		for (const [filename, fileContent] of Object.entries(snippets.snippets)) {
			console.log(filename);
			console.log(fileContent);
			// const parsed = await processJsonWithComments(snippets as string); // parse the stringified JSON
			const filePath = path.join(downloads, filename);
			fs.writeFileSync(filePath, fileContent as string, 'utf-8');
			console.log(`Saved ${filename} to ${filePath}`);
			break;
		}
	} catch (e) {
		console.error('Error:', e);
	}
}

(async function main() {
	await saveSnippets();
})();
