import {
  Disposable,
  languages,
  StatusBarAlignment,
  StatusBarItem,
  TextEditor,
  window
  // tslint:disable-next-line: no-implicit-dependencies
} from "vscode";
import { LanguageResolver } from "./LanguageResolver";
import { PrettierVSCodeConfig } from "./types";
import { getConfig } from "./util";

export class StatusBarService {
  private statusBarItem: StatusBarItem;
  constructor(private languageResolver: LanguageResolver) {
    // Setup the statusBarItem
    this.statusBarItem = window.createStatusBarItem(
      StatusBarAlignment.Right,
      -1
    );
    this.statusBarItem.text = "Prettier";
    this.statusBarItem.command = "prettier.open-output";

    this.toggleStatusBarItem(window.activeTextEditor);
  }
  public registerDisposables(): Disposable[] {
    return [
      // Keep track whether to show/hide the statusbar
      window.onDidChangeActiveTextEditor(editor => {
        this.toggleStatusBarItem(editor);
      })
    ];
  }

  /**
   * Update the statusBarItem message and show the statusBarItem
   *
   * @param message The message to put inside the statusBarItem
   */
  public updateStatusBar(success: boolean): void {
    const message = success ? "Prettier: $(check)" : "Prettier: $(x)";
    this.statusBarItem.text = message;
    this.statusBarItem.show();
  }

  private toggleStatusBarItem(editor: TextEditor | undefined): void {
    if (editor !== undefined) {
      // The function will be triggered everytime the active "editor" instance changes
      // It also triggers when we focus on the output panel or on the debug panel
      // Both are seen as an "editor".
      // The following check will ignore such panels
      if (
        ["debug", "output"].some(part => editor.document.uri.scheme === part)
      ) {
        return;
      }

      const filePath = editor.document.isUntitled
        ? undefined
        : editor.document.fileName;
      const score = languages.match(
        this.languageResolver.allEnabledLanguages(filePath),
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
  }
}
