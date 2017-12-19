import {
    languages,
    ExtensionContext,
    workspace,
    DocumentFilter,
    DocumentSelector,
    RelativePattern,
} from 'vscode';
import EditProvider from './PrettierEditProvider';
import { setupErrorHandler, registerDisposables } from './errorHandler';
import { allEnabledLanguages, allJSLanguages, getConfig } from './utils';
import configFileListener from './configCacheHandler';
import ignoreFileHandler from './ignoreFileHandler';
interface Selector {
    rangeLanguageSelector: DocumentSelector;
    languageSelector: DocumentSelector;
}
function selectors(): Selector {
    const allLanguages = allEnabledLanguages();
    const allRangeLanguages = allJSLanguages();
    if (workspace.workspaceFolders === undefined) {
        // no workspace opened
        const { disableLanguages } = getConfig();
        const languageSelector = allLanguages.filter(
            l => !disableLanguages.includes(l)
        );
        const rangeLanguageSelector = allRangeLanguages.filter(
            l => !disableLanguages.includes(l)
        );
        return { languageSelector, rangeLanguageSelector };
    }
    // at least 1 workspace

    // TODO: untitled files to concat.
    return workspace.workspaceFolders.reduce(
        (
            ret: {
                languageSelector: DocumentFilter[];
                rangeLanguageSelector: DocumentFilter[];
            },
            wf
        ) => {
            const { disableLanguages } = getConfig(wf.uri);
            let { languageSelector, rangeLanguageSelector } = ret;
            const relativePattern = new RelativePattern(wf, '**');

            languageSelector = languageSelector.concat(
                allLanguages.filter(l => !disableLanguages.includes(l)).map(
                    l =>
                        ({
                            language: l,
                            pattern: relativePattern,
                        } as DocumentFilter)
                )
            );
            rangeLanguageSelector = rangeLanguageSelector.concat(
                allRangeLanguages
                    .filter(l => !disableLanguages.includes(l))
                    .map(
                        l =>
                            ({
                                language: l,
                                pattern: relativePattern,
                            } as DocumentFilter)
                    )
            );
            return { languageSelector, rangeLanguageSelector };
        },
        { languageSelector: [], rangeLanguageSelector: [] }
    );
}

export function activate(context: ExtensionContext) {
    const { fileIsIgnored } = ignoreFileHandler(context.subscriptions);
    const editProvider = new EditProvider(fileIsIgnored);

    const { languageSelector, rangeLanguageSelector } = selectors();
    context.subscriptions.push(
        languages.registerDocumentRangeFormattingEditProvider(
            rangeLanguageSelector,
            editProvider
        ),
        languages.registerDocumentFormattingEditProvider(
            languageSelector,
            editProvider
        ),
        setupErrorHandler(),
        configFileListener(),
        ...registerDisposables()
    );
}

// this method is called when your extension is deactivated
export function deactivate() {}
