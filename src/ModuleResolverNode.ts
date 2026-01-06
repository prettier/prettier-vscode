import * as fs from "fs";
import * as path from "path";
import type * as PrettierTypes from "prettier";
import * as semver from "semver";
import { commands, TextDocument, Uri, window, workspace } from "vscode";
import {
  resolveGlobalNodePath,
  resolveGlobalYarnPath,
  resolveGlobalPnpmPath,
} from "./utils/global-node-paths.js";
import { findUp, pathExists, FIND_UP_STOP } from "./utils/find-up.js";
import { LoggingService } from "./LoggingService.js";
import {
  FAILED_TO_LOAD_MODULE_MESSAGE,
  INVALID_PRETTIER_CONFIG,
  INVALID_PRETTIER_PATH_MESSAGE,
  OUTDATED_PRETTIER_VERSION_MESSAGE,
  UNTRUSTED_WORKSPACE_USING_BUNDLED_PRETTIER,
  USING_BUNDLED_PRETTIER,
} from "./message.js";
import {
  ModuleResolverInterface,
  PackageManagers,
  PrettierOptions,
  PrettierResolveConfigOptions,
  PrettierVSCodeConfig,
  PrettierInstance,
} from "./types.js";
import {
  getWorkspaceConfig,
  getWorkspaceRelativePath,
} from "./utils/workspace.js";
import { PrettierDynamicInstance } from "./PrettierDynamicInstance.js";

const minPrettierVersion = "1.13.0";

export type PrettierNodeModule = typeof PrettierTypes;

// Lazy-load prettier to avoid blocking the extension host during module loading
let prettierModule: PrettierNodeModule | undefined;
async function getBundledPrettier(): Promise<PrettierNodeModule> {
  if (!prettierModule) {
    const imported = await import("prettier");
    // Handle both ESM (Prettier v3+) and CJS (Prettier v2) modules
    // CJS modules imported via ESM have their exports on the default property
    prettierModule = (
      imported.default?.version ? imported.default : imported
    ) as PrettierNodeModule;
  }
  return prettierModule;
}

// Cache for global package manager paths (async)
const globalPathCache = new Map<string, Promise<string | undefined>>();

async function globalPathGet(
  packageManager: PackageManagers,
): Promise<string | undefined> {
  // Check if we already have a cached promise
  if (globalPathCache.has(packageManager)) {
    return globalPathCache.get(packageManager);
  }

  // Create the promise and cache it
  let resolvePromise: Promise<string | undefined>;

  switch (packageManager) {
    case "npm":
      resolvePromise = resolveGlobalNodePath();
      break;
    case "yarn":
      resolvePromise = resolveGlobalYarnPath();
      break;
    case "pnpm":
      resolvePromise = resolveGlobalPnpmPath();
      break;
    default:
      resolvePromise = Promise.resolve(undefined);
  }

  globalPathCache.set(packageManager, resolvePromise);
  return resolvePromise;
}

export class ModuleResolver implements ModuleResolverInterface {
  private path2Module = new Map<string, PrettierInstance>();

  constructor(private loggingService: LoggingService) {}

  public async getGlobalPrettierInstance(): Promise<PrettierNodeModule> {
    return getBundledPrettier();
  }

  public async getPrettierInstance(
    fileName: string,
  ): Promise<PrettierInstance | PrettierNodeModule | undefined> {
    // For untrusted workspaces, always use bundled prettier for security
    if (!workspace.isTrusted) {
      this.loggingService.logDebug(UNTRUSTED_WORKSPACE_USING_BUNDLED_PRETTIER);
      return getBundledPrettier();
    }

    const { prettierPath, resolveGlobalModules } = getWorkspaceConfig(
      Uri.file(fileName),
    );

    // Look for local module
    let modulePath: string | undefined;

    try {
      modulePath = prettierPath
        ? await this.getModuleFromPrettierPath(fileName, prettierPath)
        : await this.findPrettierModule(fileName);
    } catch (error) {
      let msg = `Unable to find prettier module`;
      if (error instanceof Error) {
        msg += `: ${error.message}`;
      }
      this.loggingService.logError(msg);
    }

    // If global modules allowed, look there
    if (!modulePath && resolveGlobalModules) {
      modulePath = await this.findGlobalModule("prettier");
    }

    // Fall back to bundled prettier when no local is found
    if (!modulePath) {
      this.loggingService.logDebug(USING_BUNDLED_PRETTIER);
      return getBundledPrettier();
    }

    const isValidVersion = await this.isValidVersion(modulePath);
    if (!isValidVersion) {
      return undefined;
    }

    // Check cache
    let prettierInstance = this.path2Module.get(modulePath);
    if (prettierInstance) {
      return prettierInstance;
    }

    // Create new instance using PrettierDynamicInstance for ESM support
    prettierInstance = new PrettierDynamicInstance(modulePath);

    // Import the module to populate version and validate it loads correctly
    try {
      await prettierInstance.import();
    } catch (error) {
      this.loggingService.logError(
        `${FAILED_TO_LOAD_MODULE_MESSAGE}: ${modulePath}`,
        error,
      );
      return undefined;
    }

    this.path2Module.set(modulePath, prettierInstance);

    return prettierInstance;
  }

