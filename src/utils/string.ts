import * as vscode from "vscode";

function titleCase(str: string): string {
    return str.split(' ').map(w => capitalize(w)).join(' ');
}

function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

async function unTabMultiline(selection: vscode.Selection, editor: vscode.TextEditor): Promise<string> {
    if (selection.isEmpty) {
        return "";
    }

    if (!selection.isSingleLine) {
        const start = new vscode.Position(selection.start.line, 0);
        selection = new vscode.Selection(start, editor.document.lineAt(selection.end.line).range.end);
    }

    await vscode.commands.executeCommand("editor.action.indentationToSpaces");
    const selectedText = editor.document.getText(selection);
    const lines = selectedText.split(/\r\n|\r|\n/);
    const spaces = countMinSpaces(lines);

    return lines.map(line => line.substring(spaces)).join("\n");
}

function countMinSpaces(lines: string[]): number {
    let minCount = 9999;
    for (let line of lines) {
        if (line.trim().length === 0) {
            continue;
        }
        
        let count = 0;
        for (let char of line) {
            if (char === ' ') {
                count += 1;
            } else {
                minCount = Math.min(count, minCount);
                break;
            }
        }
    }
    if (minCount === 9999) {
        return 0;
    }
    return minCount;
}

export { titleCase, unTabMultiline, capitalize };