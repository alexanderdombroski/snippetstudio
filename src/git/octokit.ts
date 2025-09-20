import type { ExtensionContext } from 'vscode';
import type { Octokit } from '@octokit/core' with { 'resolution-mode': 'import' };
import vscode, { showInformationMessage, openExternal, Uri } from '../vscode';

let client: Octokit | null = null;

/** returns an octokit client (inits on first call) */
async function getOctokitClient(context: ExtensionContext): Promise<Octokit> {
	if (!client) {
		client = await createOctokitClient(context);
	}
	return client;
}

/** retrieves a token and inits the octokit client */
async function createOctokitClient(context: ExtensionContext): Promise<Octokit> {
	const { Octokit } = await import('@octokit/core');
	const { createOAuthDeviceAuth } = await import('@octokit/auth-oauth-device');

	let token = await context.secrets.get('GITHUB_TOKEN');

	if (token === undefined || (await isTokenRevoked(token))) {
		const auth = createOAuthDeviceAuth({
			clientType: 'oauth-app',
			clientId: 'Ov23liGyCEoxLEkCgXTC',
			scopes: ['gist'],
			onVerification: (verification) => {
				const message = 'Copy Code & Open in Browser';
				showInformationMessage(
					`Authorize SnippetStudio with GitHub using code ${verification.user_code}?`,
					{ modal: true },
					message
				).then((selection) => {
					if (selection === message) {
						openExternal(Uri.parse(verification.verification_uri));
						vscode.env.clipboard.writeText(verification.user_code);
						showInformationMessage(
							`${verification.user_code} copied to clipboard and redirected to ${verification.verification_uri}`
						);
					}
				});
			},
		});

		const { token: newToken } = await auth({ type: 'oauth', refresh: true });
		await context.secrets.store('GITHUB_TOKEN', newToken);
		token = newToken;
	}

	return new Octokit({ auth: token });
}

/** runs a basic user request to see if a token is valid */
async function isTokenRevoked(token: string): Promise<boolean> {
	const { Octokit } = await import('@octokit/core');
	const test = new Octokit({ auth: token });

	try {
		await test.request('GET /user');
		return false;
	} catch {
		return true;
	}
}

export { getOctokitClient };
