import {
    workspace,
    DocumentFormattingEditProvider,
    Range,
    TextDocument,
    FormattingOptions,
    CancellationToken,
    TextEdit
} from 'vscode';

import { PrettierVSCodeConfig } from './prettier.d';
import { PrettierEslint } from './prettier-eslint.d';

import { selectParser, isBabylonParser, extractUserVSConfig } from './config';
import { safeExecution } from './exec';

const prettier = require('../ext');

/**
 * Format the given text with user's configuration.
 * @param text Text to format
 * @param path formatting file's path
 * @returns {string} formatted text
 */
function format(
    text: string,
    { fileName, languageId }: TextDocument,
    customOptions: object
): string {
    const config: PrettierVSCodeConfig = workspace.getConfiguration(
        'prettier'
    ) as any;

    const parser = selectParser(config, languageId);
    if (!parser) {
        return text;
    }

    const prettierOptions = {
        ...{ parser, filepath: fileName },
        ...extractUserVSConfig(config),
        ...customOptions
    };

    if (config.eslintIntegration && isBabylonParser(parser)) {
        return safeExecution(
            () => {
                const prettierEslint = require('prettier-eslint') as PrettierEslint;

                return prettierEslint({
                    text,
                    filePath: fileName,
                    fallbackPrettierOptions: prettierOptions
                });
            },
            text,
            fileName
        );
    }

    return safeExecution(
        () => prettier.format(text, prettierOptions),
        text,
        fileName
    );
}

function fullDocumentRange(document: TextDocument): Range {
    const lastLineId = document.lineCount - 1;
    return new Range(0, 0, lastLineId, document.lineAt(lastLineId).text.length);
}

class PrettierEditProvider implements DocumentFormattingEditProvider {
    provideDocumentFormattingEdits(
        document: TextDocument,
        options: FormattingOptions,
        token: CancellationToken
    ): TextEdit[] {
        return [
            TextEdit.replace(
                fullDocumentRange(document),
                format(document.getText(), document, {})
            )
        ];
    }
}

export default PrettierEditProvider;
