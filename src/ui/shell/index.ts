import * as vscode from 'vscode';
import { ShellViewProvider } from './ShellViewProvider';

let shellViewProvider: ShellViewProvider | undefined;

export function getShellView(context: vscode.ExtensionContext): ShellViewProvider {
    if (!shellViewProvider) {
        shellViewProvider = new ShellViewProvider();
        vscode.window.registerTreeDataProvider('shellSnippets', shellViewProvider);
    }
    return shellViewProvider;
}
