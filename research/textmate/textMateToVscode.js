#!/usr/bin/env node
// textMateToVscode.js
// Read .tmSnippet plist files from a directory and output a VS Code snippets JSON

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function plutilToJson(filePath) {
  const res = spawnSync('plutil', ['-convert', 'json', '-o', '-', filePath], { encoding: 'utf8' });
  if (res.error) throw res.error;
  if (res.status !== 0) throw new Error(res.stderr || 'plutil failed');
  return JSON.parse(res.stdout);
}

function tmToVscode(snippetObj) {
  const name = snippetObj.name || snippetObj['title'];
  const body = snippetObj.content || '';
  const tabTrigger = snippetObj.tabTrigger || snippetObj['tabTrigger'] || null;
  const scope = (snippetObj.scope && Array.isArray(snippetObj.scope) && snippetObj.scope[0]) || snippetObj.scope || null;
  return {
    title: name,
    prefix: tabTrigger,
    body: body.split('\n'),
    description: snippetObj.description || null,
    scope
  };
}

function main() {
  const argv = process.argv.slice(2);
  const dir = argv[0] || path.join(require('os').homedir(), 'Library/Application Support/Avian/Bundles/User.tmbundle/Snippets');

  if (!fs.existsSync(dir)) {
    console.error('Directory does not exist:', dir);
    process.exit(2);
  }

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.tmSnippet'));
  if (files.length === 0) {
    console.error('No .tmSnippet files found in', dir);
    process.exit(2);
  }

  const out = {};
  for (const f of files) {
    try {
      const json = plutilToJson(path.join(dir, f));
      const entry = tmToVscode(json);
      const key = (entry.title || f).replace(/\s+/g, '-').replace(/[^a-z0-9-_.]/gi, '');
      out[key] = entry;
    } catch (err) {
      console.error('Failed to parse', f, err.message);
    }
  }

  console.log(JSON.stringify(out, null, 2));
}

if (require.main === module) main();
