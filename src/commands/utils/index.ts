import type { TreeItem } from 'vscode';
import { executeCommand } from '../../vscode';

/** only runs the callback after it is called in quick sucession */
export function onDoubleClick<T extends TreeItem>(callback: (item: T) => void): (item: T) => void {
	const clickTimestamps: { [key: string]: number } = {};
	const doubleClickThreshold = 350; // Adjust as needed (milliseconds)

	return (item: T) => {
		const now = Date.now();
		const lastClick = clickTimestamps[String(item.label)] || 0;

		if (now - lastClick < doubleClickThreshold) {
			callback(item); // Execute callback on double-click
			clickTimestamps[String(item.label)] = 0; // Reset timestamp
		} else {
			clickTimestamps[String(item.label)] = now; // Update timestamp
		}
	};
}

/** refresh snippet and location views */
export function refreshAll(hard?: boolean) {
	executeCommand('snippetstudio.refresh', hard);
}
