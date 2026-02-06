type VSCodeSnippet = {
	/** The prefix to trigger the snippet. This appears as the title of the autocomplete option */
	prefix: string | string[];

	/** The snippet body. Can be a single string or an array of strings. */
	body: string | string[];

	/** The snippet description. This appears when hovering over the autocomplete option */
	description?: string;

	/** The language scope(s) in which the snippet is valid. */
	scope?: string;
};

type VSCodeSnippetV2 = Omit<VSCodeSnippet, 'prefix'> & {
	/** The prefix to trigger the snippet. This appears as the title of the autocomplete option */
	prefix?: string | string[];

	/** Snippet expanded with a command instead of a prefix */
	isFileTemplate?: boolean;

	/** Glob pattern(s) of filepaths to include */
	include?: string | string[];

	/** Glob pattern(s) of filepaths to exclude */
	exclude?: string | string[];
};

type VSCodeSnippets = {
	/** snippetTitle appears to the right of autocomplete trigger */
	[snippetTitle: string]: VSCodeSnippetV2;
};

type SnippetMap = {
	[filename: string]: VSCodeSnippets;
};

type SnippetData = Omit<VSCodeSnippet, 'body'> & {
	/** snippetTitle appears to the right of autocomplete trigger */
	snippetTitle: string;

	/** Filepath the snippet will be stored in */
	filename: string;
};

type SnippetDataV2 = Omit<VSCodeSnippetV2, 'body'> & {
	/** snippetTitle appears to the right of autocomplete trigger */
	snippetTitle: string;

	/** Filepath the snippet will be stored in */
	filepath: string;
};

type ShellSnippet = {
	/** The shell command to be executed or pasted */
	command: string;
	/** If true, the command is executed immediately; otherwise, it is pasted into the terminal */
	runImmediately: boolean;
	/** The shell profile to use when running this snippet */
	profile: string;
};

export type {
	VSCodeSnippet,
	VSCodeSnippets,
	SnippetMap,
	SnippetData,
	ShellSnippet,
	SnippetDataV2,
	VSCodeSnippetV2,
};
