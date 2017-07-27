import { commands, languages, ExtensionContext } from 'vscode';

import EditProvider from './PrettierEditProvider';

import { setupOutputHandler, channelCommand, showChannel } from './output';
import { setupStatusHandler } from './status';

export function activate(context: ExtensionContext) {
    const editProvider = new EditProvider();

    return languages.getLanguages().then((vsLanguages) => {
        context.subscriptions.push(
            commands.registerCommand(channelCommand, showChannel),
            languages.registerDocumentFormattingEditProvider(
                vsLanguages,
                editProvider
            )
        );

        setupStatusHandler();
        setupOutputHandler();
    });
}

// this method is called when your extension is deactivated
export function deactivate(): void {}
