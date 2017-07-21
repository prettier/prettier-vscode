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
 * Append messages to the output channel
 *
 * @param message
 * @param fileName
 */
export function addToOutput(message: string, fileName: string): void {
    const config = getExtensionConfig();
    const metas = `[${new Date().toLocaleTimeString()}] ${fileName}:\n`;

    channel.appendLine(metas);
    channel.appendLine(`${message}`);
    channel.appendLine('-'.repeat(metas.length));

    config.openOutput && showChannel();
}

/**
 * Setup status bar if current document is supported
 */
export function setupOutputHandler(): void {
    channel = window.createOutputChannel('Prettier');
}
