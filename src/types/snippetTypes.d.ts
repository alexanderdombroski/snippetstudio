interface VSCodeSnippet {
	/** The prefix to trigger the snippet. This appears as the title of the autocomplete option */
	prefix: string | string[];

	/** The snippet body. Can be a single string or an array of strings. */
	body: string | string[];

	/** The snippet description. This appears when hovering over the autocomplete option */
	description?: string;

	/** The scope(s) in which the snippet is valid. */
	scope?: string;
}

interface VSCodeSnippets {
	/** snippetTitle appears to the right of autocomplete trigger */
	[snippetTitle: string]: VSCodeSnippet;
}

interface SnippetMap {
	[fileName: string]: VSCodeSnippets;
}

interface SnippetData {
	/** snippetTitle appears to the right of autocomplete trigger */
	snippetTitle: string;

	/** The prefix to trigger the snippet. This appears as the title of the autocomplete option */
	prefix: string | string[];

	/** The snippet description. This appears when hovering over the autocomplete option */
	description?: string;

	/** The scope(s) in which the snippet is valid. */
	scope?: string;

	/** Filepath the snippet will be stored in */
	filename: string;
}

export interface ShellSnippet {
	/** The shell command to be executed or pasted */
	command: string;
	/** If true, the command is executed immediately; otherwise, it is pasted into the terminal */
	runImmediately: boolean;
	/** Whether the snippet is stored scoped everywhere for the user, or just the workspace */
	isLocal: boolean;
}

export type { VSCodeSnippet, VSCodeSnippets, SnippetMap, SnippetData };
