const joinFiles = (files) => files.map((file) => `"${file}"`).join(' ');

module.exports = {
	'*.{js,mjs,cjs,ts,mts,cts}': (stagedFiles) => [
		`prettier --write ${joinFiles(stagedFiles)}`,
		`oxlint ${joinFiles(stagedFiles)}`,
	],
};
