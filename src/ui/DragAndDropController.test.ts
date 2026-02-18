import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import type {
	CancellationToken,
	DataTransfer,
	DataTransferItem as DataTransferItemType,
} from 'vscode';
import { DragAndDropController } from './DragAndDropController';
import type { LanguageDropdown, SnippetFileTreeItem, SnippetTreeItem } from './templates';
import type { VSCodeSnippets } from '../types';
import { DataTransferItem } from '../vscode';
import { refreshAll } from '../commands/utils';
import { readSnippetFile, writeSnippetFile } from '../utils/jsoncFilesIO';
import { moveSnippetToDestination } from '../snippets/updateSnippets';
import { getCacheManager } from '../snippets/SnippetCacheManager';

vi.mock('../commands/utils');
vi.mock('../utils/jsoncFilesIO');
vi.mock('../snippets/updateSnippets.js');

const createMockDataTransfer = (): DataTransfer => {
	const map = new Map<string, DataTransferItemType>();
	const dataTransfer: Partial<DataTransfer> = {
		get: (mimeType: string) => map.get(mimeType),
		set: (mimeType: string, value: DataTransferItemType) => map.set(mimeType, value),
	};
	return dataTransfer as DataTransfer;
};

const viewId = 'snippet-studio';

beforeEach(() => {
	const cache = getCacheManager();
	cache.snippets.clear();
});

