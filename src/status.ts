import {
    window,
    workspace,
    StatusBarItem,
    StatusBarAlignment,
    TextDocument
} from 'vscode';

import { channelCommand } from './output';
import { getExtensionConfig, isLanguageActive } from './config';

const statusKey = 'Prettier:';

// Status bar
let statusBarItem: StatusBarItem;
let currentDocument: TextDocument;

/**
 * Initial text
 */
export function statusInitial() {
    statusBarItem.show();
    updateStatus('...');
}

/**
 * Displays check
 */
export function statusSuccess() {
    updateStatus('$(check)');
}

/**
 * Displays alert
 */
export function statusFailed() {
    updateStatus('$(issue-opened)');
}

/**
 * Clear the status bar
 */
export function statusEmpty() {
    statusBarItem.text = ``;
}

/**
 * Displays message and remove loader
 * 
 * @param message
 */
function updateStatus(message: string) {
    statusBarItem.text = `${statusKey} ${message}`;
}

/**
 * Toggles status bar based on current file type
 * Let it open when if watching output log
 * 
 * @param supportedLanguages 
 */
function toggleStatusBar(document: TextDocument): void {
    if (document.languageId === `Log`) {
        return;
    }

    if (!currentDocument || document !== currentDocument) {
        currentDocument = document;
        isLanguageActive(document.languageId) ? statusInitial() : statusEmpty();
    }
}

/**
 * Setup status bar if current document is supported
 *
 * @returns {Disposable} The command to open the output channel
 */
export function setupStatusHandler() {
    let config = getExtensionConfig();

    // init status bar
    statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);
    statusBarItem.command = channelCommand;

    // initial toggle
    toggleStatusBar(window.activeTextEditor.document);

    // setting event handlers
    window.onDidChangeActiveTextEditor((e) => toggleStatusBar(e.document));
    workspace.onDidChangeConfiguration(() => {
        // refresh config
        config = getExtensionConfig();

        !config.statusBar && statusEmpty();
    });

    !config.statusBar && statusEmpty();
}
