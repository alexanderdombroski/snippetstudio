import path from 'node:path';
import type { TreeItemCollapsibleState } from 'vscode';
import { Collapsed, None, TreeItem } from '../../vscode';
import { shortenFullPath } from '../../utils/fsInfo';
import type { SnippetContribution, VSCodeSnippet } from '../../types';
import { snippetBodyAsString } from '../../utils/string';

/** A TreeItem containing a snippet */
export class SnippetTreeItem extends TreeItem {
	public readonly description: string;

	constructor(
		snippetTitle: string,
		snippet: VSCodeSnippet,
		public readonly path: string,
		public readonly contextValue: string = 'snippet'
	) {
		const prefix = Array.isArray(snippet.prefix) ? snippet.prefix.join(', ') : snippet.prefix;
		super(prefix, None);
		this.description = snippetTitle;
		const body = snippetBodyAsString(snippet.body);
		this.tooltip = `Keyword: ${prefix}\n\`\`\`text\n${body}\`\`\`${snippet.description ? '\n\n' + snippet.description : ''}`;
		this.command = {
			title: 'Show Snippet Body',
			command: 'snippetstudio.snippet.showBody',
			arguments: [this],
		};
	}
}

/** A TreeItem containing snippet file metadata */
export class SnippetFileTreeItem extends TreeItem {
	constructor(
		public readonly collapsibleState: TreeItemCollapsibleState,
		public readonly filepath: string,
		public readonly contextValue: string
	) {
		const label = (contextValue.includes('linked') ? '\u{1F517} ' : '') + path.basename(filepath);
		super(label, collapsibleState);
		const short = shortenFullPath(filepath);
		this.description = short;
		this.tooltip = `Snippets from this dropdown are found in \`${short}\`\n\nDouble Click to open the file!`;

		// Command to open Snippet file when double clicked
		this.command = {
			title: 'Open Snippet File',
			command: 'snippetstudio.file.openFromDouble',
			arguments: [this],
		};
	}
}

/** A TreeItem containing snippet file metadata of an extension */
export class ExtSnippetFileTreeItem extends SnippetFileTreeItem {
	constructor(contribution: SnippetContribution, collapsible: boolean) {
		super(collapsible ? Collapsed : None, contribution.path, 'extension-snippet-filepath');
		this.tooltip = `Extension Snippet file for ${contribution.language}. Direct edits reset every extension update.`;
	}
}
