import { beforeEach, describe, expect, it, vi, type Mocked } from 'vitest';
import vscode from '../vscode';

const Auth = vi.fn();
vi.mock('@octokit/auth-oauth-device', () => {
	return {
		createOAuthDeviceAuth: vi.fn(() => Auth),
	};
});

const context = {
	secrets: {
		get: vi.fn(async (key: string) => process.env[key]),
		store: vi.fn(),
		delete: vi.fn(),
		onDidChange: { event: vi.fn() } as any,
	},
} as Pick<vscode.ExtensionContext, 'secrets'> as Mocked<vscode.ExtensionContext>;

describe('getOctokitClient', () => {
	let getOctokitClient: Function;
	beforeEach(async () => {
		// Reset client singleton state for each test
		vi.resetModules();
		vi.clearAllMocks();
		const { getOctokitClient: getClient } = await import('./octokit.js');
		getOctokitClient = getClient;
	});

	describe.skipIf(!process.env.GITHUB_TOKEN)('with valid GITHUB_TOKEN in environment', () => {
		it.concurrent('should create a real client that can make successful API calls', async () => {
			const client = await getOctokitClient(context);

			const response = await client.request('GET /zen');

			expect(response.status).toBe(200);
			expect(typeof response.data).toBe('string');
		});

		it.concurrent("should only store the github token if it didn't already exist", async () => {
			await getOctokitClient(context);
			expect(context.secrets.get).toHaveBeenCalledWith('GITHUB_TOKEN');
			expect(context.secrets.store).not.toHaveBeenCalled();
		});
	});

	describe('without a valid GITHUB_TOKEN', () => {
		it('should trigger auth flow if token is invalid', async () => {
			vi.spyOn(context.secrets, 'get').mockResolvedValue('invalid-token');
			Auth.mockResolvedValue({ token: 'new_token' });

			await getOctokitClient(context);
			expect(context.secrets.store).toHaveBeenCalledWith('GITHUB_TOKEN', 'new_token');
		});

		it('should store the new token if no token exists', async () => {
			vi.spyOn(context.secrets, 'get').mockResolvedValue(undefined);
			Auth.mockResolvedValue({ token: 'new_token' });

			await getOctokitClient(context);
			expect(context.secrets.store).toHaveBeenCalledWith('GITHUB_TOKEN', 'new_token');
		});

		it('should return the cached client on subsequent calls', async () => {
			Auth.mockResolvedValue({ token: 'new_token' });
			const client1 = await getOctokitClient(context);
			const client2 = await getOctokitClient(context);

			expect(client1).toBe(client2);
			expect(context.secrets.get).toHaveBeenCalledTimes(1);
		});
	});
});
