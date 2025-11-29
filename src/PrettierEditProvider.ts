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
  implements DocumentRangeFormattingEditProvider, DocumentFormattingEditProvider
{
  constructor(
    private provideEdits: (
      document: TextDocument,
      options: ExtensionFormattingOptions,
      token?: CancellationToken,
    ) => Promise<TextEdit[]>,
  ) {}

  public async provideDocumentRangeFormattingEdits(
    document: TextDocument,
    range: Range,

    options: FormattingOptions,
    token: CancellationToken,
  ): Promise<TextEdit[]> {
    return this.provideEdits(
      document,
      {
        rangeEnd: document.offsetAt(range.end),
        rangeStart: document.offsetAt(range.start),
        force: false,
      },
      token,
    );
  }

  public async provideDocumentFormattingEdits(
    document: TextDocument,

    options: FormattingOptions,
    token: CancellationToken,
  ): Promise<TextEdit[]> {
    return this.provideEdits(
      document,
      {
        force: false,
      },
      token,
    );
  }
}