describe('ui/DragAndDropController', () => {
	let dndController: DragAndDropController;
	let dataTransfer: DataTransfer;
	const token = {} as CancellationToken;

	beforeEach(() => {
		dndController = new DragAndDropController(viewId);
		dataTransfer = createMockDataTransfer();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it('should construct with correct properties', () => {
		expect(dndController.viewId).toBe(`application/vnd.code.tree.${viewId}`);
		expect(dndController.dragMimeTypes).toEqual([dndController.viewId]);
		expect(dndController.dropMimeTypes).toEqual([dndController.viewId]);
	});

	describe('handleDrag', () => {
		const mockSnippetItem: SnippetTreeItem = {
			contextValue: 'snippet',
			description: 'mock-snippet-1',
			path: '/path/to/snippets.code-snippets',
			label: 'mock-snippet-1',
		} as SnippetTreeItem;

		const mockSnippets: VSCodeSnippets = {
			'mock-snippet-1': { prefix: 'mock1', body: 'body1' },
			'mock-snippet-2': { prefix: 'mock2', body: 'body2' },
		};

		it('should do nothing if source contains no draggable items', async () => {
			await dndController.handleDrag?.([], dataTransfer, token);
			expect(dataTransfer.get(dndController.viewId)).toBeUndefined();

			const dropdown: LanguageDropdown = { contextValue: 'language-dropdown' };
			await dndController.handleDrag?.([dropdown as SnippetTreeItem], dataTransfer, token);
			expect(dataTransfer.get(dndController.viewId)).toBeUndefined();
		});

		it('should set data transfer items on drag', async () => {
			(readSnippetFile as Mock).mockResolvedValue(mockSnippets);
			await dndController.handleDrag?.([mockSnippetItem], dataTransfer, token);

			const dndItem = dataTransfer.get(dndController.viewId);
			expect(dndItem).toBeInstanceOf(DataTransferItem);
			expect(dndItem?.value).toEqual({ id: 'mock-snippet-1', fp: mockSnippetItem.path });

			const textItem = dataTransfer.get('text/plain');
			expect(textItem).toBeInstanceOf(DataTransferItem);
			expect(textItem?.value).toBe('body1');
		});
	});

	describe('handleDrop', () => {
		const sourceItemValue = { id: 'source-id', fp: '/path/to/source.code-snippets' };
		const mockSourceItem = new DataTransferItem(sourceItemValue);

		const mockTargetSnippet: SnippetTreeItem = {
			contextValue: 'snippet',
			description: 'target-id',
			path: '/path/to/target.code-snippets',
		} as SnippetTreeItem;

		const mockTargetFile: SnippetFileTreeItem = {
			contextValue: 'snippet-filepath',
			filepath: '/path/to/target.code-snippets',
		} as SnippetFileTreeItem;

		beforeEach(() => {
			dataTransfer.set(dndController.viewId, mockSourceItem);
		});

		it('should do nothing if there is no target', async () => {
			await dndController.handleDrop?.(undefined, dataTransfer, token);
			expect(moveSnippetToDestination).not.toHaveBeenCalled();
			expect(writeSnippetFile).not.toHaveBeenCalled();
		});

		it('should do nothing for a non-matching drag', async () => {
			const otherDataTransfer = createMockDataTransfer();
			await dndController.handleDrop?.(mockTargetSnippet, otherDataTransfer, token);
			expect(moveSnippetToDestination).not.toHaveBeenCalled();
		});

		it('should do nothing if dropped on itself', async () => {
			const selfTarget = { ...mockTargetSnippet, description: sourceItemValue.id };
			await dndController.handleDrop?.(selfTarget, dataTransfer, token);
			expect(moveSnippetToDestination).not.toHaveBeenCalled();
		});

		it('should do nothing if dropped on an extension snippet file', async () => {
			const extTarget = { ...mockTargetFile, contextValue: 'extension-snippet-filepath' };
			await dndController.handleDrop?.(extTarget, dataTransfer, token);
			expect(moveSnippetToDestination).not.toHaveBeenCalled();
		});

		it('should do nothing if dropped on non-target tree items', async () => {
			const extTarget = { ...mockTargetFile, contextValue: 'language-dropdown' };
			await dndController.handleDrop?.(extTarget, dataTransfer, token);
			expect(moveSnippetToDestination).not.toHaveBeenCalled();
		});

		it('should move snippet to a different file', async () => {
			await dndController.handleDrop?.(mockTargetFile, dataTransfer, token);
			expect(moveSnippetToDestination).toHaveBeenCalledWith(
				sourceItemValue.id,
				sourceItemValue.fp,
				mockTargetFile.filepath
			);
			expect(refreshAll).toHaveBeenCalled();
		});
	});

	describe('reorderSnippet', () => {
		const fp = '/path/to/snippets.code-snippets';
		const snippets: VSCodeSnippets = {
			'snippet-1': { prefix: 'p1', body: 'b1' },
			'snippet-2': { prefix: 'p2', body: 'b2' },
			'snippet-3': { prefix: 'p3', body: 'b3' },
			'snippet-4': { prefix: 'p4', body: 'b4' },
		};

		beforeEach(() => {
			(readSnippetFile as Mock).mockResolvedValue(snippets);
		});

		it('should move a snippet down in the order', async () => {
			const reordered: VSCodeSnippets = {
				'snippet-1': { prefix: 'p1', body: 'b1' },
				'snippet-3': { prefix: 'p3', body: 'b3' },
				'snippet-2': { prefix: 'p2', body: 'b2' },
				'snippet-4': { prefix: 'p4', body: 'b4' },
			};
			const item = new DataTransferItem({ id: 'snippet-2', fp });
			const target = { description: 'snippet-3' } as SnippetTreeItem;

			await dndController.reorderSnippet(item, target);
			expect(writeSnippetFile).toHaveBeenCalledWith(fp, reordered, '', true);
		});

		it('should move a snippet up in the order', async () => {
			const reordered: VSCodeSnippets = {
				'snippet-1': { prefix: 'p1', body: 'b1' },
				'snippet-3': { prefix: 'p3', body: 'b3' },
				'snippet-2': { prefix: 'p2', body: 'b2' },
				'snippet-4': { prefix: 'p4', body: 'b4' },
			};

			const item = new DataTransferItem({ id: 'snippet-3', fp });
			const target = { description: 'snippet-2' } as SnippetTreeItem;

			await dndController.reorderSnippet(item, target);
			expect(writeSnippetFile).toHaveBeenCalledWith(fp, reordered, '', true);
		});
	});
});
