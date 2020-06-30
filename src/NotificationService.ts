import {
  window,
  // tslint:disable-next-line: no-implicit-dependencies
} from "vscode";
import { LoggingService } from "./LoggingService";
import {
  OUTDATED_PRETTIER_VERSION_MESSAGE,
  VIEW_LOGS_ACTION_TEXT,
} from "./message";

export class NotificationService {
  constructor(private loggingService: LoggingService) {}

  public warnOutdatedPrettierVersion(prettierPath?: string) {
    window.showErrorMessage(
      OUTDATED_PRETTIER_VERSION_MESSAGE.replace(
        "{{path}}",
        prettierPath || "unknown"
      )
    );
  }

  public async showErrorMessage(message: string, extraLines?: string[]) {
    let result: string | undefined;
    if (extraLines) {
      const lines = [message];
      lines.push(...extraLines);
      result = await window.showErrorMessage(
        lines.join(" "),
        VIEW_LOGS_ACTION_TEXT
      );
    } else {
      result = await window.showErrorMessage(message, VIEW_LOGS_ACTION_TEXT);
    }
    if (result && result === VIEW_LOGS_ACTION_TEXT) {
      this.loggingService.show();
    }
  }
}
