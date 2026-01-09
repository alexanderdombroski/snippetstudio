import { describe, it } from 'vitest';
import initSnippetCommands from './commands';
import { expectCommandsRegistered } from '../../../.vitest/utils';

describe('Snippet Commands', () => {
	it('should register all snippet commands', () => {
		expectCommandsRegistered(initSnippetCommands, [
			'snippetstudio.snippet.showBody',
			'snippetstudio.snippet.addGlobal',
			'snippetstudio.snippet.createAt',
			'snippetstudio.snippet.fromSelection',
			'snippetstudio.snippet.edit',
			'snippetstudio.snippet.delete',
			'snippetstudio.snippet.move',
			'snippetstudio.snippet.addKeybinding',
		]);
	});
});
