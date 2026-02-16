import type { CancellationToken, DataTransfer, TreeDragAndDropController } from 'vscode';
import type { SnippetTreeItem } from './templates';
import { DataTransferItem, showWarningMessage } from '../vscode';
import { getCacheManager } from '../snippets/SnippetCacheManager';
import { snippetBodyAsString } from '../utils/string';
import type { VSCodeSnippets } from '../types';
import { writeSnippetFile } from '../utils/jsoncFilesIO';
import { refreshAll } from '../commands/utils';

/** Handles drag and drop reordering of snippets */
export class DragAndDropController implements TreeDragAndDropController<SnippetTreeItem> {
	viewId: string;
	dragMimeTypes: readonly string[];
	dropMimeTypes: readonly string[];

	constructor(viewId: string) {
		this.viewId = `application/vnd.code.tree.${viewId}`;
		this.dragMimeTypes = [viewId];
		this.dropMimeTypes = [viewId];
	}

	private cacheManager = getCacheManager();

	/** Handle drags from the tree view to the editor or other tree views */
	async handleDrag?(
		source: readonly SnippetTreeItem[],
		dataTransfer: DataTransfer,
		// eslint-disable-next-line no-unused-vars
		token: CancellationToken
	): Promise<void> {
		const draggableItems = source.filter((item) => item.contextValue === 'snippet');

		if (draggableItems.length === 0) {
			return;
		}

		const id = draggableItems[0].description;
		const snippets = (await this.cacheManager.getSnippets(
			draggableItems[0].path
		)) as VSCodeSnippets;
		const snippet = snippets?.[id];

		// Allow reordering snippets
		dataTransfer.set(this.viewId, new DataTransferItem({ id, fp: draggableItems[0].path }));

		// Allow dropping into editor
		const body = snippetBodyAsString(snippet?.body);
		dataTransfer.set('text/plain', new DataTransferItem(snippetBodyAsString(body)));
	}

	/** Handle drops from other tree views */
	async handleDrop?(
		target: SnippetTreeItem | undefined,
		dataTransfer: DataTransfer,
		// eslint-disable-next-line no-unused-vars
		token: CancellationToken
	): Promise<void> {
		if (target?.contextValue !== 'snippet') return; // No destination

		const item = dataTransfer.get(this.viewId);
		if (!item) return; // Not our drag

		if (item.value.id === target.description) return; // Drag canceled

		if (target.path !== item.value.fp) {
			showWarningMessage('Dragging to move snippets not implimented!');
			return;
		}

		const snippets = (await this.cacheManager.getSnippets(item.value.fp)) as VSCodeSnippets;
		const asArray = Object.entries(snippets);

		const dragIndex = asArray.findIndex((kvp) => kvp[0] === item.value.id);
		const dropIndex = asArray.findIndex((kvp) => kvp[0] === target.description);

		const draggedItem = asArray[dragIndex];

		const reorderedSnippets =
			dragIndex < dropIndex
				? // Moved down
					[
						...asArray.slice(0, dragIndex),
						...asArray.slice(dragIndex + 1, dropIndex + 1),
						draggedItem,
						...asArray.slice(dropIndex + 1),
					]
				: // Moved up
					[
						...asArray.slice(0, dropIndex),
						draggedItem,
						...asArray.slice(dropIndex, dragIndex),
						...asArray.slice(dragIndex + 1),
					];

		await writeSnippetFile(item.value.fp, Object.fromEntries(reorderedSnippets), '', true);
		await this.cacheManager.addSnippets(item.value.fp);
		refreshAll();
	}
}
