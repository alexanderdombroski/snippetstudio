#!/usr/bin/env node
// vscodeToTextMate.js
// Read a VS Code snippets JSON file and write TextMate .tmSnippet plist files

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function sanitizeBody(body) {
	if (!body) return '';
	// remove ${exec:...} and ${command:...}
	body = body.replace(/\$\{\s*(?:exec|command)\s*:[^}]*\}/g, '');
	// remove inline backtick shell code `...`
	body = body.replace(/`([^`]*)`/g, '');
	return body;
}

function escapeXml(s) {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

function buildTmSnippet({ name, tabTrigger, scope, content, uuid }) {
	const c = escapeXml(content);
	const n = escapeXml(name || 'Snippet');
	const t = tabTrigger ? `<string>${escapeXml(tabTrigger)}</string>` : '';
	const s = scope ? `<string>${escapeXml(scope)}</string>` : '';
	const u = uuid ? `<string>${escapeXml(uuid)}</string>` : '';

	return `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0">\n<dict>\n  <key>content</key>\n  <string>${c}</string>\n  <key>name</key>\n  <string>${n}</string>\n  ${t ? `<key>tabTrigger</key>\n  ${t}` : ''}\n  ${s ? `<key>scope</key>\n  <array>\n    ${s}\n  </array>` : ''}\n  ${u ? `<key>uuid</key>\n  ${u}` : ''}\n</dict>\n</plist>\n`;
}

function main() {
	const argv = process.argv.slice(2);
	const defaultSampleInput = path.resolve(
		__dirname,
		'../sublime/scripts/input/sample.code-snippets.json'
	);
	const inFile = argv[0] || defaultSampleInput;
	const outDir = path.resolve(argv[1] ? process.cwd() : __dirname, argv[1] || './output');

	if (!fs.existsSync(inFile)) {
		console.error('Input file not found:', inFile);
		process.exit(2);
	}
	if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

	const data = JSON.parse(fs.readFileSync(inFile, 'utf8'));
	for (const [key, snippet] of Object.entries(data)) {
		const name = snippet.title || key;
		const tabTrigger = snippet.prefix;
		const scope = snippet.scope || null;
		const body = Array.isArray(snippet.body) ? snippet.body.join('\n') : snippet.body || '';
		const sanitized = sanitizeBody(body);
		const xml = buildTmSnippet({ name, tabTrigger, scope, content: sanitized, uuid: null });
		const filename = `${key.replace(/[^a-z0-9-_]/gi, '-')}.tmSnippet`;
		fs.writeFileSync(path.join(outDir, filename), xml, 'utf8');
		console.log('Wrote', filename);
	}
}

main();
