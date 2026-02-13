import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import {
	LanguageDropdown,
	SnippetCategoryDropdown,
	ActiveLanguageDropdown,
	UnloadedDropdown,
	GlobalSnippetsDropdown,
	LocalSnippetsDropdown,
	AllProfilesDropdown,
	AllExtensionDropdown,
	ExtensionDropdown,
	ProfileDropdown,
} from './dropdowns';
import { getCurrentLanguage } from '../../utils/language';
import { getPathFromProfileLocation } from '../../utils/profile';
import { Collapsed, Expanded, None } from '../../vscode';
import type { ProfileInfo } from '../../types';

vi.mock('../../utils/language');
vi.mock('../../utils/profile');

describe('dropdowns', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('LanguageDropdown', () => {
		it('should create a language dropdown with correct properties', () => {
			const dropdown = new LanguageDropdown('typescript', false);

			expect(dropdown.label).toBe('TYPESCRIPT');
			expect(dropdown.collapsibleState).toBe(Collapsed);
			expect(dropdown.tooltip).toBe('The language of the open file');
			expect(dropdown.contextValue).toBe('active-snippets');
		});

		it('should have code icon', () => {
			const dropdown = new LanguageDropdown('javascript', true);
			expect(dropdown.iconPath).toBeDefined();
		});
	});

	describe('SnippetCategoryDropdown', () => {
		it('should create a category dropdown with correct properties', () => {
			const dropdown = new SnippetCategoryDropdown(
				'Test Category',
				Expanded,
				'folder',
				'/test/path'
			);

			expect(dropdown.label).toBe('Test Category');
			expect(dropdown.collapsibleState).toBe(Expanded);
			expect(dropdown.folderPath).toBe('/test/path');
			expect(dropdown.iconPath).toBeDefined();
		});

		it('should accept different collapsible states', () => {
			const collapsed = new SnippetCategoryDropdown('Test', Collapsed, 'folder', '/path');
			const expanded = new SnippetCategoryDropdown('Test', Expanded, 'folder', '/path');
			const none = new SnippetCategoryDropdown('Test', None, 'folder', '/path');

			expect(collapsed.collapsibleState).toBe(Collapsed);
			expect(expanded.collapsibleState).toBe(Expanded);
			expect(none.collapsibleState).toBe(None);
		});
	});

	describe('ActiveLanguageDropdown', () => {
		it('should create dropdown with current language when available', () => {
			(getCurrentLanguage as Mock).mockReturnValue('typescript');

			const dropdown = new ActiveLanguageDropdown(true);

			expect(dropdown.label).toBe('typescript');
			expect(dropdown.collapsibleState).toBe(Expanded);
			expect(dropdown.tooltip).toBe('The language of the open file');
			expect(dropdown.contextValue).toBe('active-snippets');
		});

		it('should show "No Language Open" when no language available', () => {
			(getCurrentLanguage as Mock).mockReturnValue(null);

			const dropdown = new ActiveLanguageDropdown(true);

			expect(dropdown.label).toBe('No Language Open');
		});

		it('should use None state when not collapsible', () => {
			(getCurrentLanguage as Mock).mockReturnValue('typescript');

			const dropdown = new ActiveLanguageDropdown(false);

			expect(dropdown.collapsibleState).toBe(None);
		});

		it('should use Expanded state when collapsible', () => {
			(getCurrentLanguage as Mock).mockReturnValue('typescript');

			const dropdown = new ActiveLanguageDropdown(true);

			expect(dropdown.collapsibleState).toBe(Expanded);
		});
	});

	describe('UnloadedDropdown', () => {
		it('should create dropdown with correct properties', () => {
			const dropdown = new UnloadedDropdown();

			expect(dropdown.label).toBe('Other Profiles');
			expect(dropdown.collapsibleState).toBe(Collapsed);
			expect(dropdown.contextValue).toBe('disabled-dropdown');
			expect(dropdown.tooltip).toBe(
				"Snippets in these files won't be expandable until you switch your profile"
			);
			expect(dropdown.folderPath).toBe('');
		});

		it('should have organization icon', () => {
			const dropdown = new UnloadedDropdown();
			expect(dropdown.iconPath).toBeDefined();
		});
	});

	describe('GlobalSnippetsDropdown', () => {
		it('should create dropdown with correct properties when collapsible', () => {
			const dropdown = new GlobalSnippetsDropdown('/global/path', true);

			expect(dropdown.label).toBe('Global Snippets');
			expect(dropdown.collapsibleState).toBe(Collapsed);
			expect(dropdown.folderPath).toBe('/global/path');
			expect(dropdown.contextValue).toBe('global-dropdown category-dropdown');
			expect(dropdown.tooltip).toBe('Global Snippets are available anywhere in vscode');
		});

		it('should use None state when not collapsible', () => {
			const dropdown = new GlobalSnippetsDropdown('/global/path', false);

			expect(dropdown.collapsibleState).toBe(None);
		});

		it('should have globe icon', () => {
			const dropdown = new GlobalSnippetsDropdown('/path', true);
			expect(dropdown.iconPath).toBeDefined();
		});
	});

	describe('LocalSnippetsDropdown', () => {
		it('should create dropdown with correct properties when collapsible', () => {
			const dropdown = new LocalSnippetsDropdown('/local/path', true);

			expect(dropdown.label).toBe('Local Snippets');
			expect(dropdown.collapsibleState).toBe(Collapsed);
			expect(dropdown.folderPath).toBe('/local/path');
			expect(dropdown.contextValue).toBe('local-dropdown category-dropdown');
			expect(dropdown.tooltip).toBe('Local Snippets are only loaded while open to this folder.');
		});

		it('should use None state when not collapsible', () => {
			const dropdown = new LocalSnippetsDropdown('/local/path', false);

			expect(dropdown.collapsibleState).toBe(None);
		});

		it('should have folder icon', () => {
			const dropdown = new LocalSnippetsDropdown('/path', true);
			expect(dropdown.iconPath).toBeDefined();
		});
	});

	describe('AllProfilesDropdown', () => {
		it('should create dropdown with correct properties', () => {
			const dropdown = new AllProfilesDropdown();

			expect(dropdown.label).toBe('Profiles Snippets');
			expect(dropdown.collapsibleState).toBe(Collapsed);
			expect(dropdown.folderPath).toBe('');
			expect(dropdown.tooltip).toContain('VS Code Profile Documentation');
		});

		it('should have organization icon', () => {
			const dropdown = new AllProfilesDropdown();
			expect(dropdown.iconPath).toBeDefined();
		});
	});

	describe('AllExtensionDropdown', () => {
		it('should create dropdown with correct properties', () => {
			const dropdown = new AllExtensionDropdown();

			expect(dropdown.label).toBe('Extension Snippets');
			expect(dropdown.collapsibleState).toBe(Collapsed);
			expect(dropdown.folderPath).toBe('');
			expect(dropdown.tooltip).toBe('Snippets that come packaged with extensions.');
		});

		it('should have extensions icon', () => {
			const dropdown = new AllExtensionDropdown();
			expect(dropdown.iconPath).toBeDefined();
		});
	});

	describe('ExtensionDropdown', () => {
		it('should create dropdown with correct properties', () => {
			const dropdown = new ExtensionDropdown('publisher.extension', 'Extension Name');

			expect(dropdown.label).toBe('Extension Name');
			expect(dropdown.indentifer).toBe('publisher.extension');
			expect(dropdown.name).toBe('Extension Name');
			expect(dropdown.description).toBe('publisher.extension');
			expect(dropdown.collapsibleState).toBe(Collapsed);
			expect(dropdown.contextValue).toBe('extension-dropdown');
		});
	});

	describe('ProfileDropdown', () => {
		it('should create dropdown with default icon when profile has no icon', () => {
			const profile: ProfileInfo = {
				name: 'Test Profile',
				location: 'test-location',
			};
			(getPathFromProfileLocation as Mock).mockReturnValue('/path/to/profile');

			const dropdown = new ProfileDropdown(profile, true);

			expect(dropdown.label).toBe('Test Profile');
			expect(dropdown.collapsibleState).toBe(Collapsed);
			expect(dropdown.profile).toBe(profile);
			expect(dropdown.description).toBe('test-location');
			expect(dropdown.contextValue).toBe('profile-dropdown category-dropdown');
			expect(dropdown.folderPath).toBe('/path/to/profile');
			expect(getPathFromProfileLocation).toBeCalledWith('test-location');
		});

		it('should create dropdown with custom icon when profile has icon', () => {
			const profile: ProfileInfo = {
				name: 'Work Profile',
				location: 'work-location',
				icon: 'briefcase',
			};
			(getPathFromProfileLocation as Mock).mockReturnValue('/path/to/work');

			const dropdown = new ProfileDropdown(profile, true);

			expect(dropdown.label).toBe('Work Profile');
			expect(dropdown.iconPath).toBeDefined();
		});

		it('should use None state when not collapsible', () => {
			const profile: ProfileInfo = {
				name: 'Test Profile',
				location: 'test-location',
			};
			(getPathFromProfileLocation as Mock).mockReturnValue('/path');

			const dropdown = new ProfileDropdown(profile, false);

			expect(dropdown.collapsibleState).toBe(None);
		});

		it('should use Collapsed state when collapsible', () => {
			const profile: ProfileInfo = {
				name: 'Test Profile',
				location: 'test-location',
			};
			(getPathFromProfileLocation as Mock).mockReturnValue('/path');

			const dropdown = new ProfileDropdown(profile, true);

			expect(dropdown.collapsibleState).toBe(Collapsed);
		});
	});
});
