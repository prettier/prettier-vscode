import * as prettier from "prettier";
// tslint:disable-next-line: no-implicit-dependencies
import { window } from "vscode";

export class LoggingService {
  private outputChannel = window.createOutputChannel("Prettier");
  /**
   * Append messages to the output channel and format it with a title
   *
   * @param message The message to append to the output channel
   */
  public appendLine(message: string, level: "INFO" | "WARN" | "ERROR"): void {
    const title = new Date().toLocaleTimeString();
    this.outputChannel.appendLine(`[${level} - ${title}] ${message}`);
  }

  public appendObject(obj: object): void {
    const message = prettier.format(JSON.stringify(obj, null, 2), {
      parser: "json"
    });
    this.outputChannel.appendLine(message);
  }

  public logError(err: Error, fileName: string) {
    this.appendLine(err.name, "ERROR");
    if (fileName) {
      this.outputChannel.appendLine(fileName);
    }
    this.outputChannel.appendLine(err.message);
  }
}
