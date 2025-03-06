import * as vscode from "vscode";
import path from "path";
import os from "os";

/**
 * Grabs the CWD workspace of VSCode
 * 
 * @returns The open workspace folder or undefinied
 */
function getWorkspaceFolder(): string | undefined {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active text editor.');
        return undefined;
    }

    if (editor.document.uri.scheme === 'snippetstudio') {
        return undefined; // Temporary editor, no workspace folder
    }

    const workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
    if (!workspaceFolder) {
        vscode.window.showErrorMessage('Workspace folder not found.');
        return undefined;
    }
    return workspaceFolder.uri.fsPath;
}

function getGlobalSnippetFilesDir(): string | undefined {
    let globalSnippetsPath: string = "";
        switch (process.platform) {
            case 'win32':
                globalSnippetsPath = path.join(os.homedir(), 'AppData', 'Roaming', 'Code', 'User', 'snippets');
                break;
            case 'linux':
                globalSnippetsPath = path.join(os.homedir(), '.config', 'Code', 'User', 'snippets');
                break;
            case 'darwin':
                globalSnippetsPath = path.join(os.homedir(), 'Library', 'Application Support', 'Code', 'User', 'snippets');
                break;
            default:
                vscode.window.showErrorMessage(`Unsupported platform: ${process.platform} Couldn't find global snippets file`);
                return undefined;
        }
    return globalSnippetsPath;
}

export { getWorkspaceFolder, getGlobalSnippetFilesDir };