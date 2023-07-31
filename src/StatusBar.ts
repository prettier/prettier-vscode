import { StatusBarAlignment, StatusBarItem, window, ThemeColor } from "vscode";

export enum FormatterStatus {
  Ready = "check-all",
  Success = "check",
  Ignore = "x",
  Warn = "warning",
  Error = "alert",
  Disabled = "circle-slash",
}

export class StatusBar {
  private statusBarItem: StatusBarItem;
  constructor() {
    // Setup the statusBarItem
    this.statusBarItem = window.createStatusBarItem(
      "prettier.status",
      StatusBarAlignment.Right,
      -1
    );
    this.statusBarItem.name = "Prettier";
    this.statusBarItem.text = "Prettier";
    this.statusBarItem.command = "prettier.openOutput";
    this.update(FormatterStatus.Ready);
    this.statusBarItem.show();
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
        break;
      case FormatterStatus.Error:
        this.statusBarItem.backgroundColor = new ThemeColor(
          "statusBarItem.errorBackground"
        );
        break;
      default:
        this.statusBarItem.backgroundColor = new ThemeColor(
          "statusBarItem.fourgroundBackground"
        );
        break;
    }
    this.statusBarItem.show();
  }

  public hide() {
    this.statusBarItem.hide();
  }
}
