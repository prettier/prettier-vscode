import { commands, languages, ExtensionContext } from 'vscode';

import EditProvider from './PrettierEditProvider';

import { getActiveLanguages } from './config';
import { setupOutputHandler, channelCommand, showChannel } from './output';
import { setupStatusHandler } from './status';

export function activate(context: ExtensionContext) {
    const editProvider = new EditProvider();

    context.subscriptions.push(
        commands.registerCommand(channelCommand, showChannel),
        languages.registerDocumentFormattingEditProvider(
            getActiveLanguages(),
            editProvider
        )
    );

    setupStatusHandler();
    setupOutputHandler();
}

// this method is called when your extension is deactivated
export function deactivate() {}
