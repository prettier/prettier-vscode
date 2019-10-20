import * as path from "path";
// tslint:disable-next-line: no-implicit-dependencies
import { Uri, workspace } from "vscode";
import { getConfig } from "./ConfigResolver";

export class IgnorerResolver {
  public getIgnorePath(fsPath: string): string | undefined {
    const absolutePath = this.getIgnorePathForFile(
      fsPath,
      getConfig(Uri.file(fsPath)).ignorePath
    );
    return absolutePath;
  }

  private getIgnorePathForFile(
    filePath: string,
    ignorePath: string
  ): string | undefined {
    // Configuration `prettier.ignorePath` is set to `null`
    if (!ignorePath) {
      return;
    }
    if (workspace.workspaceFolders) {
      const folder = workspace.getWorkspaceFolder(Uri.file(filePath));
      return folder ? getPath(ignorePath, folder.uri.fsPath) : undefined;
    }

    return;
  }
}

function getPath(fsPath: string, relativeTo: string) {
  return path.isAbsolute(fsPath) ? fsPath : path.join(relativeTo, fsPath);
}
