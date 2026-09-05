import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
	CancellationToken,
	DataTransfer,
	DataTransferItem,
	Position,
	TextDocument,
} from 'vscode';
import { SnippetString, DocumentDropEdit } from '../vscode';
import { SnippetDropProvider } from './DocumentDropEditProvider';

describe('SnippetDropProvider', () => {
	let provider: SnippetDropProvider;
	const document = {} as TextDocument;
	const position = {} as Position;
	const token = {} as CancellationToken;

	beforeEach(() => {
		provider = new SnippetDropProvider();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it('should return undefined if data transfer does not contain "text/plain" item', async () => {
		const dataTransfer: DataTransfer = new Map();

		const result = await provider.provideDocumentDropEdits(document, position, dataTransfer, token);

		expect(result).toBeUndefined();
	});

	it('should return a DocumentDropEdit if data transfer contains "text/plain" item', async () => {
		const snippetContent = 'console.log("${1:Hello World}");';
		const dataTransferItem: Partial<DataTransferItem> = {
			value: snippetContent,
			asString: vi.fn().mockResolvedValue(snippetContent),
		};
		const dataTransfer: DataTransfer = new Map();
		dataTransfer.set('text/plain', dataTransferItem as DataTransferItem);

		const result = await provider.provideDocumentDropEdits(document, position, dataTransfer, token);

		expect(dataTransferItem.asString).toHaveBeenCalledOnce();
		expect(SnippetString).toHaveBeenCalledWith(snippetContent);
		expect(SnippetString).toHaveBeenCalledOnce();

		expect(DocumentDropEdit).toHaveBeenCalledOnce();
		expect(result).toBeInstanceOf(DocumentDropEdit);
	});
});
