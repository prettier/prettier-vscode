import * as os from "os";
import * as path from "path";
// tslint:disable-next-line: no-implicit-dependencies
import { Uri, workspace } from "vscode";
import { PrettierVSCodeConfig } from "./types";

export function getWorkspaceRelativePath(
  filePath: string,
  pathToResolve: string
) {
  // In case the user wants to use ~/.prettierrc on Mac
  if (
    process.platform === "darwin" &&
    pathToResolve.indexOf("~") === 0 &&
    os.homedir()
  ) {
    return pathToResolve.replace(/^~(?=$|\/|\\)/, os.homedir());
  }

  if (workspace.workspaceFolders) {
    const folder = workspace.getWorkspaceFolder(Uri.file(filePath));
    return folder
      ? path.isAbsolute(pathToResolve)
        ? pathToResolve
        : path.join(folder.uri.fsPath, pathToResolve)
      : undefined;
  }
}

export function getConfig(uri?: Uri): PrettierVSCodeConfig {
  const rawConfig = workspace.getConfiguration("prettier", uri) as any;
  const config = { ...rawConfig };
  [
    "arrowParens",
    "bracketSpacing",
    "endOfLine",
    "htmlWhitespaceSensitivity",
    "insertPragma",
    "jsxBracketSameLine",
    "jsxSingleQuote",
    "printWidth",
    "proseWrap",
    "quoteProps",
    "requirePragma",
    "semi",
    "singleQuote",
    "tabWidth",
    "trailingComma",
    "useTabs",
    "vueIndentScriptAndStyle",
  ].forEach((key) => {
    if (config[key] === "default" || config[key] === null) {
      delete config[key];
    }
  });
  return config;
}
