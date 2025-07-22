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

export type { GlobalStorage, ProfileInfo, ProfileSnippetsMap, ProfileAssociations };
