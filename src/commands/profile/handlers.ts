import { refreshAll } from '../utils';
import type { TreePathItem } from '../../ui/templates';

/** snippetstudio.profile.link command handler */
export async function linkHandler(item: TreePathItem) {
	const { manageLinkLocations } = await import('../../snippets/links/commands.js');
	await manageLinkLocations(!!item.contextValue?.includes('linked'), item.path);
	refreshAll();
}

/** snippetstudio.profile.import command handler */
export async function importHandler() {
	const { importCodeProfileSnippets } = await import('../../snippets/codeProfile.js');
	await importCodeProfileSnippets();
	refreshAll();
}
