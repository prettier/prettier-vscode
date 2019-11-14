import {
  ConfigurationTarget,
  Disposable,
  Uri,
  window,
  workspace,
  WorkspaceConfiguration
  // tslint:disable-next-line: no-implicit-dependencies
} from "vscode";
import TelemetryReporter from "vscode-extension-telemetry";
import * as nls from "vscode-nls";
import { LoggingService } from "./LoggingService";
import {
  LEGACY_VSCODE_LINTER_CONFIG_MESSAGE,
  OUTDATED_PRETTIER_VERSION_MESSAGE,
  REMOVE_LEGACY_OPTIONS_ACTION_TEXT,
  VIEW_LOGS_ACTION_TEXT
} from "./message";

const LEGACY_LINTER_OPTIONS = [
  "eslintIntegration",
  "tslintIntegration",
  "stylelintIntegration"
];

const localize = nls.loadMessageBundle();

export class NotificationService implements Disposable {
  private noLegacyConfigWorkspaces: string[] = [];

  constructor(
    private telemetryReporter: TelemetryReporter,
    private loggingService: LoggingService
  ) {}

  public warnOutdatedPrettierVersion(prettierPath?: string) {
    const message = localize(
      "ext.message.outdatedPrettierVersion",
      OUTDATED_PRETTIER_VERSION_MESSAGE
    ).replace("{{path}}", prettierPath || "unknown");
    window.showErrorMessage(message);
  }

  public async warnIfLegacyConfiguration(uri: Uri) {
    const workspaceFolder = workspace.getWorkspaceFolder(uri);
    const cacheKey = workspaceFolder ? workspaceFolder.uri.fsPath : uri.fsPath;
    if (this.noLegacyConfigWorkspaces.indexOf(cacheKey) > -1) {
      return;
    }
    const vscodeConfig = workspace.getConfiguration("prettier", uri);
    const hasLegacyLinterConfig = await this.warnIfLegacyLinterConfiguration(
      vscodeConfig
    );

    this.telemetryReporter.sendTelemetryEvent("legacyConfig", undefined, {
      "legacyConfig.linters": hasLegacyLinterConfig ? 1 : 0
    });

    if (!hasLegacyLinterConfig) {
      // No legacy configs, add to cache
      this.noLegacyConfigWorkspaces.push(cacheKey);
    }
  }

  public async showErrorMessage(
    label: string,
    message: string,
    extraLines?: string[]
  ) {
    const localizedMessage = localize(label, message);

    if (extraLines) {
      const lines = [localizedMessage];
      lines.push(...extraLines);
      return window.showErrorMessage(lines.join(" "));
    } else {
      return window.showErrorMessage(localizedMessage);
    }
  }

  public dispose() {
    this.noLegacyConfigWorkspaces = [];
  }

  /**
   * Check if the resource has legacy config. Returns true if legacy config is found.
   * @param vscodeConfig The configuration
   */
  private async warnIfLegacyLinterConfiguration(
    vscodeConfig: WorkspaceConfiguration
  ): Promise<boolean> {
    const { hasLegacyConfig } = this.hasLegacyConfiguration(
      vscodeConfig,
      LEGACY_LINTER_OPTIONS
    );
    if (hasLegacyConfig) {
      const message = localize(
        "ext.message.legacyLinterConfigInUse",
        LEGACY_VSCODE_LINTER_CONFIG_MESSAGE
      );
      const result = await window.showWarningMessage(
        message,
        VIEW_LOGS_ACTION_TEXT,
        REMOVE_LEGACY_OPTIONS_ACTION_TEXT
      );
      if (result && result === VIEW_LOGS_ACTION_TEXT) {
        this.loggingService.show();
      }
      if (result && result === REMOVE_LEGACY_OPTIONS_ACTION_TEXT) {
        this.removeLegacyConfiguration(LEGACY_LINTER_OPTIONS, vscodeConfig);
      }
    }
    return hasLegacyConfig;
  }

  private hasLegacyConfiguration(
    vscodeConfig: WorkspaceConfiguration,
    legacyConfigOptions: string[]
  ) {
    const foundOptions = new Map<string, any>();
    legacyConfigOptions.forEach(key => {
      const inspected = vscodeConfig.inspect(key);
      const val = vscodeConfig.get(key);
      if (inspected) {
        if (inspected.globalValue !== undefined) {
          this.loggingService.logMessage(
            `Configuration value 'prettier.${key}' set to '${val}' found in global configuration.`,
            "WARN"
          );
          foundOptions.set(key, val);
        }
        if (
          inspected.workspaceValue !== undefined ||
          inspected.workspaceFolderValue !== undefined
        ) {
          this.loggingService.logMessage(
            `Configuration value 'prettier.${key}' set to '${val}' found in workspace configuration.`,
            "WARN"
          );
          foundOptions.set(key, val);
        }
      }
    });
    const hasLegacyConfig = foundOptions.size > 0;
    return { hasLegacyConfig, foundOptions };
  }

  private removeLegacyConfiguration(
    legacyConfigOptions: string[],
    vscodeConfig: WorkspaceConfiguration
  ) {
    legacyConfigOptions.forEach(key => {
      vscodeConfig.update(key, undefined, ConfigurationTarget.Global);
      vscodeConfig.update(key, undefined, ConfigurationTarget.Workspace);
      vscodeConfig.update(key, undefined, ConfigurationTarget.WorkspaceFolder);
      this.loggingService.logMessage(
        `Removed setting 'prettier.${key}' from any configurations.`,
        "INFO"
      );
    });
  }
}
