# Contributing to SnippetStudio

Thanks for taking the time to contribute! Please follow these steps and guidelines.

## Issues

- Search existing issues before opening a new one.
- Use clear and descriptive titles.
- Include steps to reproduce when applicable.
- If an unassigned issue exists and you want to work on it, add a comment asking to be assigned and I can assign you

## Contributing to extension

- For new features, submit a [feature request](https://github.com/alexanderdombroski/snippetstudio/issues/new?template=feature_request.yml)

### Testing the Extension

VS Code makes it easy to test extensions. You can [run the extension using the debugger](https://code.visualstudio.com/docs/debugtest/debugging#_start-a-debugging-session). This will only work if the project is opened as the root of the workspace. ie (`.vscode/launch.json` is at the root of the filetree).

If you're testing for another IDE, you can package the extension as a vsix and install it.

1. npm run package
2. npx vsce package

### Steps to Contribute

1. Fork the repository
2. Make your changes
3. Use [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/)
4. Test code with the [launch config](https://code.visualstudio.com/docs/debugtest/debugging#_launch-configurations)
5. Push your branch and open your fork on github
6. Open a Pull Request (press the `contribute` then `open pull request` buttons)
7. Request a review

See ["Your First Extension"](https://code.visualstudio.com/api/get-started/your-first-extension) for additional help.

## Contributing to docs

This site uses Docusaurus inside of the docs/ directory.

---

If you’re unsure about anything, feel free to ask an [issue related question](https://github.com/alexanderdombroski/snippetstudio/issues/new?template=question.yml) or start a [discussion](https://github.com/alexanderdombroski/snippetstudio/discussions)