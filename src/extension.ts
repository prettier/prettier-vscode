import { commands, languages, ExtensionContext } from 'vscode';

import EditProvider from './PrettierEditProvider';

import { setupOutputHandler, channelCommand, showChannel } from './output';
import { setupStatusHandler } from './status';
import { getExtensionConfig } from './config';

export function activate(context: ExtensionContext) {
    const editProvider = new EditProvider();
    const config = getExtensionConfig();
    const languages = config.getActiveLanguages();

    context.subscriptions.push(
        commands.registerCommand(channelCommand, showChannel),
        languages.registerDocumentFormattingEditProvider(languages, editProvider)
    );

    setupStatusHandler();
    setupOutputHandler();
}

// this method is called when your extension is deactivated
export function deactivate(): void {}
