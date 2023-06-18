import { TextDocument, TextEdit } from "vscode";
import { ExtensionFormattingOptions } from "./types";

export interface ProvideEdits {
  (document: TextDocument, options: ExtensionFormattingOptions): Promise<
    TextEdit[]
  >;
}
