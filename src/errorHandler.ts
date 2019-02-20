import {
    Disposable,
    StatusBarItem,
    OutputChannel,
    StatusBarAlignment,
    TextEditor,
    commands,
    window,
    languages,
} from 'vscode';

import { allEnabledLanguages, getConfig } from './utils';
import { PrettierVSCodeConfig } from './types';

let statusBarItem: StatusBarItem;
let outputChannel: OutputChannel;
let prettierInformation: string;

function toggleStatusBarItem(editor: TextEditor | undefined): void {
    if (statusBarItem === undefined) {
        return;
    }

    if (editor !== undefined) {
        // The function will be triggered everytime the active "editor" instance changes
        // It also triggers when we focus on the output panel or on the debug panel
        // Both are seen as an "editor".
        // The following check will ignore such panels
        if (
            ['debug', 'output'].some(
                part => editor.document.uri.scheme === part
            )
        ) {
            return;
        }

        const score = languages.match(allEnabledLanguages(), editor.document);
        const disabledLanguages: PrettierVSCodeConfig["disableLanguages"] = getConfig(editor.document.uri).disableLanguages;

        if (score > 0 && !disabledLanguages.includes(editor.document.languageId)) {
            statusBarItem.show();
        } else {
            statusBarItem.hide();
        }
    } else {
        statusBarItem.hide();
    }
}

export function registerDisposables(): Disposable[] {
    return [
        // Keep track whether to show/hide the statusbar
        window.onDidChangeActiveTextEditor(editor => {
            toggleStatusBarItem(editor);
        })
    ];
}

/**
 * Update the statusBarItem message and show the statusBarItem
 *
 * @param message The message to put inside the statusBarItem
 */
function updateStatusBar(message: string): void {
    statusBarItem.text = message;
    statusBarItem.tooltip = prettierInformation;
    statusBarItem.show();
}

/**
 *
 * @param module the module used
 * @param version the version of the module
 * @param bundled is it bundled with the extension or not
 */
export function setUsedModule(
    module: string,
    version: string,
    bundled: boolean
) {
    prettierInformation = `${module}@${version}${bundled ? ' (bundled)' : ''}`;
}

/**
 * Adds the filepath to the error message
 *
 * @param msg The original error message
 * @param fileName The path to the file
 * @returns {string} enhanced message with the filename
 */
function addFilePath(msg: string, fileName: string): string {
    const lines = msg.split('\n');
    if (lines.length > 0) {
        lines[0] = lines[0].replace(/(\d*):(\d*)/g, `${fileName}:$1:$2`);
        return lines.join('\n');
    }

    return msg;
}

/**
 * Append messages to the output channel and format it with a title
 *
 * @param message The message to append to the output channel
 */
export function addToOutput(message: string): void {
    const title = `${new Date().toLocaleString()}:`;

    // Create a sort of title, to differentiate between messages
    outputChannel.appendLine(title);
    outputChannel.appendLine('-'.repeat(title.length));

    // Append actual output
    outputChannel.appendLine(`${message}\n`);
}

/**
 * Execute a callback safely, if it doesn't work, return default and log messages.
 *
 * @param cb The function to be executed,
 * @param defaultText The default value if execution of the cb failed
 * @param fileName The filename of the current document
 * @returns {string} formatted text or defaultText
 */
export function safeExecution(
    cb: (() => string) | Promise<string>,
    defaultText: string,
    fileName: string
): string | Promise<string> {
    if (cb instanceof Promise) {
        return cb
            .then(returnValue => {
                updateStatusBar('Prettier: $(check)');
                return returnValue;
            })
            .catch((err: Error) => {
                addToOutput(addFilePath(err.message, fileName));
                updateStatusBar('Prettier: $(x)');

                return defaultText;
            });
    }
    try {
        const returnValue = cb();

        updateStatusBar('Prettier: $(check)');

        return returnValue;
    } catch (err) {
        addToOutput(addFilePath(err.message, fileName));
        updateStatusBar('Prettier: $(x)');

        return defaultText;
    }
}
/**
 * Setup the output channel and the statusBarItem.
 * Create a command to show the output channel
 *
 * @returns {Disposable} The command to open the output channel
 */
export function setupErrorHandler(): Disposable {
    // Setup the statusBarItem
    statusBarItem = window.createStatusBarItem(StatusBarAlignment.Right, -1);
    statusBarItem.text = 'Prettier';
    statusBarItem.command = 'prettier.open-output';

    toggleStatusBarItem(window.activeTextEditor);

    // Setup the outputChannel
    outputChannel = window.createOutputChannel('Prettier');

    return commands.registerCommand('prettier.open-output', () => {
        outputChannel.show();
    });
}
