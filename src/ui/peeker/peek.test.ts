import { vi, describe, it, expect } from 'vitest';
import { peekAtSnippet } from './peek';
import { context } from '../../../.vitest/__mocks__/shared';
import SnippetPeekProvider from './SnippetPeekProvider';
import { readSnippetFile } from '../../utils/jsoncFilesIO';
import vscode from '../../vscode';

const showPeek = vi.fn();

vi.mock('../../utils/jsoncFilesIO', async () => ({
	readSnippetFile: vi.fn(),
}));
vi.mock('./SnippetPeekProvider', () => ({
	default: vi.fn(function (this: { showPeek: Function }) {
		this.showPeek = showPeek;
	}),
}));

describe('peekAtSnippet', () => {
	it('should create the peek provider and show a peek', async () => {
		const spy = vi.spyOn(context.subscriptions, 'push');

		await peekAtSnippet(context, '/test/path.ts', 'snippet1');

		expect(SnippetPeekProvider).toBeCalled();
		expect(vscode.workspace.registerTextDocumentContentProvider).toBeCalled();
		expect(spy).toBeCalled();

		expect(readSnippetFile).toBeCalled();
		expect(showPeek).toBeCalled();
	});
});
