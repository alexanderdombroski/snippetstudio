module.exports = {
	'*.{ts,js,mjs}': (stagedFiles) => [
		`prettier --write ${stagedFiles.join(' ')}`,
		`eslint --max-warnings=0 ${stagedFiles.join(' ')}`,
	],
};
