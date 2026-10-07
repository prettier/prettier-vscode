import { window } from "vscode";

type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR" | "NONE";

// The VS Code Output panel does not interpret ANSI escape sequences, so strip
// them to keep the log readable (e.g. Prettier's colorized code frames).
// See https://github.com/prettier/prettier-vscode/issues/4002
const ansiEscapeSequence =
  // eslint-disable-next-line no-control-regex
  /[\x1b\x9b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;

function stripAnsiCodes(text: string): string {
  return text.replace(ansiEscapeSequence, "");
}

export class LoggingService {
  private outputChannel = window.createOutputChannel("Prettier");

  private logLevel: LogLevel = "INFO";

  public setOutputLevel(logLevel: LogLevel) {
    this.logLevel = logLevel;
  }

  /**
   * Append messages to the output channel and format it with a title
   *
   * @param message The message to append to the output channel
   */
  public logDebug(message: string, data?: unknown): void {
    if (
      this.logLevel === "NONE" ||
      this.logLevel === "INFO" ||
      this.logLevel === "WARN" ||
      this.logLevel === "ERROR"
    ) {
      return;
    }
    this.logMessage(message, "DEBUG");
    if (data) {
      this.logObject(data);
    }
  }

  /**
   * Append messages to the output channel and format it with a title
   *
   * @param message The message to append to the output channel
   */
  public logInfo(message: string, data?: unknown): void {
    if (
      this.logLevel === "NONE" ||
      this.logLevel === "WARN" ||
      this.logLevel === "ERROR"
    ) {
      return;
    }
    this.logMessage(message, "INFO");
    if (data) {
      this.logObject(data);
    }
  }

  /**
   * Append messages to the output channel and format it with a title
   *
   * @param message The message to append to the output channel
   */
  public logWarning(message: string, data?: unknown): void {
    if (this.logLevel === "NONE" || this.logLevel === "ERROR") {
      return;
    }
    this.logMessage(message, "WARN");
    if (data) {
      this.logObject(data);
    }
  }

  public logError(message: string, error?: unknown) {
    if (this.logLevel === "NONE") {
      return;
    }
    this.logMessage(message, "ERROR");
    if (typeof error === "string") {
      // Errors as a string usually only happen with
      // plugins that don't return the expected error.
      this.appendLine(error);
    } else if (error instanceof Error) {
      if (error?.message) {
        this.logMessage(error.message, "ERROR");
      }
      if (error?.stack) {
        this.appendLine(error.stack);
      }
    } else if (error) {
      this.logObject(error);
    }
  }

  public show() {
    this.outputChannel.show();
  }

  /**
   * Append a line to the output channel, stripping ANSI escape sequences
   * that the Output panel cannot render.
   */
  private appendLine(message: string): void {
    this.outputChannel.appendLine(stripAnsiCodes(message));
  }

  private logObject(data: unknown): void {
    // const message = JSON.parser
    //   .format(JSON.stringify(data, null, 2), {
    //     parser: "json",
    //   })
    //   .trim();
    const message = JSON.stringify(data, null, 2); // dont use prettier to keep it simple

    this.appendLine(message);
  }

  /**
   * Append messages to the output channel and format it with a title
   *
   * @param message The message to append to the output channel
   */
  private logMessage(message: string, logLevel: LogLevel): void {
    const title = new Date().toLocaleTimeString();
    this.appendLine(`["${logLevel}" - ${title}] ${message}`);
  }
}
