import { createTextEditorDecorationType, Range } from '../../vscode';
import type { DecorationOptions, TextEditor } from 'vscode';

const insertionFeatureDecorationType = createTextEditorDecorationType({
	color: '#FFF', // White in Dark+
	fontWeight: 'bold',
	light: {
		color: '#D801F8', // Purple for Light+
	},
});

/** adds text decoration to highlight snippet insertion features within a text editor */
export function highlightSnippetInsertionFeatures(editor: TextEditor) {
	const document = editor.document;

	const text = document.getText();
	const regexes = [
		/(?<!\\)\$\d+/g, // $0, $1
		/(?<!\\)\$\{\d+:[^}]*\}/g, // ${1:placeholder}
		/(?<!\\)\$\{\d+\|[^}]+\|\}/g, // ${2|choice1,choice2|}
		/(?<!\\)\$((TM_(SELECTED_TEXT|CURRENT_(LINE|WORD)|LINE_(INDEX|NUMBER)|FILE(NAME(_BASE)?|PATH)|DIRECTORY))|CLIPBOARD|RELATIVE_FILEPATH|(WORKSPACE_(NAME|FOLDER))|CURSOR_(INDEX|NUMBER)|CURRENT_(YEAR(_SHORT)?|MONTH(_NAME(_SHORT)?)?|DA(TE|Y_NAME(_SHORT)?)|HOUR|MINUTE|SECOND(S_UNIX)?|TIMEZONE_OFFSET)|RANDOM(_HEX)?|UUID|BLOCK_COMMENT_(START|END)|LINE_COMMENT)/g,
		/(?<!\\)\$\{((TM_(SELECTED_TEXT|CURRENT_(LINE|WORD)|LINE_(INDEX|NUMBER)|FILE(NAME(_BASE)?|PATH)|DIRECTORY))|CLIPBOARD|RELATIVE_FILEPATH|(WORKSPACE_(NAME|FOLDER))|CURSOR_(INDEX|NUMBER)|CURRENT_(YEAR(_SHORT)?|MONTH(_NAME(_SHORT)?)?|DA(TE|Y_NAME(_SHORT)?)|HOUR|MINUTE|SECOND(S_UNIX)?|TIMEZONE_OFFSET)|RANDOM(_HEX)?|UUID|BLOCK_COMMENT_(START|END)|LINE_COMMENT):([^}]*)\}/g,
		/(?<!\\)\$\{\d+\/.*?\/.*?\/[gimsuy]*\}/g,
	];
	const decorations: DecorationOptions[] = [];

	for (const match of regexes.flatMap((regex) => Array.from(text.matchAll(regex)))) {
		const startPos = document.positionAt(match.index);
		const endPos = document.positionAt(match.index + match[0].length);
		const range = new Range(startPos, endPos);
		decorations.push({ range });
	}

	editor.setDecorations(insertionFeatureDecorationType, decorations);
}
