export default {
	'*.ts': (stagedFiles) => [
		`prettier --write ${stagedFiles.join(' ')}`,
		`eslint --fix --max-warnings=0 ${stagedFiles.join(' ')}`,
	],
};
