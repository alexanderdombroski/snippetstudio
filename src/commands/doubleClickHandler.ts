import * as vscode from 'vscode';

function onDoubleClick(callback: (item: vscode.TreeItem) => void): (item: vscode.TreeItem) => void {
	const clickTimestamps: { [key: string]: number } = {};
	const doubleClickThreshold = 350; // Adjust as needed (milliseconds)

	return (item: vscode.TreeItem) => {
		if (item && item.label) {
			const now = Date.now();
			const lastClick = clickTimestamps[item.label.toString()] || 0;

			if (now - lastClick < doubleClickThreshold) {
				callback(item); // Execute callback on double-click
				clickTimestamps[item.label.toString()] = 0; // Reset timestamp
			} else {
				clickTimestamps[item.label.toString()] = now; // Update timestamp
			}
		}
	};
}

export default onDoubleClick;
