import {
  Disposable,
  languages,
  StatusBarAlignment,
  StatusBarItem,
  TextEditor,
  ThemeColor,
  window,
} from "vscode";
import { LanguageResolver } from "./LanguageResolver";
import { LoggingService } from "./LoggingService";
import { PrettierVSCodeConfig } from "./types";
import { getConfig } from "./util";

export enum FormattingResult {
  Success = "check",
  Ignore = "x",
  Error = "alert",
}

export class StatusBarService {
  private statusBarItem: StatusBarItem;
  constructor(
    private languageResolver: LanguageResolver,
    private loggingService: LoggingService
  ) {
    // Setup the statusBarItem
    this.statusBarItem = window.createStatusBarItem(
      StatusBarAlignment.Right,
      -1
    );
    this.statusBarItem.text = "Prettier";
    this.statusBarItem.command = "prettier.openOutput";

    this.toggleStatusBarItem(window.activeTextEditor);
  }
  public registerDisposables(): Disposable[] {
    return [
      // Keep track whether to show/hide the statusbar
      window.onDidChangeActiveTextEditor((editor) => {
        this.toggleStatusBarItem(editor);
      }),
    ];
  }

  /**
   * Update the statusBarItem message and show the statusBarItem
   *
   * @param icon The the icon to use
   */
  public updateStatusBar(result: FormattingResult): void {
    this.statusBarItem.text = `$(${result.toString()}) Prettier`;
    if (result == FormattingResult.Error) {
      this.statusBarItem.backgroundColor = new ThemeColor(
        "statusBarItem.errorBackground"
      );
    } else {
      this.statusBarItem.backgroundColor = undefined;
    }
    this.statusBarItem.show();
  }

  private async toggleStatusBarItem(
    editor: TextEditor | undefined
  ): Promise<void> {
    if (editor !== undefined) {
      // The function will be triggered every time the active "editor" instance changes
      // It also triggers when we focus on the output panel or on the debug panel
      // Both are seen as an "editor".
      // The following check will ignore such panels
      if (
        ["debug", "output"].some((part) => editor.document.uri.scheme === part)
      ) {
        return;
      }

      this.loggingService.setOutputLevel("NONE"); // No logs here, they are annoying.

      const filePath = editor.document.isUntitled
        ? undefined
        : editor.document.fileName;
      const score = languages.match(
        await this.languageResolver.getSupportedLanguages(filePath),
        editor.document
      );
      const disabledLanguages: PrettierVSCodeConfig["disableLanguages"] = getConfig(
        editor.document.uri
      ).disableLanguages;

      if (
        score > 0 &&
        !disabledLanguages.includes(editor.document.languageId)
      ) {
        this.statusBarItem.show();
      } else {
        this.statusBarItem.hide();
      }
    } else {
      this.statusBarItem.hide();
    }

    this.loggingService.setOutputLevel("INFO"); // Resume logging
  }
}
