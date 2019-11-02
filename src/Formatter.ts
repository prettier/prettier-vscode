import {
  Disposable,
  DocumentFilter,
  DocumentSelector,
  languages,
  workspace
  // tslint:disable-next-line: no-implicit-dependencies
} from "vscode";
import { LanguageResolver } from "./LanguageResolver";
import { LoggingService } from "./LoggingService";
import { ModuleResolver } from "./ModuleResolver";
import EditProvider from "./PrettierEditProvider";
import { getConfig } from "./util";

interface ISelectors {
  rangeLanguageSelector: DocumentSelector;
  languageSelector: DocumentSelector;
}

export class Formatter implements Disposable {
  private formatterHandler: undefined | Disposable;
  private rangeFormatterHandler: undefined | Disposable;

  constructor(
    private moduleResolver: ModuleResolver,
    private editProvider: EditProvider,
    private loggingService: LoggingService
  ) {}

  public registerFormatter = () => {
    this.dispose();
    const { languageSelector, rangeLanguageSelector } = this.selectors(
      this.moduleResolver,
      this.loggingService
    );
    this.rangeFormatterHandler = languages.registerDocumentRangeFormattingEditProvider(
      rangeLanguageSelector,
      this.editProvider
    );
    this.formatterHandler = languages.registerDocumentFormattingEditProvider(
      languageSelector,
      this.editProvider
    );
  };

  public dispose = () => {
    // Clear the module cache in order to reload if there was a change in package.json, etc.
    this.moduleResolver.clearModuleCache();
    if (this.formatterHandler) {
      this.formatterHandler.dispose();
    }
    if (this.rangeFormatterHandler) {
      this.rangeFormatterHandler.dispose();
    }
    this.formatterHandler = undefined;
    this.rangeFormatterHandler = undefined;
  };

  /**
   * Build formatter selectors
   */
  private selectors = (
    moduleResolver: ModuleResolver,
    loggingService: LoggingService
  ): ISelectors => {
    const { disableLanguages, prettierPath } = getConfig();

    let allLanguages: string[];
    const bundledPrettierInstance = this.moduleResolver.getPrettierInstance(
      prettierPath
    );
    const bundledLanguageResolver = new LanguageResolver(
      bundledPrettierInstance
    );
    if (workspace.workspaceFolders === undefined) {
      allLanguages = bundledLanguageResolver.allEnabledLanguages();
    } else {
      allLanguages = [];
      for (const folder of workspace.workspaceFolders) {
        const prettierInstance = moduleResolver.getPrettierInstance(
          prettierPath,
          folder.uri.fsPath
        );
        const languageResolver = new LanguageResolver(prettierInstance);
        const allWorkspaceLanguages = languageResolver.allEnabledLanguages();
        allLanguages.push(...allWorkspaceLanguages);
      }
    }

    loggingService.appendLine("Enabling prettier for languages:", "INFO");
    loggingService.appendObject(allLanguages);

    const allRangeLanguages = bundledLanguageResolver.rangeSupportedLanguages();
    loggingService.appendLine(
      "Enabling prettier for range supported languages:",
      "INFO"
    );
    loggingService.appendObject(allRangeLanguages);

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
        rangeLanguageSelector: globalRangeLanguageSelector
      };
    }

    // at least 1 workspace
    const untitledLanguageSelector: DocumentFilter[] = globalLanguageSelector.map(
      l => ({ language: l, scheme: "untitled" })
    );
    const untitledRangeLanguageSelector: DocumentFilter[] = globalRangeLanguageSelector.map(
      l => ({ language: l, scheme: "untitled" })
    );
    const fileLanguageSelector: DocumentFilter[] = globalLanguageSelector.map(
      l => ({ language: l, scheme: "file" })
    );
    const fileRangeLanguageSelector: DocumentFilter[] = globalRangeLanguageSelector.map(
      l => ({ language: l, scheme: "file" })
    );
    return {
      languageSelector: untitledLanguageSelector.concat(fileLanguageSelector),
      rangeLanguageSelector: untitledRangeLanguageSelector.concat(
        fileRangeLanguageSelector
      )
    };
  };
}
