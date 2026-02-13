const joinFiles = (files) => files.map((file) => `"${file}"`).join(' ');

module.exports = {
	'*.{ts,js,mjs}': (stagedFiles) => [
		`prettier --write ${joinFiles(stagedFiles)}`,
		`eslint --max-warnings=0 ${joinFiles(stagedFiles)}`,
	],
};
