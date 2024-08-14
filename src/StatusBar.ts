import {
  Disposable,
  DocumentSelector,
  languages,
  LanguageStatusItem,
  LanguageStatusSeverity,
  StatusBarAlignment,
  StatusBarItem,
  ThemeColor,
  window,
} from "vscode";

export enum FormatterStatus {
  Ready = "check-all",
  Success = "check",
  Ignore = "x",
  Warn = "warning",
  Error = "alert",
  Disabled = "circle-slash",
}

export class StatusBar implements Disposable {
  private statusBarItem: StatusBarItem;
  private languageStatusItem: LanguageStatusItem;
  constructor() {
    this.statusBarItem = window.createStatusBarItem(
      "prettier.status",
      StatusBarAlignment.Right,
      -1
    );
    this.languageStatusItem = languages.createLanguageStatusItem(
      "prettier.status",
      []
    );

    this.statusBarItem.name = "Prettier";
    this.statusBarItem.text = "Prettier";
    this.statusBarItem.command = "prettier.openOutput";
    this.update(FormatterStatus.Ready);
    this.statusBarItem.show();

    this.languageStatusItem.name = "Prettier";
    this.languageStatusItem.text = "Prettier";
    this.languageStatusItem.command = {
      title: "View Logs",
      command: "prettier.openOutput",
    };
  }

  public updateConfig({ selector }: { selector: DocumentSelector }) {
    this.languageStatusItem.selector = selector;
  }

  /**
   * Update the statusBarItem message and show the statusBarItem
   *
   * @param icon The the icon to use
   */
  public update(result: FormatterStatus): void {
    this.statusBarItem.text = `$(${result.toString()}) Prettier`;
    switch (result) {
      case FormatterStatus.Ignore:
      case FormatterStatus.Warn:
        this.statusBarItem.backgroundColor = new ThemeColor(
          "statusBarItem.warningBackground"
        );
        this.languageStatusItem.severity = LanguageStatusSeverity.Warning;
        break;
      case FormatterStatus.Error:
        this.statusBarItem.backgroundColor = new ThemeColor(
          "statusBarItem.errorBackground"
        );
        this.languageStatusItem.severity = LanguageStatusSeverity.Error;
        break;
      default:
        this.statusBarItem.backgroundColor = new ThemeColor(
          "statusBarItem.fourgroundBackground"
        );
        this.languageStatusItem.severity = LanguageStatusSeverity.Information;
        break;
    }
    this.statusBarItem.show();
  }

  public hide() {
    this.statusBarItem.hide();
  }

  public dispose(): void {
    this.languageStatusItem.dispose();
    this.statusBarItem.dispose();
  }
}
