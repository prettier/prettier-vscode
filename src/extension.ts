import { clearConfigCache } from "prettier";
import {
  ExtensionContext
  // tslint:disable-next-line: no-implicit-dependencies
} from "vscode";
import TelemetryReporter from "vscode-extension-telemetry";
import { ConfigResolver, getConfig } from "./ConfigResolver";
import { Formatter } from "./Formatter";
import { IgnorerResolver } from "./IgnorerResolver";
import { LoggingService } from "./LoggingService";
import { ModuleResolver } from "./ModuleResolver";
import EditProvider from "./PrettierEditProvider";
import {
  configWatcher,
  fileWatcher,
  packageWatcher,
  workspaceFolderWatcher
} from "./Watchers";

// the application insights key (also known as instrumentation key)
const telemetryKey = "93c48152-e880-42c1-8652-30ad62ce8b49";

// telemetry reporter
let reporter: TelemetryReporter;

export function activate(context: ExtensionContext) {
  // create telemetry reporter on extension activation
  const extensionPackage = require(context.asAbsolutePath("./package.json"));
  reporter = new TelemetryReporter(
    extensionPackage.name,
    extensionPackage.version,
    telemetryKey
  );

  const config = getConfig();
  reporter.sendTelemetryEvent("integration_usage", undefined, {
    eslint: config.eslintIntegration ? 1 : 0,
    stylelint: config.stylelintIntegration ? 1 : 0,
    tslint: config.tslintIntegration ? 1 : 0
  });

  const loggingService = new LoggingService();
  const moduleResolver = new ModuleResolver(loggingService);
  const ignoreReslver = new IgnorerResolver(loggingService);
  const configResolver = new ConfigResolver(loggingService);

  const editProvider = new EditProvider(
    moduleResolver,
    ignoreReslver,
    configResolver,
    loggingService
  );

  const formatter = new Formatter(moduleResolver, editProvider, loggingService);
  formatter.registerFormatter();

  context.subscriptions.push(
    workspaceFolderWatcher(formatter.registerFormatter),
    configWatcher(formatter.registerFormatter),
    fileWatcher(clearConfigCache),
    packageWatcher(formatter.registerFormatter),
    formatter,
    reporter
  );
}

export function deactivate() {
  // This will ensure all pending events get flushed
  reporter.dispose();
}
