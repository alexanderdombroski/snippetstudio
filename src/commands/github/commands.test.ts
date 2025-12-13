import { describe, it } from 'vitest';
import initSnippetGithubCommands from './commands';
import { expectCommandsRegistered } from '../../../.vitest/utils';

describe('Snippet Github Commands', () => {
	it('should register all github commands', async () => {
		expectCommandsRegistered(initSnippetGithubCommands, [
			'snippetstudio.github.export',
			'snippetstudio.github.import',
			'snippetstudio.github.browse',
		]);
	});
});
