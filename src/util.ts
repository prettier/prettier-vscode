import * as os from "os";
import * as path from "path";
import * as semver from "semver";
import { Uri, workspace, type TextDocument } from "vscode";
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

export function getConfig(scope?: TextDocument | Uri): PrettierVSCodeConfig {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const config = workspace.getConfiguration(
    "prettier",
    scope
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

export function isAboveV3(version: string | null): boolean {
  const parsedVersion = semver.parse(version);
  if (!parsedVersion) {
    throw new Error("Invalid version");
  }
  return parsedVersion.major >= 3;
}
