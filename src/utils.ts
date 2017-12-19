import { workspace, Uri } from 'vscode';
import {
    PrettierVSCodeConfig,
    Prettier,
    PrettierSupportInfo,
    ParserOption,
} from './types.d';

export function getConfig(uri?: Uri): PrettierVSCodeConfig {
    return workspace.getConfiguration('prettier', uri) as any;
}

export function getParsersFromLanguageId(
    languageId: string,
    version: string
): ParserOption[] {
    const language = getSupportLanguages().find(lang =>
        lang.vscodeLanguageIds.includes(languageId)
    );
    if (!language) {
        return [];
    }
    return language.parsers;
}

export function allEnabledLanguages(): string[] {
    return getSupportLanguages().reduce(
        (ids, language) => [...ids, ...language.vscodeLanguageIds],
        [] as string[]
    );
}

export function allJSLanguages(): string[] {
    return getGroup('JavaScript')
        .filter(language => language.group === 'JavaScript')
        .reduce(
            (ids, language) => [...ids, ...language.vscodeLanguageIds],
            [] as string[]
        );
}

export function getGroup(group: string): PrettierSupportInfo['languages'] {
    return getSupportLanguages().filter(language => language.group === group);
}

function getSupportLanguages() {
    return (require('prettier') as Prettier).getSupportInfo().languages;
}
