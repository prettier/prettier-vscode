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
export function statusInitial(): void {
    statusBarItem.show();
    updateStatus('...');
}

/**
 * Displays check
 */
export function statusSuccess(): void {
    updateStatus('$(check)');
}

/**
 * Displays alert
 */
export function statusFailed(): void {
    updateStatus('$(issue-opened)');
}

/**
 * Clear the status bar
 */
export function clearStatus(): void {
    statusBarItem.text = ``;
}

/**
 * Displays message and remove loader
 * 
 * @param message
 */
function updateStatus(message: string): void {
    statusBarItem.text = `${statusKey} ${message}`;
}

/**
 * Toggles status bar based on current file type
 * Let it open when if switching to output log
 * 
 * @param supportedLanguages 
 */
function toggleStatusBar(document: TextDocument): void {
    if (document.languageId === `Log`) {
        return;
    }

    if (!currentDocument || document !== currentDocument) {
        currentDocument = document;
        isLanguageActive(document.languageId) ? statusInitial() : clearStatus();
    }
}

/**
 * Setup status bar if current document is supported
 */
export function setupStatusHandler(): void {
    let config = getExtensionConfig();

    // init status bar
    statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, 42);
    statusBarItem.command = channelCommand;

    // initial toggle
    window.activeTextEditor &&
        toggleStatusBar(window.activeTextEditor.document);

    // setting event handlers
    window.onDidChangeActiveTextEditor((e) => toggleStatusBar(e.document));
    workspace.onDidChangeConfiguration(() => {
        config = getExtensionConfig();
        !config.statusBar && clearStatus();
    });

    !config.statusBar && clearStatus();
}
