import { clearConfigCache } from "prettier";
import {
  commands,
  ExtensionContext
  // tslint:disable-next-line: no-implicit-dependencies
} from "vscode";
import TelemetryReporter from "vscode-extension-telemetry";
import { createConfigFile } from "./Commands";
import { ConfigResolver } from "./ConfigResolver";
import { Formatter } from "./Formatter";
import { IgnorerResolver } from "./IgnorerResolver";
import { LoggingService } from "./LoggingService";
import { ModuleResolver } from "./ModuleResolver";
import { NotificationService } from "./NotificationService";
import EditProvider from "./PrettierEditProvider";
import { TemplateService } from "./TemplateService";
import { getConfig } from "./util";
import {
  configWatcher,
  fileWatcher,
  packageWatcher,
  workspaceFolderWatcher
} from "./Watchers";

// the application insights key (also known as instrumentation key)
const telemetryKey = "93c48152-e880-42c1-8652-30ad62ce8b49";
const extensionName = process.env.EXTENSION_NAME || "prettier.prettier-vscode";
const extensionVersion = process.env.EXTENSION_VERSION || "0.0.0";

// telemetry reporter
let reporter: TelemetryReporter;

export function activate(context: ExtensionContext) {
  const loggingService = new LoggingService();

  loggingService.appendLine(`Extension Name: ${extensionName}.`, "INFO");
  loggingService.appendLine(`Extension Version: ${extensionVersion}.`, "INFO");

  // create telemetry reporter on extension activation
  reporter = new TelemetryReporter(
    extensionName,
    extensionVersion,
    telemetryKey
  );

  const templateService = new TemplateService(loggingService);

  const createConfigFileFunc = createConfigFile(templateService);
  const createConfigFileCommand = commands.registerCommand(
    "prettier.createConfigFile",
    createConfigFileFunc
  );

  const notificationService = new NotificationService(createConfigFileFunc);
  const moduleResolver = new ModuleResolver(
    loggingService,
    notificationService
  );
  const ignoreReslver = new IgnorerResolver(loggingService);
  const configResolver = new ConfigResolver(loggingService);

  const editProvider = new EditProvider(
    moduleResolver,
    ignoreReslver,
    configResolver,
    loggingService,
    notificationService
  );

  const formatter = new Formatter(
    moduleResolver,
    editProvider,
    loggingService,
    notificationService
  );
  formatter.registerFormatter();

  context.subscriptions.push(
    workspaceFolderWatcher(formatter.registerFormatter),
    configWatcher(formatter.registerFormatter),
    fileWatcher(clearConfigCache),
    packageWatcher(formatter.registerFormatter),
    formatter,
    reporter,
    createConfigFileCommand
  );
}

export function deactivate() {
  // This will ensure all pending events get flushed
  reporter.dispose();
}
