---
title: The VS Code Way
sidebar_label: The VS Code Way
sidebar_position: 1
---

# The VS Code Way

How would you create snippets without this extension?

Great job creating your first snippet in the [previous tutorial](/docs/getting-started/your-first-snippet.md)! Now that you know how, you can skip this page and *never* consider working with snippets without the help of the extension.

Wait, you *really* want to see how to do it without the extension? 

## Without the help of SnippetStudio

FINE! You don't want help? Do it [the way Microsoft intended](https://code.visualstudio.com/docs/editing/userdefinedsnippets#_create-your-own-snippets).

1. Click the <i className="codicon codicon-settings-gear"></i> in the bottom left corner of VS Code
2. Click `Snippets`
3. Choose a language. *If you pick a new language you don't have snippets for, it will give you helpful comments.*
4. Create a new JSON object that contains at least `prefix` and `body` properties.
5. Expand the `body` array and code inside as if each line of code is a string of the array.
6. Go to a file of that language and see if you can type the prefix and expand the snippet. 

If it worked you're good to go! If not, maybe ask AI? <i className="codicon codicon-copilot up"></i>

Was that painful? Yeah. IDEs like XCode and JetBrains help you quite a bit. <i className="codicon codicon-tools"></i> I don't know who decided it is a good idea to ask developers to manually code in a json file and stringify each line of code, but that's the way you'd have to do it without an extension.

## Problems with the 'VS Code way'

- You can't easily create a snippet from existing code. 
- Any programming language's [LSP](https://microsoft.github.io/language-server-protocol/) <i className="codicon codicon-symbol-color"></i> (autocomplete, word coloring, error detection, etc) can't help you in a json file.
- It's more difficult to open the snippet files every time you need edit a snippet.
- SnippetStudio also adds tooling for adding [snippet insertion features](/docs/snippet-management/snippet-insertion-features.md) too.

*If you found your experience was much better using the extension, consider giving the [SnippetStudio GitHub](https://github.com/alexanderdombroski/snippetstudio) a star or leave a rating at the [marketplace](https://marketplace.visualstudio.com/items?itemName=AlexDombroski.snippetstudio).*
