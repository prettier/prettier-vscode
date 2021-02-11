import { commands, ExtensionContext, workspace } from "vscode";
import { createConfigFile } from "./commands";
import { ConfigResolver } from "./ConfigResolver";
import { IgnorerResolver } from "./IgnorerResolver";
import { LanguageResolver } from "./LanguageResolver";
import { LoggingService } from "./LoggingService";
import { ModuleResolver } from "./ModuleResolver";
import { NotificationService } from "./NotificationService";
import PrettierEditService from "./PrettierEditService";
import { StatusBar } from "./StatusBar";
import { TemplateService } from "./TemplateService";
import { getConfig } from "./util";
import { RESTART_TO_ENABLE } from "./message";
import { setGlobalState, setWorkspaceState } from "./stateUtils";

// the application insights key (also known as instrumentation key)
const extensionName = process.env.EXTENSION_NAME || "dev.prettier-vscode";
const extensionVersion = process.env.EXTENSION_VERSION || "0.0.0";

export function activate(context: ExtensionContext) {
  const loggingService = new LoggingService();

  loggingService.logInfo(`Extension Name: ${extensionName}.`);
  loggingService.logInfo(`Extension Version: ${extensionVersion}.`);

  const { enable } = getConfig();
  if (!enable) {
    loggingService.logInfo(
      "Extension is disabled. No formatters will be registered. To enable, change the `prettier.enable` to `true` and restart VS Code."
    );
    context.subscriptions.push(
      workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration("prettier.enable")) {
          loggingService.logWarning(RESTART_TO_ENABLE);
        }
      })
    );
    return;
  }

  setGlobalState(context.globalState);
  setWorkspaceState(context.workspaceState);

  const templateService = new TemplateService(loggingService);
  const createConfigFileFunc = createConfigFile(templateService);
  const createConfigFileCommand = commands.registerCommand(
    "prettier.createConfigFile",
    createConfigFileFunc
  );
  const openOutputCommand = commands.registerCommand(
    "prettier.openOutput",
    () => {
      loggingService.show();
    }
  );

  const ignoreResolver = new IgnorerResolver(loggingService);
  const configResolver = new ConfigResolver(loggingService);
  const notificationService = new NotificationService(loggingService);

  const moduleResolver = new ModuleResolver(
    loggingService,
    notificationService
  );

  const languageResolver = new LanguageResolver(moduleResolver);

  const statusBar = new StatusBar();

  const editService = new PrettierEditService(
    moduleResolver,
    languageResolver,
    ignoreResolver,
    configResolver,
    loggingService,
    notificationService,
    statusBar
  );

  context.subscriptions.push(
    editService,
    createConfigFileCommand,
    openOutputCommand,
    ...editService.registerDisposables()
  );
}
