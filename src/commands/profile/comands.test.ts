import { describe, it } from 'vitest';
import initSnippetProfileCommands from './commands';
import { expectCommandsRegistered } from '../../../.vitest/utils';

describe('Snippet Profile Commands', () => {
	it('should register all snippet file commands', () => {
		expectCommandsRegistered(initSnippetProfileCommands, [
			'snippetstudio.profile.import',
			'snippetstudio.profile.link',
		]);
	});
});
