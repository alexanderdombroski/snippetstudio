import type { TreePathItem } from '../../ui/templates';
import { executeCommand } from '../../vscode';

/** only runs the callback after it is called in quick sucession */
export function onDoubleClick(
	callback: (item: TreePathItem) => void
): (item: TreePathItem) => void {
	const clickTimestamps: { [key: string]: number } = {};
	const doubleClickThreshold = 350; // Adjust as needed (milliseconds)

	return (item: TreePathItem) => {
		const now = Date.now();
		const lastClick = clickTimestamps[item.label.toString()] || 0;

		if (now - lastClick < doubleClickThreshold) {
			callback(item); // Execute callback on double-click
			clickTimestamps[item.label.toString()] = 0; // Reset timestamp
		} else {
			clickTimestamps[item.label.toString()] = now; // Update timestamp
		}
	};
}

/** refresh snippet and location views */
export function refreshAll() {
	executeCommand('snippetstudio.refresh');
	executeCommand('snippetstudio.refreshLocations');
}
