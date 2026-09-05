import type { VSCodeSnippets } from './snippetTypes';

export type SnippetContribution = {
	language: string;
	path: string;
};

export interface ExtensionSnippets extends SnippetContribution {
	snippets: VSCodeSnippets;
}

export type PackageJsonSnippetsSection = {
	name: string;
	contributes?: {
		snippets?: SnippetContribution[];
	};
};

export type ExtensionSnippetFilesMap = {
	[extension: string]: {
		name: string;
		files: SnippetContribution[];
	};
};

export type ExtensionSnippetsMap = {
	[extension: string]: {
		name: string;
		snippets: ExtensionSnippets[];
	};
};
