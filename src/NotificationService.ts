// tslint:disable-next-line: no-implicit-dependencies
import { ConfigurationTarget, Uri, window, workspace } from "vscode";
import * as nls from "vscode-nls";
import { createConfigFileFunction } from "./Commands";
import {
  LEGACY_VSCODE_CONFIG_MESSAGE,
  MIGRATE_CONFIG_ACTION_TEXT,
  OUTDATED_PRETTIER_VERSION_MESSAGE
} from "./Consts";
import { PrettierModule } from "./types";

const localize = nls.config()();

export class NotificationService {
  public noLegacyConfigWorkspaces: string[] = [];

  constructor(private createConfigFileCommand: createConfigFileFunction) {}
  public warnOutdatedPrettierVersion(
    prettierInstance?: PrettierModule,
    prettierPath?: string
  ) {
    const message = localize(
      "ext.config.outdatedPrettiereVersion",
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
    const legacyConfigOptions = new Map<string, any>();
    legacyConfigOptions.set("printWidth", 80);
    legacyConfigOptions.set("tabWidth", 2);
    legacyConfigOptions.set("singleQuote", false);
    legacyConfigOptions.set("trailingComma", "none");
    legacyConfigOptions.set("bracketSpacing", true);
    legacyConfigOptions.set("jsxBracketSameLine", false);
    legacyConfigOptions.set("semi", true);
    legacyConfigOptions.set("useTabs", false);
    legacyConfigOptions.set("proseWrap", "preserve");
    legacyConfigOptions.set("arrowParens", "avoid");
    legacyConfigOptions.set("jsxSingleQuote", false);
    legacyConfigOptions.set("htmlWhitespaceSensitivity", "css");
    legacyConfigOptions.set("endOfLine", "auto");
    legacyConfigOptions.set("quoteProps", "as-needed");

    const migratedOptions = new Map<string, any>();
    legacyConfigOptions.forEach((defaultValue, key) => {
      const val = vscodeConfig.get(key);
      if (val !== defaultValue) {
        migratedOptions.set(key, val);
      }
    });
    if (migratedOptions.size === 0) {
      // No legacy configs, add to
      this.noLegacyConfigWorkspaces.push(cacheKey);
    } else {
      const message = localize(
        "ext.config.legacyVSCodeConfigInUse",
        LEGACY_VSCODE_CONFIG_MESSAGE
      );

      const result = await window.showErrorMessage(
        message,
        MIGRATE_CONFIG_ACTION_TEXT
      );
      if (result && result === MIGRATE_CONFIG_ACTION_TEXT) {
        await this.createConfigFileCommand(migratedOptions);
        legacyConfigOptions.forEach((val, key) => {
          const inspected = vscodeConfig.inspect(key);
          if (inspected && inspected.workspaceFolderValue) {
            vscodeConfig.update(
              key,
              undefined,
              ConfigurationTarget.WorkspaceFolder
            );
          }
        });
      }
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
}
