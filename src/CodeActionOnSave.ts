import {
  CodeAction,
  CodeActionKind,
  type CodeActionProvider,
  type ProviderResult,
} from "vscode";

const FORCE_FORMAT_DOCUMENT_COMMAND = "prettier.forceFormatDocument";
const FORCE_FORMAT_DOCUMENT_CODE_ACTION_KIND = CodeActionKind.Source.append(
  FORCE_FORMAT_DOCUMENT_COMMAND
);
const FORCE_FORMAT_DOCUMENT_TITLE = "Format Document (Forced)";

export default class CodeActionOnSave implements CodeActionProvider {
  public static readonly providedCodeActionKinds = [
    FORCE_FORMAT_DOCUMENT_CODE_ACTION_KIND,
  ];

  public provideCodeActions(): ProviderResult<CodeAction[]> {
    const forceFormatDocumentAction = this.createForceFormatDocumentAction();
    return [forceFormatDocumentAction];
  }

  private createForceFormatDocumentAction(): CodeAction {
    const action = new CodeAction(
      FORCE_FORMAT_DOCUMENT_TITLE,
      FORCE_FORMAT_DOCUMENT_CODE_ACTION_KIND
    );
    action.command = {
      command: FORCE_FORMAT_DOCUMENT_COMMAND,
      title: FORCE_FORMAT_DOCUMENT_TITLE,
    };
    return action;
  }
}
