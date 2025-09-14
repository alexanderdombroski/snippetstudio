import type { DiagnosticsLevel } from '../../types';
import vscode, { createTextEditorDecorationType, getConfiguration, Range } from '../../vscode';
import type { DecorationOptions, Range as RangeType, TextDocument, TextEditor } from 'vscode';

const insertionFeatureDecorationType = createTextEditorDecorationType({
	color: '#FFF', // White in Dark+
	fontWeight: 'bold',
	light: {
		color: '#D801F8', // Purple for Light+
	},
});
const diagnosticSuppressorDecorationType = createTextEditorDecorationType({
	backgroundColor: 'var(--vscode-editor-background)',
	textDecoration: 'underline wavy var(--vscode-editor-background)', // Mask underline squiggles
	isWholeLine: true,
});
const diagnosticSuppressorDecorationOverLine = createTextEditorDecorationType({
	textDecoration: 'overline wavy var(--vscode-editor-background)', // Additional Coverup underline squiggles
	isWholeLine: true,
});

export function highlightSnippetInsertionFeatures(editor: TextEditor) {
	const document = editor.document;
	const shouldMaskDiagnostics =
		getConfiguration('snippetstudio').get<DiagnosticsLevel>('editor.diagnosticsLevel') ===
		'suppressed';
	const diagnostics = shouldMaskDiagnostics
		? vscode.languages.getDiagnostics(document.uri)
		: undefined;

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
	const supressedDiagnostics: DecorationOptions[] = [];
	const supressedDiagnosticsOverLine: DecorationOptions[] = [];

	for (const match of regexes.flatMap((regex) => Array.from(text.matchAll(regex)))) {
		const startPos = document.positionAt(match.index);
		const endPos = document.positionAt(match.index + match[0].length);
		const range = new Range(startPos, endPos);
		decorations.push({ range });

		diagnostics
			?.filter((dg) => dg.range.intersection(range))
			.forEach((dg) => {
				supressedDiagnostics.push({ range: dg.range });
				supressedDiagnosticsOverLine.push({ range: __moveRangeDown(dg.range, document) });
				diagnostics.splice(diagnostics.indexOf(dg), 1);
			});
	}

	editor.setDecorations(insertionFeatureDecorationType, decorations);
	if (shouldMaskDiagnostics) {
		editor.setDecorations(diagnosticSuppressorDecorationType, supressedDiagnostics);
		editor.setDecorations(diagnosticSuppressorDecorationOverLine, supressedDiagnosticsOverLine);
	}
}

export function __moveRangeDown(range: RangeType, document: TextDocument): RangeType {
	const newStartLine = Math.min(range.start.line + 1, document.lineCount - 1);
	const newEndLine = Math.min(range.end.line + 1, document.lineCount - 1);

	// Clamp the character positions to the line length
	const newStartChar = Math.min(range.start.character, document.lineAt(newStartLine).text.length);
	const newEndChar = Math.min(range.end.character, document.lineAt(newEndLine).text.length);

	return new vscode.Range(newStartLine, newStartChar, newEndLine, newEndChar);
}
