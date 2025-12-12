import { refreshAll } from '../utils';
import type { SnippetFileTreeItem } from '../../ui/templates';

/** snippetstudio.profile.link command handler */
export async function linkHandler(item: SnippetFileTreeItem) {
	const { manageLinkLocations } = await import('../../snippets/links/commands.js');
	await manageLinkLocations(!!item.contextValue?.includes('linked'), item.filepath);
	refreshAll();
}

/** snippetstudio.profile.import command handler */
export async function importHandler() {
	const { importCodeProfileSnippets } = await import('../../snippets/codeProfile.js');
	await importCodeProfileSnippets();
	refreshAll();
}
