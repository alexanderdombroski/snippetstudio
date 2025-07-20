type GlobalStorage = {
	profileAssociations: {
		workspaces: {
			[workspaceUri: string]: string;
		};
		emptyWindows: {
			[windowUUID: string]: string;
		};
	};
	userDataProfiles?: ProfileInfo[];
};

type ProfileInfo = {
	id: string;
	name: string;
	icon?: string;
};

export type { GlobalStorage, ProfileInfo };
