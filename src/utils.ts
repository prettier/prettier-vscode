import { workspace, DocumentSelector, Uri } from 'vscode';
import { PrettierVSCodeConfig } from './types.d';

export function getConfig(uri?: Uri): PrettierVSCodeConfig {
    return workspace.getConfiguration('prettier', uri) as any;
}

export function allEnabledLanguages(): DocumentSelector {
    const config = getConfig();

    return [
        ...config.javascriptEnable,
        ...config.typescriptEnable,
        ...config.cssEnable,
        ...config.jsonEnable,
        ...config.graphqlEnable,
    ];
}
