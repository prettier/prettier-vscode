import { Range, TextDocument } from 'vscode';

/**
 * Determines document full range
 * 
 * @param document 
 */
export function fullDocumentRange(document: TextDocument): Range {
    const lastLineId = document.lineCount - 1;
    return new Range(0, 0, lastLineId, document.lineAt(lastLineId).text.length);
}
