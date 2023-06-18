import {
  CancellationToken,
  CodeAction,
  CodeActionContext,
  CodeActionKind,
  CodeActionProvider,
  Command,
  ProviderResult,
  Range,
  Selection,
  TextDocument,
  WorkspaceEdit,
} from "vscode";
import { ProvideEdits } from "./interfaces";
import { LoggingService } from "./LoggingService";

export class PrettierFormatDocumentAction implements CodeActionProvider {
  public static readonly providedCodeActionKinds = [
    CodeActionKind.Source.append("format.prettier"),
  ];

  constructor(
    private provideEdits: ProvideEdits,
    private loggingService: LoggingService
  ) {}

  provideCodeActions(
    document: TextDocument,
    range: Range | Selection,
    context: CodeActionContext,
    token: CancellationToken
  ): ProviderResult<(CodeAction | Command)[]> {
    this.loggingService.logDebug("Formatting with code action");
    return this.provideEdits(document, {
      force: false,
    }).then((edit) => {
      const workspaceEdit = new WorkspaceEdit();
      workspaceEdit.replace(document.uri, edit[0].range, edit[0].newText);
      const action = new CodeAction("Format Document", CodeActionKind.Source);
      action.edit = workspaceEdit;
      return [action];
    });
  }
}

export class PrettierFormatRangeAction implements CodeActionProvider {
  public static readonly providedCodeActionKinds = [
    CodeActionKind.Source.append("formatChanged.prettier"),
  ];

  constructor(
    private provideEdits: ProvideEdits,
    private loggingService: LoggingService
  ) {}

  provideCodeActions(
    document: TextDocument,
    range: Range | Selection,
    context: CodeActionContext,
    token: CancellationToken
  ): ProviderResult<(CodeAction | Command)[]> {
    this.loggingService.logDebug("Formatting with ranged code action");
    return this.provideEdits(document, {
      rangeEnd: document.offsetAt(range.end),
      rangeStart: document.offsetAt(range.start),
      force: false,
    }).then((edit) => {
      const action = new CodeAction("Format Changes", CodeActionKind.Source);
      action.edit = new WorkspaceEdit();
      action.edit.set(document.uri, edit);
      return [action];
    });
  }
}
