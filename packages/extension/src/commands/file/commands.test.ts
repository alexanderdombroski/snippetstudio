import { describe, it } from 'vitest';
import initSnippetFileCommands from './commands';
import { expectCommandsRegistered } from '../../../.vitest/utils';

describe('Snippet File Commands', () => {
	it('should register all snippet file commands', () => {
		expectCommandsRegistered(initSnippetFileCommands, [
			'snippetstudio.file.open',
			'snippetstudio.file.openFromDouble',
			'snippetstudio.file.createGlobalLang',
			'snippetstudio.file.createProjectSnippets',
			'snippetstudio.file.createGlobalSnippets',
			'snippetstudio.file.delete',
			'snippetstudio.file.export',
			'snippetstudio.file.rename',
		]);
	});
});