  private async getModuleFromPrettierPath(
    fileName: string,
    prettierPath: string,
  ): Promise<string | undefined> {
    const absolutePrettierPath = path.isAbsolute(prettierPath)
      ? prettierPath
      : path.join(
          workspace.getWorkspaceFolder(Uri.file(fileName))?.uri.fsPath ?? "",
          prettierPath,
        );

    if (await pathExists(absolutePrettierPath)) {
      return absolutePrettierPath;
    }

    this.loggingService.logError(INVALID_PRETTIER_PATH_MESSAGE);
    return undefined;
  }

  public async getResolvedIgnorePath(
    fileName: string,
    ignorePath: string,
  ): Promise<string | undefined> {
    // First try workspace-relative path
    const resolvedPath = getWorkspaceRelativePath(fileName, ignorePath);
    if (resolvedPath && (await pathExists(resolvedPath))) {
      return resolvedPath;
    }

    // If not found in workspace, search upward from file directory
    // This handles nested workspace folders where .prettierignore is in a parent directory
    const foundPath = await findUp(
      async (dir: string) => {
        const ignoreFilePath = path.join(dir, ignorePath);
        if (await pathExists(ignoreFilePath)) {
          return ignoreFilePath;
        }
        // Stop at marker file
        if (
          await pathExists(path.join(dir, ".do-not-use-prettier-vscode-root"))
        ) {
          return FIND_UP_STOP;
        }
        return undefined;
      },
      { cwd: path.dirname(fileName) },
    );

    if (foundPath) {
      return foundPath;
    }

    this.loggingService.logWarning(
      `Unable to resolve ignore path: ${ignorePath} for ${fileName}`,
    );
    return;
  }

  public async getResolvedConfig(
    doc: TextDocument,
    vscodeConfig: PrettierVSCodeConfig,
  ): Promise<"error" | "disabled" | PrettierOptions | null> {
    const fileName = doc.fileName;
    const prettier =
      (await this.getPrettierInstance(fileName)) ??
      (await getBundledPrettier());

    return this.resolveConfig(prettier, fileName, vscodeConfig);
  }

  public async clearModuleCache(filePath: string): Promise<void> {
    const prettier =
      (await this.getPrettierInstance(filePath)) ??
      (await getBundledPrettier());

    try {
      await prettier.clearConfigCache();
    } catch (error) {
      this.loggingService.logError(
        `Failed to clear config cache for ${filePath}`,
        error,
      );
    }
  }

  private async findPrettierModule(
    fileName: string,
  ): Promise<string | undefined> {
    // fileName might be a file path or a directory path (e.g., workspace folder)
    // If it's a directory, use it directly; otherwise get its parent directory
    let dir: string;
    try {
      const stat = await fs.promises.stat(fileName);
      dir = stat.isDirectory() ? fileName : path.dirname(fileName);
    } catch {
      // If stat fails, assume it's a file path and get its parent
      dir = path.dirname(fileName);
    }

    const foundPath = await findUp(
      async (d: string) => {
        const nodeModulesDir = path.join(d, "node_modules");
        const prettierPath = path.join(nodeModulesDir, "prettier");
        if (await pathExists(prettierPath)) {
          return prettierPath;
        }

        // Also check for prettier inside nested dependencies
        // This handles cases where prettier is a dependency of a local module
        if (await pathExists(nodeModulesDir)) {
          try {
            const entries = await fs.promises.readdir(nodeModulesDir);
            for (const entry of entries) {
              // Skip hidden files and @scoped packages for now
              if (entry.startsWith(".") || entry.startsWith("@")) {
                continue;
              }
              const nestedPrettierPath = path.join(
                nodeModulesDir,
                entry,
                "node_modules",
                "prettier",
              );
              if (await pathExists(nestedPrettierPath)) {
                return nestedPrettierPath;
              }
            }
          } catch {
            // Ignore errors reading directory
          }
        }

        // Stop searching at .do-not-use-prettier-vscode-root marker
        if (
          await pathExists(path.join(d, ".do-not-use-prettier-vscode-root"))
        ) {
          return FIND_UP_STOP;
        }

        return undefined;
      },
      { cwd: dir },
    );

    return foundPath;
  }

