import { getCurrentLanguage } from '../../utils/language';
import vscode, { executeCommand, openTextDocument, showTextDocument, Uri } from '../../vscode';
import type { Location, TextDocumentContentProvider, Uri as UriType } from 'vscode';
import type { VSCodeSnippets } from '../../types';

export default class SnippetPeekProvider implements TextDocumentContentProvider {
	private snippets = new Map<string, string>();
	private scheme = 'snippetviewer' as const;

	constructor() {
		vscode.workspace.onDidOpenTextDocument((doc) => {
			if (doc.uri.scheme === this.scheme) {
				vscode.languages.setTextDocumentLanguage(doc, doc.uri.fragment);
			}
		});
		vscode.window.onDidChangeVisibleTextEditors((editors) => {
			if (!editors.some((e) => e.document.uri.scheme === this.scheme)) {
				this.snippets.clear();
			}
		});
	}

	provideTextDocumentContent(uri: UriType): string {
		return this.snippets.get(uri.toString()) ?? '// snippet not found';
	}

	async showPeek(snippets: VSCodeSnippets, preferred: string) {
		const language = getCurrentLanguage() ?? 'plaintext';
		const commentToken = getCommentToken(language);
		const formatTitle = Array.isArray(commentToken)
			? (title: string) => `${commentToken[0]} ${title} ${commentToken[1]}`
			: (title: string) => `${commentToken} ${title}`;

		let editor = vscode.window.activeTextEditor;
		if (editor === undefined) {
			const doc = await openTextDocument({ content: '', language });
			editor = await showTextDocument(doc);
		}

		// Store the snippets
		let currentLine = 0;
		const uri = Uri.from({
			scheme: this.scheme,
			path: `/${language}/full-list`,
			fragment: language,
		});
		const locations: Location[] = [];
		const combinedBody: string[] = [];

		Object.entries(snippets).forEach(([k, s]) => {
			const body = Array.isArray(s.body) ? s.body : s.body.split(/\r\n|\r|\n/);
			const location = new vscode.Location(uri, new vscode.Position(currentLine, 0));
			currentLine += body.length + 2;

			combinedBody.push(formatTitle(`${s.prefix} - ${k}`), ...body, '');
			locations.push(location);

			if (k === preferred) {
				const preferredUri = Uri.from({
					scheme: this.scheme,
					path: `/${language}/clicked`,
					fragment: language,
				});
				this.snippets.set(preferredUri.toString(), body.join('\n'));
				locations.unshift(new vscode.Location(preferredUri, new vscode.Position(0, 0)));
			}
		});

		this.snippets.set(uri.toString(), combinedBody.join('\n'));

		const anchorPosition = editor.visibleRanges[0].start;

		await executeCommand(
			'editor.action.peekLocations',
			editor.document.uri,
			anchorPosition,
			locations,
			'goto'
		);
	}
}

/* c8 ignore start */
function getCommentToken(langId: string): string | [string, string] {
	switch (langId) {
		case 'javascript':
		case 'typescript':
		case 'javascriptreact':
		case 'typescriptreact':
		case 'java':
		case 'c':
		case 'cpp':
		case 'csharp':
		case 'go':
		case 'rust':
		case 'kotlin':
		case 'scala':
		case 'swift':
		case 'php':
			return '//';

		case 'python':
		case 'ruby':
		case 'shellscript': // bash/zsh
		case 'r':
		case 'perl':
		case 'elixer':
			return '#';

		case 'erlang':
			return '%';

		case 'sql':
		case 'haskell':
		case 'lua':
			return '--';

		case 'html':
		case 'xml':
		case 'markdown':
			return ['<!--', '-->'];

		case 'css':
		case 'scss':
		case 'less':
			return ['/*', '*/'];
		default:
			return '//';
	}
}
/* c8 ignore stop */
