import { window, OutputChannel } from 'vscode';

import { getExtensionConfig } from './config';

export const channelCommand = `prettier-now.show-output`;
let channel: OutputChannel;

/**
 * Clear channel
 */
export function clearChannel(): void {
    channel.clear();
}

/**
 * Show channel
 */
export function showChannel(): void {
    channel.show();
}

/**
 * Hide channel
 */
export function hideChannel(): void {
    channel.hide();
}

/**
 * Append messages to the output channel and format it with a title
 *
 * @param message The message to append to the output channel
 * @param fileName The path to the file
 */
export function addToOutput(message: string, fileName: string): void {
    const config = getExtensionConfig();
    const infos = `[${new Date().toLocaleTimeString()}] ${fileName}:\n`;

    channel.appendLine(infos);
    channel.appendLine(`${message}`);
    channel.appendLine('-'.repeat(infos.length));

    config.openOutput && showChannel();
}

/**
 * Setup status bar if current document is supported
 *
 * @returns {Disposable} The command to open the output channel
 */
export function setupOutputHandler() {
    channel = window.createOutputChannel('Prettier');
}
