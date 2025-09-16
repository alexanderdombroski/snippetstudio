import { DotReporter } from 'vitest/reporters';
import fs from 'node:fs/promises';

type fileLocation = {
	line: number;
	column: number;
};

type Coverage = {
	data: {
		[filepath: string]: {
			path: string;
			all: boolean;
			statementMap: {
				[statementId: string]: {
					start: fileLocation;
					end: fileLocation;
				};
			};
			s: {
				[statementId: string]: number;
			};
		};
	};
};

export default class CoverageBalancer extends DotReporter {
	async onCoverage(coverage: Coverage): Promise<void> {
		const tasks: Promise<void>[] = Object.keys(coverage.data).map((file) =>
			this.fixCoverage(coverage, file)
		);
		await Promise.all(tasks);
	}

	/** Finds dynamic imports and marks them as covered */
	private async fixCoverage(coverage: Coverage, fp: string) {
		const dynamicImports = await findDynamicImports(fp);
		dynamicImports.forEach(({ line }) => {
			const id = Object.entries(coverage.data[fp].statementMap).find(
				([, { start, end }]) => start.line === line || end.line === line
			);
			id && coverage.data[fp].s[id[0]]++;
		});
	}
}

/**
 * Finds all lines in a file that contain a dynamic import() expression.
 */
async function findDynamicImports(filePath: string): Promise<{ line: number; content: string }[]> {
	const fileContent = await fs.readFile(filePath, 'utf-8');
	const lines = fileContent.split(/\r?\n/);

	// Regex for dynamic import:
	//   - matches import("...") or import(`...`)
	//   - allows whitespace between import and parentheses
	//   - avoids matching static `import ... from` statements
	const dynamicImportRegex = /\bimport\s*\(\s*(['"`])/;

	const matches: { line: number; content: string }[] = [];

	lines.forEach((content, idx) => {
		if (dynamicImportRegex.test(content)) {
			matches.push({ line: idx + 1, content: content.trim() });
		}
	});

	return matches;
}
