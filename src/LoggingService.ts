import * as prettier from "prettier";
// tslint:disable-next-line: no-implicit-dependencies
import { window } from "vscode";

type LogLevel = "INFO" | "WARN" | "ERROR";

export class LoggingService {
  private outputChannel = window.createOutputChannel("Prettier");

  /**
   * Append messages to the output channel and format it with a title
   *
   * @param message The message to append to the output channel
   */
  public logMessage(message: string, level: LogLevel): void {
    const title = new Date().toLocaleTimeString();
    this.outputChannel.appendLine(`[${level} - ${title}] ${message}`);
  }

  public logObject(obj: object, level: LogLevel): void {
    const message = prettier
      .format(JSON.stringify(obj, null, 2), {
        parser: "json"
      })
      .trim();
    this.outputChannel.appendLine(message);
  }

  public logError(error: Error) {
    this.logMessage(error.name, "ERROR");
    this.outputChannel.appendLine(error.message);
    if (error.stack) {
      this.outputChannel.appendLine(error.stack);
    }
  }
}
