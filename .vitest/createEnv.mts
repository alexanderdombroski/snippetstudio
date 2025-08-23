// Run this file with a node runtime
// to generate a .env file with a GITHUB_TOKEN for testing.

import { createOAuthDeviceAuth } from '@octokit/auth-oauth-device';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * This script automates the creation of a GITHUB_TOKEN for testing purposes.
 * It uses the same OAuth flow as the extension itself, but adapted for a command-line environment.
 */
async function createEnvFile() {
	console.log('Starting GitHub authentication process...');

	try {
		const auth = createOAuthDeviceAuth({
			clientType: 'oauth-app',
			// This is the public client ID for SnippetStudio
			clientId: 'Ov23liGyCEoxLEkCgXTC',
			scopes: ['gist'],
			onVerification(verification) {
				console.log('--------------------------------------------------------');
				console.log('Open this URL in your browser:', verification.verification_uri);
				console.log('And enter this code:', verification.user_code);
				console.log('--------------------------------------------------------');
			},
		});

		console.log('Waiting for you to authorize in the browser...');
		const { token } = await auth({ type: 'oauth' });

		console.log('Authentication successful!');

		const envContent = `GITHUB_TOKEN=${token}\n`;
		const __filename = fileURLToPath(import.meta.url);
		const envPath = path.resolve(path.dirname(__filename), '.env');

		await fs.writeFile(envPath, envContent);

		console.log(`Successfully created .env file at ${envPath}`);
	} catch (error) {
		console.error('An error occurred during the authentication process:', error);
		process.exit(1);
	}
}

createEnvFile();