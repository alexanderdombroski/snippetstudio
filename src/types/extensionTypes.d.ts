export type SnippetContribution = {
	language: string;
	path: string;
};

export type PackageJsonSnippetsSection = {
	name: string;
	contributes?: {
		snippets?: SnippetContribution[];
	};
};

export type ExtensionSnippetsMap = {
	[extension: string]: {
		name: string;
		files: SnippetContribution[];
	};
};
