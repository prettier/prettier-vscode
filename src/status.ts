// import { workspace, window, Disposable, StatusBarItem, StatusBarAlignment } from 'vscode';
import { window, StatusBarItem, StatusBarAlignment } from 'vscode';

import { channelCommand } from './output';
import { isLanguageActive } from './config';

const statusKey = 'Prettier:';

// Status bar
let statusBarItem: StatusBarItem;

/**
 * Initial text
 */
export function statusInitial() {
    statusBarItem.show();
    return updateStatus('...');
}

/**
 * Displays check
 */
export function statusSuccess() {
    return updateStatus('$(check)');
}

/**
 * Displays alert
 */
export function statusFailed() {
    return updateStatus('$(issue-opened)');
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
 * @param languageId 
 * @param supportedLanguages 
 */
function toggleStatusBar(languageId: string): void {
    if (languageId === `Log`) {
        return;
    }

    isLanguageActive(languageId) ? statusInitial() : statusEmpty();
}

/**
 * Setup status bar if current document is supported
 *
 * @returns {Disposable} The command to open the output channel
 */
export function setupStatusHandler() {
    statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);
    statusBarItem.command = channelCommand;

    toggleStatusBar(window.activeTextEditor.document.languageId);

    window.onDidChangeActiveTextEditor((e) =>
        toggleStatusBar(e.document.languageId)
    );
}
