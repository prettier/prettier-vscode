import { StatusBarAlignment, StatusBarItem, window } from "vscode";

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
    // Waiting for VS Code 1.53: https://github.com/microsoft/vscode/pull/116181
    // if (result === FormattingResult.Error) {
    //   this.statusBarItem.backgroundColor = new ThemeColor(
    //     "statusBarItem.errorBackground"
    //   );
    // } else {
    //   this.statusBarItem.backgroundColor = new ThemeColor(
    //     "statusBarItem.fourgroundBackground"
    //   );
    // }
    this.statusBarItem.show();
  }

  public hide() {
    this.statusBarItem.hide();
  }
}
