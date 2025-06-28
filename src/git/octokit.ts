import type { Octokit } from '@octokit/rest' with { 'resolution-mode': 'import' };
import * as vscode from 'vscode';

let client: Octokit | null = null;

async function getOctokitClient(context: vscode.ExtensionContext): Promise<Octokit> {
	if (!client) {
		client = await createOctokitClient(context);
	}
	return client;
}

async function createOctokitClient(context: vscode.ExtensionContext): Promise<Octokit> {
	const { Octokit } = await import('@octokit/rest');
	const { createOAuthDeviceAuth } = await import('@octokit/auth-oauth-device');

	let token = await context.secrets.get('GITHUB_TOKEN');
	if (token === undefined) {
		const auth = createOAuthDeviceAuth({
			clientType: 'github-app',
			clientId: 'Iv23liJW3V8qIKvJzlgg',
			onVerification: (verification) => {
				const message = 'Copy Code & Open in Browser';
				vscode.window
					.showInformationMessage(
						`Authorize SnippetStudio with GitHub using code ${verification.user_code}?`,
						{ modal: true },
						message
					)
					.then((selection) => {
						if (selection === message) {
							vscode.env.openExternal(
								vscode.Uri.parse(verification.verification_uri)
							);
							vscode.env.clipboard.writeText(verification.user_code);
							vscode.window.showInformationMessage(
								`${verification.user_code} copied to clipboard and redirected to ${verification.verification_uri}`
							);
						}
					});
			},
		});

		token = (await auth({ type: 'oauth' })).token;
		if (token) {
			context.secrets.store('GITHUB_TOKEN', token);
		}
	}

	return new Octokit({ auth: token });
}

export default getOctokitClient;
