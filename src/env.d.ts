/* eslint-disable no-unused-vars */

declare namespace NodeJS {
	interface ProcessEnv {
		IS_PRODUCTION_BUILD?: string; // Declared at build time
		GITHUB_TOKEN?: string;
	}
}
