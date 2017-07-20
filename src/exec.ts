import { window, TextDocument, Position, Range, Selection } from 'vscode';

import { getExtensionConfig } from './config';
import { statusSuccess, statusFailed } from './status';
import { hideChannel, addToOutput } from './output';

/**
 * Exec with status
 * 
 * @param cb 
 * @param originalText 
 * @param fileName 
 */
export function exec(
    cb: () => string,
    originalText: string,
    document: TextDocument
): string {
    try {
        const ret = cb();

        statusSuccess();
        hideChannel();

        return ret;
    } catch (e) {
        handleError(e, document);

        return originalText;
    }
}

/**
 * Add error to output
 * and move cursor to error if possible
 * 
 * @param err 
 * @param document 
 */
function handleError(err: any, document: TextDocument) {
    const config = getExtensionConfig();

    statusFailed();
    addToOutput(err.message, document.fileName);

    // move cursor straight to error
    if (config.autoScroll && err.loc) {
        const errorPosition = new Position(
            err.loc.start.line - 1,
            err.loc.start.column
        );

        const rangeError = new Range(errorPosition, errorPosition);

        window.showTextDocument(document).then((editor) => {
            editor.selection = new Selection(rangeError.start, rangeError.end);
            editor.revealRange(rangeError);
        });
    }
}
