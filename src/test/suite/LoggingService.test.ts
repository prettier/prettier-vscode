import * as assert from "assert";
import * as vscode from "vscode";

import { LoggingService } from "../../LoggingService.js";

describe("LoggingService ANSI stripping", () => {
  let lines: string[];
  let originalCreateOutputChannel: typeof vscode.window.createOutputChannel;

  beforeEach(() => {
    lines = [];
    originalCreateOutputChannel = vscode.window.createOutputChannel;
    (vscode.window as unknown as Record<string, unknown>).createOutputChannel =
      () => ({
        appendLine: (line: string) => lines.push(line),
        show: () => undefined,
        dispose: () => undefined,
      });
  });

  afterEach(() => {
    (vscode.window as unknown as Record<string, unknown>).createOutputChannel =
      originalCreateOutputChannel;
  });

  it("strips ANSI escape codes from error output", () => {
    const service = new LoggingService();
    // Sample taken from https://github.com/prettier/prettier-vscode/issues/4002
    const error = new Error(
      'Opening tag "liPunto" not terminated. (23:11)\n' +
        "\u001b[0m \u001b[90m 21 |\u001b[39m            \u001b[33m<\u001b[39m\u001b[33mli\u001b[39m\u001b[33m>\u001b[39mPunto 1",
    );
    error.stack =
      "\u001b[31m\u001b[1m>\u001b[22m\u001b[39m\u001b[90m 23 |\u001b[39m            \u001b[33m<\u001b[39m\u001b[33mliPunto\u001b[39m \u001b[37m\u001b[41m\u001b[1m2\u001b[22m\u001b[49m\u001b[39m";
    service.logError("Format failed", error);

    assert.ok(lines.length > 0, "expected output lines");
    for (const line of lines) {
      assert.ok(
        !line.includes("\u001b"),
        `line still contains ANSI escapes: ${JSON.stringify(line)}`,
      );
    }
    assert.ok(
      lines.some((line) =>
        line.includes('Opening tag "liPunto" not terminated'),
      ),
      "error message text preserved",
    );
    assert.ok(
      lines.some((line) => line.includes("liPunto")),
      "code frame text preserved",
    );
  });

  it("leaves plain text untouched", () => {
    const service = new LoggingService();
    service.setOutputLevel("DEBUG");
    service.logDebug("plain message, no escapes");
    assert.ok(lines.some((line) => line.includes("plain message, no escapes")));
  });
});
