type GlobalStorage = {
	profileAssociations: ProfileAssociations;
	userDataProfiles?: ProfileInfo[];
};

type ProfileAssociations = {
	workspaces: {
		[workspaceUri: string]: string;
	};
	emptyWindows: {
		[windowUUID: string]: string;
	};
};

type ProfileInfo = {
	location: string;
	name: string;
	icon?: string;
};

type ProfileSnippetsMap = {
	[location: string]: string[];
};

/**
 * Linked snippet file basenames and which profile locations they're located in
 */
type SnippetLinks = {
	[file: string]: string[];
};

export type { GlobalStorage, ProfileInfo, ProfileSnippetsMap, ProfileAssociations, SnippetLinks };
