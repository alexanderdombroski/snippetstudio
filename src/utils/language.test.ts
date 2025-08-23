import { describe, expect, it, vi, beforeEach, type Mock } from 'vitest';
import { selectLanguage, getCurrentLanguage, langIds } from './language';
import vscode, { showQuickPick } from '../vscode';

describe('language utils', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('langIds', () => {
		it('should be populated with languages', async () => {
			const mockLangs = ['typescript', 'javascript', 'python'];
			(vscode.languages.getLanguages as Mock).mockResolvedValue(mockLangs);

			expect(langIds).toEqual(expect.arrayContaining(mockLangs));
		});
	});

	describe('selectLanguage', () => {
		it('should show a quick pick with languages and return the selected language', async () => {
			const mockLangs = ['typescript', 'javascript', 'python'];
			langIds.splice(0, langIds.length, ...mockLangs); // reset and fill
			const expectedLanguage = 'typescript';
			(showQuickPick as Mock).mockResolvedValue(expectedLanguage);

			const result = await selectLanguage();

			expect(showQuickPick).toHaveBeenCalledWith(mockLangs, {
				placeHolder: 'Select a language',
				canPickMany: false,
			});
			expect(result).toBe(expectedLanguage);
		});

		it('should return undefined if no language is selected', async () => {
			(showQuickPick as Mock).mockResolvedValue(undefined);
			const result = await selectLanguage();
			expect(result).toBeUndefined();
		});
	});

	describe('getCurrentLanguage', () => {
		it('should return the languageId of the active text editor', () => {
			vscode.window.activeTextEditor = {
				document: {
					languageId: 'typescript',
				},
			} as any;

			const result = getCurrentLanguage();
			expect(result).toBe('typescript');
		});

		it('should return undefined if there is no active text editor', () => {
			vscode.window.activeTextEditor = undefined;

			const result = getCurrentLanguage();
			expect(result).toBeUndefined();
		});
	});
});
