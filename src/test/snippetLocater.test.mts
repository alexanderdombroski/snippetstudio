import * as assert from 'assert';
import * as vscode from 'vscode';
// import * as path from 'path';
import locateSnippetFiles from '../snippets/locateSnippets.mjs';
// import fs from "fs";

suite('Snippet File Location Tests', () => {
  vscode.window.showInformationMessage('Start snippet file location tests.');

  // test('locateSnippetFiles returns correct file paths', async () => {
  //   // Create a test workspace and open a test file.
  //   const testWorkspaceUri = vscode.Uri.file(path.join(__dirname, 'test-fixtures'));//Adjust the path.
  //   const testFileUri = vscode.Uri.file(path.join(testWorkspaceUri.fsPath, 'test.js'));
  //   if (!fs.existsSync(testFileUri.fsPath)) {
  //     fs.writeFileSync(testFileUri.fsPath, ''); // Create an empty file
  //   }


  //   // Open the test file.
  //   const document = await vscode.workspace.openTextDocument(testFileUri);
  //   await vscode.window.showTextDocument(document);

  //   // Call the function.
  //   const snippetFiles = await locateSnippetFiles();

  //   // Log the results (for debugging).
  //   console.log('Snippet files found:', snippetFiles);

  //   // Add assertions based on your test setup.
  //   assert.ok(snippetFiles.length > 0, 'Should find at least one snippet file.');
  //   assert.ok(snippetFiles.some((file: string) => file.endsWith('javascript.json')), 'Should include javascript.json.');
  //   assert.ok(snippetFiles.some((file: string) => file.endsWith('test.code-snippets')), 'Should include test.code-snippets.');

  //   // Add more assertions based on your test files.
  // });

  test('locateSnippetFiles returns empty array with no open editor', async () => {
    //close all editors.
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');

    const snippetFiles = await locateSnippetFiles();
    assert.deepStrictEqual(snippetFiles, [], 'Should return an empty array with no open editor.');
  });

});