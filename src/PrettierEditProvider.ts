import {
    DocumentFormattingEditProvider,
    TextDocument,
    FormattingOptions,
    CancellationToken,
    TextEdit
} from 'vscode';

import { format } from './format';
import { fullDocumentRange } from './utils';

/**
 * Prettier provider
 */
class PrettierEditProvider implements DocumentFormattingEditProvider {
    provideDocumentFormattingEdits(
        document: TextDocument,
        options: FormattingOptions,
        token: CancellationToken
    ): TextEdit[] {
        return [
            TextEdit.replace(
                fullDocumentRange(document),
                format(document.getText(), document)
            )
        ];
    }
}

export default PrettierEditProvider;
