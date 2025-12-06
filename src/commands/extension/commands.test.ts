import { describe, it } from 'vitest';
import initSnippetExtensionCommands from './commands';
import { expectCommandsRegistered } from '../../../.vitest/utils';

describe('Snippet File Commands', () => {
	it('should register all snippet file commands', () => {
		expectCommandsRegistered(initSnippetExtensionCommands, [
			'snippetstudio.extension.extract',
			'snippetstudio.extension.fetch',
			'snippetstudio.extension.modify',
		]);
	});
});
