import * as vscode from "vscode";
import { getCurrentLanguage } from "../utils/language";
import { getCurrentUri } from "../utils/fsInfo";
import { capitalize } from "../utils/string";

let snippetIndicator: vscode.StatusBarItem;

export default function createStatusBar(context: vscode.ExtensionContext) {
    if (vscode.workspace.getConfiguration("snippetstudio").get<boolean>("showStatusBarItem") === false) {
        return;
    }
    
    createSnippetIndicator();
    
    vscode.workspace.onDidChangeConfiguration(event => {
        if (event.affectsConfiguration("snippetstudio.statusBarPriority")) {
            snippetIndicator.dispose();
            snippetIndicator = createSnippetIndicator();
        }
    });

    vscode.window.onDidChangeActiveTextEditor(_ => {
        updateSnippetIndicatorText();
    });

    context.subscriptions.push(snippetIndicator);
}

function createSnippetIndicator() {
    const priority = vscode.workspace.getConfiguration('snippetstudio').get<number>('statusBarPriority', 30);
    snippetIndicator = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, priority);

    updateSnippetIndicatorText();
    snippetIndicator.command = "snippetstudio.addGlobalSnippet";
    snippetIndicator.tooltip = "Press to create new Snippet";
    snippetIndicator.show();

    return snippetIndicator;
}

function updateSnippetIndicatorText() {
    const langId = getCurrentLanguage();
    let icon: string = langId === "snippets" ?  "$(database)" :
        getCurrentUri()?.scheme === "snippetstudio" ? "$(book)" : "$(repo)";
    if (langId !== undefined) {
        icon += "  " + capitalize(langId);
    }
    snippetIndicator.text = icon;
}