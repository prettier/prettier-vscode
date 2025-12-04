import * as fs from "fs";
import * as path from "path";
import { commands, Uri, window, workspace } from "vscode";
import { pathExists } from "./utils/find-up.js";

/**
 * Service for showing user-facing notifications for fatal errors
 */
export class NotificationService {
  // Track which errors we've already shown to avoid spam
  private shownErrors = new Set<string>();

  /**
   * Check if prettier is listed in package.json dependencies
   */
  private async isPrettierInPackageJson(
    fileName: string,
  ): Promise<boolean | undefined> {
    try {
      const workspaceFolder = workspace.getWorkspaceFolder(Uri.file(fileName));
      if (!workspaceFolder) {
        return undefined;
      }

      const packageJsonPath = path.join(
        workspaceFolder.uri.fsPath,
        "package.json",
      );

      if (!(await pathExists(packageJsonPath))) {
        return undefined;
      }

      const content = await fs.promises.readFile(packageJsonPath, "utf8");
      const packageJson = JSON.parse(content);

      return !!(
        packageJson.dependencies?.prettier ||
        packageJson.devDependencies?.prettier ||
        packageJson.peerDependencies?.prettier
      );
    } catch {
      return undefined;
    }
  }

  /**
   * Helper to show an error message with optional action buttons
   */
  private async showErrorWithActions(
    message: string,
    ...actions: string[]
  ): Promise<string | undefined> {
    return window.showErrorMessage(message, ...actions);
  }

  /**
   * Show error notification when prettier module cannot be loaded
   */
  public async showPrettierLoadFailedError(fileName: string): Promise<void> {
    const errorKey = `load-failed:${fileName}`;
    if (this.shownErrors.has(errorKey)) {
      return;
    }
    this.shownErrors.add(errorKey);

    const isInPackageJson = await this.isPrettierInPackageJson(fileName);

    const message = isInPackageJson
      ? "Prettier: Failed to load module. Prettier is listed in package.json but could not be loaded. Please run npm install (or yarn/pnpm install)."
      : "Prettier: Failed to load module. See output for more details.";

    const selection = await this.showErrorWithActions(
      message,
      "View Output",
      "Dismiss",
    );

    if (selection === "View Output") {
      void commands.executeCommand("prettier.openOutput");
    }
  }

  /**
   * Show error notification for invalid prettier path configuration
   */
  public async showInvalidPrettierPathError(): Promise<void> {
    const errorKey = "invalid-prettier-path";
    if (this.shownErrors.has(errorKey)) {
      return;
    }
    this.shownErrors.add(errorKey);

    const selection = await this.showErrorWithActions(
      "Prettier: The 'prettierPath' setting does not reference a valid Prettier installation. Please check your settings.",
      "Open Settings",
      "View Output",
      "Dismiss",
    );

    if (selection === "Open Settings") {
      void commands.executeCommand(
        "workbench.action.openSettings",
        "prettier.prettierPath",
      );
    } else if (selection === "View Output") {
      void commands.executeCommand("prettier.openOutput");
    }
  }

  /**
   * Show error notification for invalid prettier configuration file
   */
  public async showInvalidConfigError(): Promise<void> {
    const errorKey = "invalid-config";
    if (this.shownErrors.has(errorKey)) {
      return;
    }
    this.shownErrors.add(errorKey);

    const selection = await this.showErrorWithActions(
      "Prettier: Invalid configuration file detected. Please check your Prettier config files (.prettierrc, prettier.config.js, etc.).",
      "View Output",
      "Dismiss",
    );

    if (selection === "View Output") {
      void commands.executeCommand("prettier.openOutput");
    }
  }

  /**
   * Show error notification for config resolution failures
   */
  public async showConfigResolutionError(): Promise<void> {
    const errorKey = "config-resolution";
    if (this.shownErrors.has(errorKey)) {
      return;
    }
    this.shownErrors.add(errorKey);

    const selection = await this.showErrorWithActions(
      "Prettier: Failed to resolve configuration file. See output for details.",
      "View Output",
      "Dismiss",
    );

    if (selection === "View Output") {
      void commands.executeCommand("prettier.openOutput");
    }
  }

  /**
   * Reset notification tracking (useful for testing or when configuration changes)
   */
  public reset(): void {
    this.shownErrors.clear();
  }
}
