import type {
	CancellationToken,
	DataTransfer,
	DocumentDropEdit as DocumentDropEditType,
	DocumentDropEditProvider,
	Position,
	TextDocument,
} from 'vscode';
import { SnippetString, DocumentDropEdit } from '../vscode';

/** Allows user to drop snippets into the editor */
export class SnippetDropProvider implements DocumentDropEditProvider {
	/** Paste dragged snippets as a Snippet String */
	async provideDocumentDropEdits(
		document: TextDocument,
		position: Position,
		dataTransfer: DataTransfer,
		// eslint-disable-next-line no-unused-vars
		token: CancellationToken
	): Promise<DocumentDropEditType | undefined> {
		const item = dataTransfer.get('text/plain');
		if (!item) return; // Not our drag

		const snippetContent = await item.asString();

		return new DocumentDropEdit(new SnippetString(snippetContent));
	}
}
