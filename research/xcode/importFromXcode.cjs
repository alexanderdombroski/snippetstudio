#!/usr/bin/env node
// importFromXcode.js
// Minimal script to read Xcode .codesnippet plist files and log title/body/description/prefix

/* eslint-disable jsdoc/require-jsdoc */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function plutilToJson(filePath) {
  // Use plutil to convert plist to JSON (macOS)
  const res = spawnSync('plutil', ['-convert', 'json', '-o', '-', filePath], { encoding: 'utf8' });
  if (res.error) throw res.error;
  if (res.status !== 0) throw new Error(res.stderr || 'plutil failed');
  return JSON.parse(res.stdout);
}

function extractFields(obj, filePath) {
  // Keys may or may not exist; do best-effort extraction
  return {
    file: filePath,
    id: obj.IDECodeSnippetIdentifier || null,
    title: obj.IDECodeSnippetTitle || null,
    description: obj.IDECodeSnippetSummary || null,
    prefix: obj.IDECodeSnippetCompletionPrefix || null,
    body: obj.IDECodeSnippetContents || null,
    language: obj.IDECodeSnippetLanguage || null
  };
}

function processFile(filePath) {
  try {
    const json = plutilToJson(filePath);
    const data = extractFields(json, filePath);
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error processing', filePath, err.message);
  }
}

function main() {
  const argv = process.argv.slice(2);
  let target = argv[0];
  if (!target) {
    target = path.join(require('os').homedir(), 'Library/Developer/Xcode/UserData/CodeSnippets');
  }

  if (!fs.existsSync(target)) {
    console.error('Target does not exist:', target);
    process.exit(2);
  }

  const stat = fs.statSync(target);
  if (stat.isFile()) {
    processFile(target);
    return;
  }

  // directory: find .codesnippet files
  const files = fs.readdirSync(target).filter(f => f.endsWith('.codesnippet'));
  if (files.length === 0) {
    console.error('No .codesnippet files found in', target);
    return;
  }

  for (const f of files) {
    processFile(path.join(target, f));
  }
}

if (require.main === module) main();
