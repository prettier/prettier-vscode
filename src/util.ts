import * as os from "os";
import * as path from "path";
import { Uri, workspace } from "vscode";
import { PrettierVSCodeConfig, PrettierOptions } from "./types";

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const config = workspace.getConfiguration(
    "prettier",
    uri
  ) as unknown as PrettierVSCodeConfig;

  // Some settings are disabled for untrusted workspaces
  // because they can be used for bad things.
  if (!workspace.isTrusted) {
    const newConfig = {
      ...config,
      prettierPath: undefined,
      configPath: undefined,
      ignorePath: ".prettierignore",
      documentSelectors: [],
      useEditorConfig: false,
      withNodeModules: false,
      resolveGlobalModules: false,
    };
    return newConfig;
  }

  return config;
}

export function filterFormattingOptions(
  vsCodeConfig: PrettierOptions
): PrettierOptions {
  const formattingOptions: PrettierOptions = {
    arrowParens: vsCodeConfig.arrowParens,
    bracketSpacing: vsCodeConfig.bracketSpacing,
    endOfLine: vsCodeConfig.endOfLine,
    htmlWhitespaceSensitivity: vsCodeConfig.htmlWhitespaceSensitivity,
    insertPragma: vsCodeConfig.insertPragma,
    jsxBracketSameLine: vsCodeConfig.jsxBracketSameLine,
    jsxSingleQuote: vsCodeConfig.jsxSingleQuote,
    printWidth: vsCodeConfig.printWidth,
    proseWrap: vsCodeConfig.proseWrap,
    quoteProps: vsCodeConfig.quoteProps,
    requirePragma: vsCodeConfig.requirePragma,
    semi: vsCodeConfig.semi,
    singleQuote: vsCodeConfig.singleQuote,
    tabWidth: vsCodeConfig.tabWidth,
    trailingComma: vsCodeConfig.trailingComma,
    useTabs: vsCodeConfig.useTabs,
    vueIndentScriptAndStyle: vsCodeConfig.vueIndentScriptAndStyle,
  };

  return formattingOptions;
}
