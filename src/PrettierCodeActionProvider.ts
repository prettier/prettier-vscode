import {
  CancellationToken,
  CodeAction,
  CodeActionContext,
  CodeActionKind,
  CodeActionProvider,
  Range,
  TextDocument,
  TextEdit,
  WorkspaceEdit,
} from "vscode";
import { ExtensionFormattingOptions } from "./types.js";

/**
 * Provides code actions for formatting with Prettier.
 * This enables using Prettier with codeActionsOnSave.
 */
export class PrettierCodeActionProvider implements CodeActionProvider {
  public static readonly providedCodeActionKinds = [
    CodeActionKind.SourceFixAll.append("prettier"),
  ];

  constructor(
    private provideEdits: (
      document: TextDocument,
      options: ExtensionFormattingOptions,
    ) => Promise<TextEdit[]>,
  ) {}

  public async provideCodeActions(
    document: TextDocument,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    range: Range,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context: CodeActionContext,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    token: CancellationToken,
  ): Promise<CodeAction[]> {
    const edits = await this.provideEdits(document, {
      force: false,
    });

    if (edits.length === 0) {
      return [];
    }

    const action = new CodeAction(
      "Format with Prettier",
      CodeActionKind.SourceFixAll.append("prettier"),
    );
    const workspaceEdit = new WorkspaceEdit();
    workspaceEdit.set(document.uri, edits);
    action.edit = workspaceEdit;

    return [action];
  }
}
