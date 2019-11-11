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
import {
  LEGACY_VSCODE_LINTER_CONFIG_MESSAGE,
  LEGACY_VSCODE_PRETTIER_CONFIG_MESSAGE,
  MIGRATE_CONFIG_ACTION_TEXT,
  OUTDATED_PRETTIER_VERSION_MESSAGE,
  VIEW_LOGS_ACTION_TEXT
} from "./Consts";
import { LoggingService } from "./LoggingService";
import { PrettierModule } from "./types";

const localize = nls.loadMessageBundle();

export class NotificationService {
  public noLegacyConfigWorkspaces: string[] = [];

  constructor(
    private telemetryReporter: TelemetryReporter,
    private loggingService: LoggingService,
    private createConfigFileCommand: createConfigFileFunction
  ) {}

  public warnOutdatedPrettierVersion(
    prettierInstance?: PrettierModule,
    prettierPath?: string
  ) {
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
    const legacyConfigOptions = [
      'eslintIntegration',
      "tslintIntegration",
      "stylelintIntegration"
    ]
      const migratedOptions = new Map<string, any>();
      legacyConfigOptions.forEach(key => {
        const val = vscodeConfig.get(key);
        if (val !== null) {
          migratedOptions.set(key, val);
        }
      });
      const hasLegacyConfig = migratedOptions.size > 0;
    if (hasLegacyConfig) {
      const message = localize(
        "ext.message.legacyLinterConfigInUse",
        LEGACY_VSCODE_LINTER_CONFIG_MESSAGE
      );

      const result = await window.showWarningMessage(message, VIEW_LOGS_ACTION_TEXT);
      this.logLegacyConfigOptions(result, legacyConfigOptions, vscodeConfig);
    }
    return hasLegacyConfig;
  }

  private logLegacyConfigOptions(result: string | undefined, legacyConfigOptions: string[], vscodeConfig: WorkspaceConfiguration) {
    if (result && result === VIEW_LOGS_ACTION_TEXT) {
      legacyConfigOptions.forEach(key => {
        const inspected = vscodeConfig.inspect(key);
        if (inspected) {
          if (inspected.globalValue) {
            this.loggingService.logMessage(`Configuration value 'prettier.${key}' found in global configuration.`, 'WARN');
          }
          if (inspected.workspaceFolderValue) {
            this.loggingService.logMessage(`Configuration value 'prettier.${key}' found in workspace folder configuration.`, 'WARN');
          }
          if (inspected.workspaceValue) {
            this.loggingService.logMessage(`Configuration value 'prettier.${key}' found in workspace configuration.`, 'WARN');
          }
        }
      });
      this.loggingService.show();
    }
  }

  /**
   * Check if the resource has legacy config. Returns true if legacy config is found.
   * @param vscodeConfig The configuration
   */
  private async warnIfLegacyPrettierConfiguration(
    vscodeConfig: WorkspaceConfiguration,
  ): Promise<boolean> {
    const legacyConfigOptions = [
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

    const migratedOptions = new Map<string, any>();
    legacyConfigOptions.forEach(key => {
      const val = vscodeConfig.get(key);
      if (val !== null) {
        migratedOptions.set(key, val);
      }
    });
    const hasLegacyConfig = migratedOptions.size > 0;
    if (hasLegacyConfig) {
      
      const message = localize(
        "ext.message.legacyPrettierConfigInUse",
        LEGACY_VSCODE_PRETTIER_CONFIG_MESSAGE
      );

      const result = await window.showWarningMessage(
        message,
        VIEW_LOGS_ACTION_TEXT,
        MIGRATE_CONFIG_ACTION_TEXT
      );
      this.logLegacyConfigOptions(result, legacyConfigOptions, vscodeConfig);
      if (result && result === MIGRATE_CONFIG_ACTION_TEXT) {
        await this.createConfigFileCommand(migratedOptions);
        legacyConfigOptions.forEach(key => {
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
}
