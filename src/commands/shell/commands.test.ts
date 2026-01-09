import { describe, it } from 'vitest';
import initSnippetShellCommands from './commands';
import { expectCommandsRegistered } from '../../../.vitest/utils';

describe('Shell Snippet Commands', () => {
	it('should register all snippet shell commands', async () => {
		expectCommandsRegistered(initSnippetShellCommands, [
			'snippetstudio.shell.create',
			'snippetstudio.shell.edit',
			'snippetstudio.shell.delete',
			'snippetstudio.shell.run',
			'snippetstudio.shell.refresh',
			'snippetstudio.shell.manageProfiles',
		]);
	});
});
