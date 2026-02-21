import type { DecorationOptions, TextEditor } from 'vscode';
import { readSnippetFile } from '../../utils/jsoncFilesIO';
import type { VSCodeSnippets } from '../../types';
import { createTextEditorDecorationType, MarkdownString, Position, Range } from '../../vscode';
import { isExtensionSnippetPath } from '../../utils/fsInfo';

let pencilDecoration = createTextEditorDecorationType({
	textDecoration: 'underline dashed',
});

/** Add gutter icons to the visible document */
export async function addGutterIcons(editor: TextEditor) {
	const doc = editor.document;
	if (doc.uri.scheme !== 'file' || doc.isUntitled) return;
	if (await isExtensionSnippetPath(doc.uri.path)) return;

	const text = doc.getText();
	const snippets = (await readSnippetFile(doc.fileName)) as VSCodeSnippets;

	const options: DecorationOptions[] = [];
	for (const snippetId of Object.keys(snippets)) {
		const i = text.indexOf(`"${snippetId}"`);
		if (i === -1) continue;

		const hoverMessage = new MarkdownString();
		hoverMessage.supportThemeIcons = true;
		hoverMessage.isTrusted = true;
		hoverMessage.appendMarkdown(
			`[$(pencil) Edit Snippet](command:snippetstudio.snippet.edit?[${encodeURIComponent(JSON.stringify({ description: snippetId, path: doc.fileName }))}])`
		);

		const start = doc.positionAt(i + 1);
		const line = doc.lineAt(start.line);
		const end = new Position(line.lineNumber, line.range.end.character - 4);

		options.push({
			range: new Range(start, end),
			hoverMessage,
		});
	}
	editor.setDecorations(pencilDecoration, options);
}
