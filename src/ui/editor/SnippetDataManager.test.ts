import { describe, it, expect, beforeEach } from 'vitest';
import SnippetDataManager from './SnippetDataManager';
import type { SnippetDataV2 } from '../../types';

describe('SnippetDataManager', () => {
	let dataManager: SnippetDataManager;
	const uri1 = 'snippetstudio:///snippet';
	const snippetData1: SnippetDataV2 = {
		snippetTitle: 'extension snippets',
		prefix: 'test',
		scope: 'typescript',
		description: 'A test snippet',
		filepath: 'typescript.json',
	};

	beforeEach(() => {
		dataManager = new SnippetDataManager();
		dataManager.setData(uri1, { ...snippetData1 });
	});

	it('should set and get snippet data', () => {
		const retrievedData = dataManager.getData(uri1);
		expect(retrievedData).toEqual(snippetData1);
	});

	it('should return undefined for a non-existent key', () => {
		const retrievedData = dataManager.getData('non-existent-uri');
		expect(retrievedData).toBeUndefined();
	});

	it('should check if a key exists', () => {
		expect(dataManager.hasKey(uri1)).toBe(true);
		expect(dataManager.hasKey('non-existent-uri')).toBe(false);
	});

	it('should delete snippet data', () => {
		dataManager.deleteData(uri1);
		expect(dataManager.hasKey(uri1)).toBe(false);
		expect(dataManager.getData(uri1)).toBeUndefined();
	});

	it('should not throw when deleting a non-existent key', () => {
		expect(() => dataManager.deleteData('non-existent-uri')).not.toThrow();
	});

	it('should set partial data for an existing snippet', () => {
		const newPrefix = 'updated-prefix';
		dataManager.setPartialData(uri1, 'prefix', newPrefix);
		const retrievedData = dataManager.getData(uri1);
		expect(retrievedData?.prefix).toBe(newPrefix);
		expect(retrievedData?.scope).toBe(snippetData1.scope);
	});

	it('should not throw when setting partial data for a non-existent snippet', () => {
		const newPrefix = 'updated-prefix';
		expect(() => dataManager.setPartialData('non-existent-uri', 'prefix', newPrefix)).not.toThrow();
		expect(dataManager.getData('non-existent-uri')).toBeUndefined();
	});
});
