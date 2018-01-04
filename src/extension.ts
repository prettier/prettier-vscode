import {
    languages,
    ExtensionContext,
    workspace,
    DocumentFilter,
    DocumentSelector,
    RelativePattern,
    WorkspaceFolder,
    Disposable,
} from 'vscode';
import EditProvider from './PrettierEditProvider';
import { setupErrorHandler, registerDisposables } from './errorHandler';
import { allEnabledLanguages, allJSLanguages, getConfig } from './utils';
import configFileListener from './configCacheHandler';
import ignoreFileHandler from './ignoreFileHandler';

interface Selectors {
    rangeLanguageSelector: DocumentSelector;
    languageSelector: DocumentSelector;
}

let formatterHandler: undefined | Disposable;
let rangeFormatterHandler: undefined | Disposable;
function disposeHandlers() {
    if (formatterHandler) {
        formatterHandler.dispose();
    }
    if (rangeFormatterHandler) {
        rangeFormatterHandler.dispose();
    }
    formatterHandler = undefined;
    rangeFormatterHandler = undefined;
}

function selectorsCreator(wf: WorkspaceFolder) {
    const allLanguages = allEnabledLanguages();
    const allRangeLanguages = allJSLanguages();
    const { disableLanguages } = getConfig(wf.uri);
    const relativePattern = new RelativePattern(wf, '**');
    function docFilterForLangs(languages: string[]) {
        return languages.filter(l => !disableLanguages.includes(l)).map(
            l =>
                ({
                    language: l,
                    pattern: relativePattern,
                } as DocumentFilter)
        );
    }
    const languageSelector = docFilterForLangs(allLanguages);

    const rangeLanguageSelector = docFilterForLangs(allRangeLanguages);

    return { languageSelector, rangeLanguageSelector };
}

function selectors(): Selectors {
    const allLanguages = allEnabledLanguages();
    const allRangeLanguages = allJSLanguages();
    const { disableLanguages } = getConfig();
    const globalLanguageSelector = allLanguages.filter(
        l => !disableLanguages.includes(l)
    );
    const globalRangeLanguageSelector = allRangeLanguages.filter(
        l => !disableLanguages.includes(l)
    );
    if (workspace.workspaceFolders === undefined) {
        // no workspace opened
        return {
            languageSelector: globalLanguageSelector,
            rangeLanguageSelector: globalRangeLanguageSelector,
        };
    }

    // at least 1 workspace
    const untitledLanguageSelector: DocumentFilter[] = globalLanguageSelector.map(
        l => ({ language: l, scheme: 'untitled' })
    );
    const untitledRangeLanguageSelector: DocumentFilter[] = globalRangeLanguageSelector.map(
        l => ({ language: l, scheme: 'untitled' })
    );
    return workspace.workspaceFolders.reduce(
        (
            previous,
            workspaceFolder
        ) => {
            let { languageSelector, rangeLanguageSelector } = previous;
            const select = selectorsCreator(workspaceFolder);
            return {
                languageSelector: languageSelector.concat(
                    select.languageSelector
                ),
                rangeLanguageSelector: rangeLanguageSelector.concat(
                    select.rangeLanguageSelector
                ),
            };
        },
        {
            languageSelector: untitledLanguageSelector,
            rangeLanguageSelector: untitledRangeLanguageSelector,
        }
    );
}

export function activate(context: ExtensionContext) {
    const { fileIsIgnored } = ignoreFileHandler(context.subscriptions);
    const editProvider = new EditProvider(fileIsIgnored);
    function registerFormatter() {
        disposeHandlers();
        const { languageSelector, rangeLanguageSelector } = selectors();
        formatterHandler = languages.registerDocumentRangeFormattingEditProvider(
            rangeLanguageSelector,
            editProvider
        );
        rangeFormatterHandler = languages.registerDocumentFormattingEditProvider(
            languageSelector,
            editProvider
        );
    }
    registerFormatter();
    context.subscriptions.push(
        workspace.onDidChangeWorkspaceFolders(registerFormatter),
        {
            dispose: disposeHandlers,
        },
        setupErrorHandler(),
        configFileListener(),
        ...registerDisposables()
    );
}

// this method is called when your extension is deactivated
export function deactivate() {}
