import { exists } from '../../utils/fsInfo';
import { APP_NAMES, getUserPath, type AppNameKey } from '../../utils/context';

export type Editor = {
	label: string;
	userPath: string;
};

let detectedEditors: Editor[] = [];

export async function getEditorList(): Promise<Editor[]> {
	if (!detectedEditors.length) {
		const editors: Editor[] = [];

		for (const label of Object.keys(APP_NAMES) as AppNameKey[]) {
			try {
				const userPath = getUserPath(label);
				if (await exists(userPath)) {
					editors.push({ label, userPath });
				}
			} catch {
				// Ignore unsupported platforms or path resolution errors
			}
		}

		detectedEditors = editors;
	}

	return detectedEditors;
}
