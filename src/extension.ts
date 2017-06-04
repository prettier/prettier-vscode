import {
    languages,
    ExtensionContext,
    DocumentSelector,
    window,
    workspace,
} from 'vscode';
import EditProvider from './PrettierEditProvider';

import { PrettierVSCodeConfig } from './types.d';

function checkConfig(): PrettierVSCodeConfig {
    const config: PrettierVSCodeConfig = workspace.getConfiguration(
        'prettier'
    ) as any;
    if (config.useFlowParser) {
        window.showWarningMessage(
            "Option 'useFlowParser' has been deprecated. " +
                'Use \'parser: "flow"\' instead.'
        );
    }
    if (typeof config.trailingComma === 'boolean') {
        window.showWarningMessage(
            "Option 'trailingComma' as a boolean value has been deprecated. " +
                "Use 'none', 'es5' or 'all' instead."
        );
    }
    return config;
}

export function activate(context: ExtensionContext) {
    const editProvider = new EditProvider();
    const config = checkConfig();
    const languageSelector = [
        ...config.javascriptEnable,
        ...config.typescriptEnable,
        ...config.cssEnable,
    ];

    context.subscriptions.push(
        languages.registerDocumentRangeFormattingEditProvider(
            languageSelector,
            editProvider
        ),
        languages.registerDocumentFormattingEditProvider(
            languageSelector,
            editProvider
        )
    );
}

// this method is called when your extension is deactivated
export function deactivate() {}
