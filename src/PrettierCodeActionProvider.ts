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
   * Check if Prettier is the default formatter for the given document.
   * This checks both the global and language-specific settings.
   */
  private isPrettierDefaultFormatter(document: TextDocument): boolean {
    const config = workspace.getConfiguration("editor", document.uri);
    
    // Check language-specific default formatter first (higher priority)
    const languageConfig = workspace.getConfiguration(
      `[${document.languageId}]`,
      document.uri,
    );
    const languageDefaultFormatter = languageConfig.get<string>(
      "editor.defaultFormatter",
    );
    
    if (languageDefaultFormatter !== undefined) {
      return languageDefaultFormatter === EXTENSION_ID;
    }
    
    // Check global default formatter
    const globalDefaultFormatter = config.get<string>("defaultFormatter");
    return globalDefaultFormatter === EXTENSION_ID;
  }

  public async provideCodeActions(
    document: TextDocument,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    range: Range,
    context: CodeActionContext,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    token: CancellationToken,
  ): Promise<CodeAction[]> {
    // Check if source.fixAll.prettier was explicitly requested
    const prettierCodeActionKind =
      CodeActionKind.SourceFixAll.append("prettier");
    const explicitlyRequested = context.only?.contains(prettierCodeActionKind);

    // Only provide code action if:
    // 1. It was explicitly requested (e.g., via "source.fixAll.prettier" in codeActionsOnSave), OR
    // 2. Prettier is the default formatter for this document
    //
    // This prevents Prettier from formatting when triggered by wildcard code actions
    // (e.g., "source.fixAll") if another formatter is configured as default.
    if (!explicitlyRequested && !this.isPrettierDefaultFormatter(document)) {
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
      prettierCodeActionKind,
    );
    const workspaceEdit = new WorkspaceEdit();
    workspaceEdit.set(document.uri, edits);
    action.edit = workspaceEdit;

    return [action];
  }
}
