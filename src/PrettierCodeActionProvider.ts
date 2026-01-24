import {
  CancellationToken,
  CodeAction,
  CodeActionContext,
  CodeActionKind,
  CodeActionProvider,
  Range,
  TextDocument,
  TextEdit,
  workspace,
  WorkspaceEdit,
} from "vscode";
import { ExtensionFormattingOptions } from "./types.js";

const EXTENSION_ID = "esbenp.prettier-vscode";

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

  /**
   * Check if the Prettier code action should run for this document.
   * Returns true if:
   * 1. source.fixAll.prettier is explicitly enabled in codeActionsOnSave, OR
   * 2. editor.defaultFormatter is NOT set to another extension
   *
   * This prevents Prettier from running via source.fixAll when the user has
   * explicitly chosen a different formatter (e.g., ESLint with Prettier plugin).
   * See: https://github.com/prettier/prettier-vscode/issues/3908
   */
  private shouldProvideCodeActions(document: TextDocument): boolean {
    // Use languageId scope to get language-specific settings (e.g., [javascript])
    const editorConfig = workspace.getConfiguration("editor", {
      uri: document.uri,
      languageId: document.languageId,
    });

    // Check if source.fixAll.prettier is explicitly enabled - if so, always provide actions
    const codeActionsOnSave = editorConfig.get<Record<string, string>>(
      "codeActionsOnSave",
      {},
    );
    const prettierFixAllSetting = codeActionsOnSave["source.fixAll.prettier"];
    if (
      prettierFixAllSetting === "always" ||
      prettierFixAllSetting === "explicit"
    ) {
      return true;
    }

    // Check if editor.defaultFormatter is explicitly set to another extension
    // If so, don't provide code actions (user chose a different formatter)
    const defaultFormatter = editorConfig.get<string>("defaultFormatter");
    if (defaultFormatter && defaultFormatter !== EXTENSION_ID) {
      return false;
    }

    // Default: provide code actions (either no formatter set, or Prettier is the formatter)
    return true;
  }

  public async provideCodeActions(
    document: TextDocument,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    range: Range,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context: CodeActionContext,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    token: CancellationToken,
  ): Promise<CodeAction[]> {
    // Only provide code actions if explicitly enabled or if Prettier is the default formatter
    if (!this.shouldProvideCodeActions(document)) {
      return [];
    }

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
