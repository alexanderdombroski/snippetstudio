import { describe, it } from 'vitest';
import initSnippetUICommands from './commands';
import { expectCommandsRegistered } from '../../../.vitest/utils';

describe('Snippet UI Commands', () => {
	it('should register all UI commands', () => {
		expectCommandsRegistered(initSnippetUICommands, [
			'snippetstudio.openView',
			'snippetstudio.openSettings',
			'snippetstudio.file.open.Explorer',
			'snippetstudio.file.open.Terminal',
		]);
	});
});
