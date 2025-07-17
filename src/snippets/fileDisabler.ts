import fs from 'fs';
import path from 'path';

export async function enableFile(filepath: string) {
	const parsed = path.parse(filepath);
	if (isDisabled(parsed.base)) {
		const base = formatEnabled(parsed.base);
		const newPath = path.join(parsed.dir, base);
		await fs.promises.rename(filepath, newPath);
	}
}

export async function disableFile(filepath: string) {
	await fs.promises.rename(filepath, formatDisabled(filepath));
}

export async function enableAllFiles(filepaths: string[]) {
	await Promise.all(filepaths.map((fp) => enableFile(fp)));
}

export function getFileToSave(expectedPath: string): string {
	const otherVersion = isDisabled(expectedPath)
		? formatEnabled(expectedPath)
		: formatDisabled(expectedPath);
	return fs.existsSync(otherVersion) ? otherVersion : expectedPath;
}

/**
 * Temporarily enable all snippet files for the duration of a callback
 */
export async function temporarilyEnableAll(
	filePaths: string[],
	callback: () => Promise<void> | void
) {
	const disabledPaths = filePaths.filter((fp) => isDisabled(fp));
	await enableAllFiles(disabledPaths);
	try {
		await callback();
	} finally {
		await Promise.all(disabledPaths.map((fp) => disableFile(formatEnabled(fp))));
	}
}

const isDisabled = (fp: string) => fp.endsWith('.disabled');
const formatDisabled = (fp: string) => `${fp}.disabled`;
const formatEnabled = (fp: string) => fp.replace(/\.disabled$/, '');
