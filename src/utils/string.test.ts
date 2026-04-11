import { describe, expect, it } from 'vitest';
import { capitalize, ensureString, titleCase } from './string';

describe('string utils', () => {
	describe('titleCase', () => {
		it('should convert a sentence to title case', () => {
			expect(titleCase('hello world')).toBe('Hello World');
		});

		it('should handle single words', () => {
			expect(titleCase('hello')).toBe('Hello');
		});

		it('should handle empty strings', () => {
			expect(titleCase('')).toBe('');
		});
	});

	describe('capitalize', () => {
		it('should capitalize a word', () => {
			expect(capitalize('hello')).toBe('Hello');
		});

		it('should handle single characters', () => {
			expect(capitalize('h')).toBe('H');
		});

		it('should handle empty strings', () => {
			expect(capitalize('')).toBe('');
		});
	});

	describe('ensureString', () => {
		it('should convert a string array to a string', () => {
			expect(ensureString(['line 1', 'line 2'])).toBe('line 1\nline 2');
		});

		it('should return the same string if a string is passed', () => {
			expect(ensureString('hello world')).toBe('hello world');
		});

		it('should return an empty string for null or undefined', () => {
			expect(ensureString(null)).toBe('');
			expect(ensureString(undefined)).toBe('');
		});
	});
});
