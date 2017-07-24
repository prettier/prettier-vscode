import { window, workspace, DocumentSelector } from 'vscode';
import { PrettierVSCodeConfig } from './types.d';

let currentRootPath: string = workspace.rootPath;

export function onWorkspaceRootChange(cb: (rootPath: string) => void): void {
    workspace.onDidChangeConfiguration(() => {
        if (currentRootPath !== workspace.rootPath) {
            cb(workspace.rootPath);
            currentRootPath = workspace.rootPath;
        }
    });
}

export function checkConfig(): PrettierVSCodeConfig {
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

export function allEnabledLanguages(): DocumentSelector {
    const config = checkConfig();
    return [
        ...config.javascriptEnable,
        ...config.typescriptEnable,
        ...config.cssEnable,
        ...config.jsonEnable,
        ...config.graphqlEnable,
    ];
}
