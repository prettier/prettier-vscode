import {
  CancellationToken,
  FormattingOptions,
  OnTypeFormattingEditProvider,
  Position,
  TextDocument,
  TextEdit,
} from "vscode";
import { ExtensionFormattingOptions } from "./types.js";

export class PrettierOnTypeFormattingEditProvider
  implements OnTypeFormattingEditProvider
{
  constructor(
    private provideEdits: (
      document: TextDocument,
      options: ExtensionFormattingOptions,
    ) => Promise<TextEdit[]>,
  ) {}

  public async provideOnTypeFormattingEdits(
    document: TextDocument,
    position: Position,
    ch: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    options: FormattingOptions,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    token: CancellationToken,
  ): Promise<TextEdit[]> {
    // Get the line where the trigger character was typed
    const line = document.lineAt(position.line);
    const lineText = line.text;

    // Only format if the trigger character was typed at the end of meaningful content
    // (not in the middle of a line being edited)
    const textBeforeCursor = lineText.substring(0, position.character);
    const textAfterCursor = lineText.substring(position.character);

    // If there's non-whitespace content after the cursor, don't format
    // This prevents formatting while the user is still typing in the middle of a line
    if (textAfterCursor.trim().length > 0) {
      return [];
    }

    // Verify the trigger character is present at or near the cursor
    if (!textBeforeCursor.includes(ch)) {
      return [];
    }

    // For on-type formatting, format the entire document
    // This ensures consistent formatting and matches user expectations
    // Prettier doesn't support formatting single lines in isolation
    return this.provideEdits(document, {
      force: false,
    });
  }
}
