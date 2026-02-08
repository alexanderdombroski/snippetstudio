import type { Uri } from 'vscode';
import type { SnippetFileTreeItem, SnippetTreeItem } from '../../ui/templates';
import { refreshAll } from '../utils';

/** snippetstudio.snippet.showBody command handler */
export async function showBodyHandler(item: SnippetTreeItem) {
	const { peekAtSnippet } = await import('../../ui/peeker/peek.js');
	await peekAtSnippet(item.path, item.description);
}

/** snippetstudio.snippet.addGlobal command handler */
export async function addGlobalHandler() {
	const { createGlobalSnippet } = await import('../../ui/editor/actions.js');
	await createGlobalSnippet();
}

/** snippetstudio.snippet.createAt command handler */
export async function createAtHandler(item: SnippetFileTreeItem) {
	const { createSnippetAt } = await import('../../ui/editor/actions.js');
	await createSnippetAt(item.filepath);
}

/** snippetstudio.snippet.fromSelection command handler */
export async function fromSelectionHandler() {
	const { createSnippetFromSelection } = await import('../../ui/editor/actions.js');
	await createSnippetFromSelection();
}

/** snippetstudio.snippet.edit command handler */
export async function editHandler(item: SnippetTreeItem) {
	const { editExistingSnippet } = await import('../../ui/editor/actions.js');
	await editExistingSnippet(item);
}

/** snippetstudio.snippet.delete command handler */
export async function deleteSnippetHandler(item: SnippetTreeItem) {
	const { deleteSnippet } = await import('../../snippets/updateSnippets.js');
	await deleteSnippet(item.path, item.description);
	refreshAll(true);
}

/** snippetstudio.snippet.move command handler */
export async function moveHandler(item: SnippetTreeItem) {
	const { moveSnippet } = await import('../../snippets/updateSnippets.js');
	await moveSnippet(item);
	refreshAll(true);
}

/** snippetstudio.snippet.newTemplate command handler */
export async function newTemplateHandler(fileUri: Uri) {
	const { createFileTemplate } = await import('../../ui/editor/actions.js');
	await createFileTemplate(fileUri);
}

/** snippetstudio.snippet.usingPattern command handler */
export async function usingPatternHandler(fileUri: Uri) {
	const { createSnippetUsingFileExtension } = await import('../../ui/editor/actions.js');
	await createSnippetUsingFileExtension(fileUri);
}

/** snippetstudio.snippet.addKeybinding command handler */
export async function addKeybindingHandler(item: SnippetTreeItem) {
	const { promptAddKeybinding } = await import('../../snippets/keyBindings.js');
	await promptAddKeybinding(item);
}
