import type { ShellTreeDropdown, ShellTreeItem } from '../../ui/shell/ShellViewProvider';

/** snippetstudio.shell.create command handler */
export async function createHandler(item?: ShellTreeDropdown) {
	const { createShellSnippet } = await import('../../ui/shell/actions.js');
	createShellSnippet(item);
}

/** snippetstudio.shell.edit command handler */
export async function editHandler(item: ShellTreeItem) {
	const { editShellSnippet } = await import('../../ui/shell/actions.js');
	editShellSnippet(item);
}

/** snippetstudio.shell.delete command handler */
export async function deleteHandler(item: ShellTreeItem) {
	const { deleteShellSnippet } = await import('../../ui/shell/actions.js');
	deleteShellSnippet(item);
}

/** snippetstudio.shell.run command handler */
export async function runHandler(item: ShellTreeItem) {
	const { runShellSnippet } = await import('../../ui/shell/actions.js');
	runShellSnippet(item);
}

/** snippetstudio.shell.refresh command handler */
export async function refreshHandler() {
	const { getShellView } = await import('../../ui/shell/ShellViewProvider.js');
	getShellView().refresh();
}

/** snippetstudio.shell.manageProfiles command handler */
export async function manageProfilesHandler() {
	const { manageProfiles } = await import('../../ui/shell/actions.js');
	manageProfiles();
}