  private async findGlobalModule(
    moduleName: string,
  ): Promise<string | undefined> {
    const packageManagers: PackageManagers[] = ["npm", "yarn", "pnpm"];

    for (const pm of packageManagers) {
      const globalPath = await globalPathGet(pm);
      if (globalPath) {
        const modulePath = path.join(globalPath, moduleName);
        if (await pathExists(modulePath)) {
          return modulePath;
        }
      }
    }

    return undefined;
  }

  private async isValidVersion(modulePath: string): Promise<boolean> {
    let modulePackageJsonPath = "";

    try {
      modulePackageJsonPath = path.join(modulePath, "package.json");
      const rawPkgJson = await fs.promises.readFile(modulePackageJsonPath, {
        encoding: "utf8",
      });
      const pkgJson = JSON.parse(rawPkgJson) as { version: string };
      const version = pkgJson.version;

      if (!semver.gte(version, minPrettierVersion)) {
        this.loggingService.logError(OUTDATED_PRETTIER_VERSION_MESSAGE);
        this.loggingService.logInfo(
          `Found version ${version}, requires ${minPrettierVersion}+`,
        );

        // Show a warning popup to the user
        void window
          .showWarningMessage(
            `Prettier: Version ${version} is outdated. Please upgrade to Prettier ${minPrettierVersion} or newer.`,
            "Learn More",
          )
          .then((selection) => {
            if (selection === "Learn More") {
              void commands.executeCommand(
                "vscode.open",
                Uri.parse("https://prettier.io/docs/en/install"),
              );
            }
          });

        await commands.executeCommand(
          "setContext",
          "prettier.outdatedError",
          true,
        );
        return false;
      }

      await commands.executeCommand(
        "setContext",
        "prettier.outdatedError",
        false,
      );
      return true;
    } catch {
      this.loggingService.logError(
        `${FAILED_TO_LOAD_MODULE_MESSAGE} ${modulePackageJsonPath}`,
      );
      return false;
    }
  }

  public async resolveConfig(
    prettierInstance: {
      resolveConfigFile(filePath?: string): Promise<string | null>;
      resolveConfig(
        fileName: string,
        options?: PrettierResolveConfigOptions,
      ): Promise<PrettierOptions | null>;
    },
    fileName: string,
    vscodeConfig: PrettierVSCodeConfig,
  ): Promise<"error" | "disabled" | PrettierOptions | null> {
    let configPath: string | undefined;
    try {
      configPath =
        (await prettierInstance.resolveConfigFile(fileName)) ?? undefined;
    } catch (error) {
      this.loggingService.logError(
        `Failed to resolve config file for ${fileName}`,
        error,
      );
      return "error";
    }

    // Log what config file was found (if any)
    if (configPath) {
      this.loggingService.logInfo(`Using config file at ${configPath}`);
    }

    // Log if editorconfig will be considered
    if (vscodeConfig.useEditorConfig) {
      this.loggingService.logInfo(
        "EditorConfig support is enabled, checking for .editorconfig files",
      );
    }

    let resolvedConfig: PrettierOptions | null;
    try {
      const customConfigPath = vscodeConfig.configPath
        ? getWorkspaceRelativePath(fileName, vscodeConfig.configPath)
        : undefined;

      // Log if a custom config path is specified in VS Code settings
      if (customConfigPath) {
        this.loggingService.logInfo(
          `Using custom config path from settings: ${customConfigPath}`,
        );
      }

      const resolveConfigOptions: PrettierResolveConfigOptions = {
        config: customConfigPath ?? configPath,
        editorconfig: vscodeConfig.useEditorConfig,
      };
      resolvedConfig = await prettierInstance.resolveConfig(
        fileName,
        resolveConfigOptions,
      );
    } catch (error) {
      this.loggingService.logError(INVALID_PRETTIER_CONFIG, error);
      return "error";
    }

    // Log what configuration was resolved
    if (resolvedConfig) {
      this.loggingService.logInfo("Resolved config:", resolvedConfig);
    }

    // Determine config source for better user feedback
    if (!configPath && resolvedConfig && vscodeConfig.useEditorConfig) {
      // Config was resolved but no Prettier config file was found
      // This means settings came from .editorconfig
      this.loggingService.logInfo(
        "No Prettier config file found, but settings were loaded from .editorconfig",
      );
    } else if (!configPath && !resolvedConfig) {
      this.loggingService.logInfo(
        "No local configuration (i.e. .prettierrc or .editorconfig) detected, will fall back to VS Code configuration",
      );
    }

    if (!vscodeConfig.requireConfig) {
      return resolvedConfig;
    }

    if (resolvedConfig) {
      return resolvedConfig;
    }

    if (!configPath) {
      this.loggingService.logInfo(
        "Require config set to true but no config file found, disabling formatting.",
      );
      return "disabled";
    }

    return resolvedConfig;
  }

  public dispose(): void {
    this.path2Module.clear();
  }
}
