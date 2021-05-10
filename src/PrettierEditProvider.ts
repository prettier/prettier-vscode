import {
  CancellationToken,
  DocumentFormattingEditProvider,
  DocumentRangeFormattingEditProvider,
  FormattingOptions,
  Range,
  TextDocument,
  TextEdit,
} from "vscode";
import { ExtensionFormattingOptions } from "./types";

export class PrettierEditProvider
  implements
    DocumentRangeFormattingEditProvider,
    DocumentFormattingEditProvider
{
  constructor(
    private provideEdits: (
      document: TextDocument,
      options: ExtensionFormattingOptions
    ) => Promise<TextEdit[]>
  ) {}

  public async provideDocumentRangeFormattingEdits(
    document: TextDocument,
    range: Range,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    options: FormattingOptions,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    token: CancellationToken
  ): Promise<TextEdit[]> {
    return this.provideEdits(document, {
      rangeEnd: document.offsetAt(range.end),
      rangeStart: document.offsetAt(range.start),
      force: false,
    });
  }

  public async provideDocumentFormattingEdits(
    document: TextDocument,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    options: FormattingOptions,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    token: CancellationToken
  ): Promise<TextEdit[]> {
    return this.provideEdits(document, {
      force: false,
    });
  }
}
