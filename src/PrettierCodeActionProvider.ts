import {
  CancellationToken,
  CodeAction,
  CodeActionContext,
  CodeActionKind,
  CodeActionProvider,
  Range,
  TextDocument,
  WorkspaceEdit,
} from "vscode";
import { PrettierEditProvider } from "./PrettierEditProvider";

export class PrettierCodeActionProvider implements CodeActionProvider {
  public static readonly providedCodeActionKinds = [
    CodeActionKind.SourceFixAll.append("prettier"),
  ];

  constructor(private readonly editProvider: PrettierEditProvider) {}

  public async provideCodeActions(
    document: TextDocument,
    range: Range,
    context: CodeActionContext,
    token: CancellationToken,
  ): Promise<CodeAction[]> {
    // Source actions (like source.fixAll) should always format the entire document,
    // not just a range, so we ignore the range parameter.
    // Only provide code actions when explicitly requested
    // This prevents them from showing up in the light bulb menu unless
    // the user has configured codeActionsOnSave
    if (
      context.only &&
      !PrettierCodeActionProvider.providedCodeActionKinds.some((kind) =>
        context.only?.contains(kind),
      )
    ) {
      return [];
    }

    const action = new CodeAction(
      "Format Document with Prettier",
      PrettierCodeActionProvider.providedCodeActionKinds[0],
    );

    // Note: FormattingOptions parameters (tabSize, insertSpaces) are not used
    // by the Prettier formatting logic as it reads these from .prettierrc or
    // VS Code settings. We pass dummy values here as they are required by the API.
    const edits = await this.editProvider.provideDocumentFormattingEdits(
      document,
      {
        tabSize: 2,
        insertSpaces: true,
      },
      token,
    );

    if (!edits || edits.length === 0) {
      return [];
    }

    const workspaceEdit = new WorkspaceEdit();
    edits.forEach((edit) => {
      workspaceEdit.replace(document.uri, edit.range, edit.newText);
    });

    action.edit = workspaceEdit;

    return [action];
  }
}
