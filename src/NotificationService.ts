import {
  ConfigurationTarget,
  Uri,
  window,
  workspace,
  WorkspaceConfiguration
  // tslint:disable-next-line: no-implicit-dependencies
} from "vscode";
import TelemetryReporter from "vscode-extension-telemetry";
import * as nls from "vscode-nls";
import { createConfigFileFunction } from "./Commands";
import { LoggingService } from "./LoggingService";
import {
  LEGACY_VSCODE_LINTER_CONFIG_MESSAGE,
  LEGACY_VSCODE_PRETTIER_CONFIG_MESSAGE,
  MIGRATE_CONFIG_ACTION_TEXT,
  OUTDATED_PRETTIER_VERSION_MESSAGE,
  REMOVE_LEGACY_OPTIONS_ACTION_TEXT,
  VIEW_LOGS_ACTION_TEXT
} from "./message";

const LEGACY_LINTER_OPTIONS = [
  "eslintIntegration",
  "tslintIntegration",
  "stylelintIntegration"
];

const LEGACY_PRETTIER_OPTIONS = [
  "printWidth",
  "tabWidth",
  "singleQuote",
  "trailingComma",
  "bracketSpacing",
  "jsxBracketSameLine",
  "semi",
  "useTabs",
  "proseWrap",
  "arrowParens",
  "jsxSingleQuote",
  "htmlWhitespaceSensitivity",
  "endOfLine",
  "quoteProps"
];

const localize = nls.loadMessageBundle();

export class NotificationService {
  public noLegacyConfigWorkspaces: string[] = [];

  constructor(
    private telemetryReporter: TelemetryReporter,
    private loggingService: LoggingService,
    private createConfigFileCommand: createConfigFileFunction
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
    const hasLegacyPrettierConfig = await this.warnIfLegacyPrettierConfiguration(
      vscodeConfig
    );
    const hasLegacyLinterConfig = await this.warnIfLegacyLinterConfiguration(
      vscodeConfig
    );

    this.telemetryReporter.sendTelemetryEvent("hasLegacyConfig", undefined, {
      linters: hasLegacyLinterConfig ? 1 : 0,
      prettier: hasLegacyPrettierConfig ? 1 : 0
    });

    if (!hasLegacyPrettierConfig && !hasLegacyLinterConfig) {
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

  public clearCache() {
    this.noLegacyConfigWorkspaces = [];
  }

  /**
   * Check if the resource has legacy config. Returns true if legacy config is found.
   * @param vscodeConfig The configuration
   */
  private async warnIfLegacyLinterConfiguration(
    vscodeConfig: WorkspaceConfiguration
  ): Promise<boolean> {
    const { hasLegacyConfig } = this.hasLegacyConfig(
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
      this.logLegacyConfigOptionsIfSelected(
        result,
        LEGACY_LINTER_OPTIONS,
        vscodeConfig
      );
      this.removeLegacyConfigurationOptionsIfSelected(
        result,
        LEGACY_LINTER_OPTIONS,
        vscodeConfig
      );
    }
    return hasLegacyConfig;
  }

  /**
   * Check if the resource has legacy config. Returns true if legacy config is found.
   * @param vscodeConfig The configuration
   */
  private async warnIfLegacyPrettierConfiguration(
    vscodeConfig: WorkspaceConfiguration
  ): Promise<boolean> {
    const { hasLegacyConfig, foundOptions } = this.hasLegacyConfig(
      vscodeConfig,
      LEGACY_PRETTIER_OPTIONS
    );
    if (hasLegacyConfig) {
      const message = localize(
        "ext.message.legacyPrettierConfigInUse",
        LEGACY_VSCODE_PRETTIER_CONFIG_MESSAGE
      );

      const result = await window.showWarningMessage(
        message,
        VIEW_LOGS_ACTION_TEXT,
        REMOVE_LEGACY_OPTIONS_ACTION_TEXT,
        MIGRATE_CONFIG_ACTION_TEXT
      );
      this.logLegacyConfigOptionsIfSelected(
        result,
        LEGACY_PRETTIER_OPTIONS,
        vscodeConfig
      );
      this.removeLegacyConfigurationOptionsIfSelected(
        result,
        LEGACY_PRETTIER_OPTIONS,
        vscodeConfig
      );
      if (result && result === MIGRATE_CONFIG_ACTION_TEXT) {
        await this.createConfigFileCommand(foundOptions);
        LEGACY_PRETTIER_OPTIONS.forEach(key => {
          const inspected = vscodeConfig.inspect(key);
          if (inspected?.workspaceFolderValue) {
            vscodeConfig.update(
              key,
              undefined,
              ConfigurationTarget.WorkspaceFolder
            );
          }
          if (inspected?.workspaceValue) {
            vscodeConfig.update(key, undefined, ConfigurationTarget.Workspace);
          }
        });
      }
    }
    return hasLegacyConfig;
  }

  private hasLegacyConfig(
    vscodeConfig: WorkspaceConfiguration,
    legacyConfigOptions: string[]
  ) {
    const foundOptions = new Map<string, any>();
    legacyConfigOptions.forEach(key => {
      const val = vscodeConfig.get(key);
      if (val !== null) {
        foundOptions.set(key, val);
      }
    });
    const hasLegacyConfig = foundOptions.size > 0;
    return { hasLegacyConfig, foundOptions };
  }

  private async removeLegacyConfigurationOptionsIfSelected(
    actionResult: string | undefined,
    legacyConfigOptions: string[],
    vscodeConfig: WorkspaceConfiguration
  ) {
    if (actionResult && actionResult === REMOVE_LEGACY_OPTIONS_ACTION_TEXT) {
      legacyConfigOptions.forEach(key => {
        const inspected = vscodeConfig.inspect(key);
        if (inspected?.globalValue) {
          vscodeConfig.update(key, undefined, ConfigurationTarget.Global);
          this.loggingService.logMessage(
            `Removed setting 'prettier.${key}' from global configuration.`,
            "INFO"
          );
        }
        if (inspected?.workspaceFolderValue) {
          vscodeConfig.update(
            key,
            undefined,
            ConfigurationTarget.WorkspaceFolder
          );
          this.loggingService.logMessage(
            `Removed setting 'prettier.${key}' from workspace folder configuration.`,
            "INFO"
          );
        }
        if (inspected?.workspaceValue) {
          vscodeConfig.update(key, undefined, ConfigurationTarget.Workspace);
          this.loggingService.logMessage(
            `Removed setting 'prettier.${key}' from workspace configuration.`,
            "INFO"
          );
        }
      });
    }
  }

  private logLegacyConfigOptionsIfSelected(
    actionResult: string | undefined,
    legacyConfigOptions: string[],
    vscodeConfig: WorkspaceConfiguration
  ) {
    if (actionResult && actionResult === VIEW_LOGS_ACTION_TEXT) {
      legacyConfigOptions.forEach(key => {
        const inspected = vscodeConfig.inspect(key);
        if (inspected) {
          if (inspected.globalValue) {
            this.loggingService.logMessage(
              `Configuration value 'prettier.${key}' found in global configuration.`,
              "WARN"
            );
          }
          if (inspected.workspaceFolderValue) {
            this.loggingService.logMessage(
              `Configuration value 'prettier.${key}' found in workspace folder configuration.`,
              "WARN"
            );
          }
          if (inspected.workspaceValue) {
            this.loggingService.logMessage(
              `Configuration value 'prettier.${key}' found in workspace configuration.`,
              "WARN"
            );
          }
        }
      });
      this.loggingService.show();
    }
  }
}
