// tslint:disable-next-line: no-implicit-dependencies
import { Uri, workspace } from "vscode";
import { PrettierVSCodeConfig } from "./types";

export class ConfigResolver {}

export function getConfig(uri?: Uri): PrettierVSCodeConfig {
  return workspace.getConfiguration("prettier", uri) as any;
}
