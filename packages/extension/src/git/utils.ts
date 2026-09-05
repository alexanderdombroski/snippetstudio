// -------------------------------------------------------------------
// ---------- Lazy Loaded - Only import with await import() ----------
// -------------------------------------------------------------------

import { showInputBox, showErrorMessage } from '../vscode';

/** prompts for a gist identifer and returns the id */
export async function getGistId() {
	const identifier = await showInputBox({
		title: 'Input a gist id, share url, or clone url',
	});
	if (identifier) {
		return extractGistId(identifier.trim());
	}
}

/** extracts a gist id from a url, clone url, or ssh url */
function extractGistId(identifier: string): string {
	// From share URL
	const shareUrlRegex = /https:\/\/gist\.github\.com\/[\w-]+\/([a-f0-9]+)/i;
	let match = identifier.match(shareUrlRegex);
	if (match) {
		return match[1];
	}

	// From Clone URL
	const cloneUrlRegex = /https:\/\/gist\.github\.com\/([a-f0-9]+)\.git/i;
	match = identifier.match(cloneUrlRegex);
	if (match) {
		return match[1];
	}

	// From SSH URL
	const sshUrlRegex = /git@gist\.github\.com:([a-f0-9]+)\.git/i;
	match = identifier.match(sshUrlRegex);
	if (match) {
		return match[1];
	}

	// (Gist ID itself)
	const gistIdRegex = /^[a-f0-9]+$/i;
	if (gistIdRegex.test(identifier)) {
		return identifier;
	}

	const error = new Error(`Invalid Gist identifier: ${identifier}`);
	showErrorMessage(error.message);
	throw error;
}
