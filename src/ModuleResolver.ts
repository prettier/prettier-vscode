import { execSync } from "child_process";
import * as findUp from "find-up";
import * as fs from "fs";
import * as path from "path";
import * as prettier from "prettier";
import * as resolve from "resolve";
import * as semver from "semver";
import { commands, Disposable, Uri } from "vscode";
import { resolveGlobalNodePath, resolveGlobalYarnPath } from "./Files";
import { LoggingService } from "./LoggingService";
import {
  FAILED_TO_LOAD_MODULE_MESSAGE,
  INVALID_PRETTIER_PATH_MESSAGE,
  OUTDATED_PRETTIER_INSTALLED,
  USING_BUNDLED_PRETTIER,
} from "./message";
import {
  ConfirmationSelection,
  NotificationService,
} from "./NotificationService";
import {
  getFromGlobalState,
  getFromWorkspaceState,
  updateGlobalState,
  updateWorkspaceState,
} from "./stateUtils";
import { PackageManagers, PrettierModule } from "./types";
import { getConfig, getWorkspaceRelativePath } from "./util";

const minPrettierVersion = "1.13.0";
declare const __webpack_require__: typeof require;
declare const __non_webpack_require__: typeof require;

const alwaysAllowedExecutionStateKey = "PRETTIER_MODULE_ALWAYS_ALLOWED";
const moduleExecutionStateKey = "moduleExecutionState";

interface PrettierExecutionState {
  libs: { [key: string]: boolean };
}

const globalPaths: {
  [key: string]: { cache: string | undefined; get(): string | undefined };
} = {
  npm: {
    cache: undefined,
    get(): string | undefined {
      return resolveGlobalNodePath();
    },
  },
  pnpm: {
    cache: undefined,
    get(): string {
      const pnpmPath = execSync("pnpm root -g").toString().trim();
      return pnpmPath;
    },
  },
  yarn: {
    cache: undefined,
    get(): string | undefined {
      return resolveGlobalYarnPath();
    },
  },
};

function globalPathGet(packageManager: PackageManagers): string | undefined {
  const pm = globalPaths[packageManager];
  if (pm) {
    if (pm.cache === undefined) {
      pm.cache = pm.get();
    }
    return pm.cache;
  }
  return undefined;
}

export class ModuleResolver implements Disposable {
  private path2Module = new Map<string, PrettierModule>();
  private deniedModules = new Set<string>();

  constructor(
    private loggingService: LoggingService,
    private notificationService: NotificationService
  ) {}

  /**
   * Returns an instance of the prettier module.
   * @param fileName The path of the file to use as the starting point. If none provided, the bundled prettier will be used.
   */
  public async getPrettierInstance(
    fileName?: string
  ): Promise<PrettierModule | undefined> {
    if (!fileName) {
      return prettier;
    }

    const { prettierPath, resolveGlobalModules } = getConfig(
      Uri.file(fileName)
    );

    // Look for local module
    let modulePath: string | undefined = undefined;
    let isGlobalModule = false;

    try {
      modulePath = prettierPath
        ? getWorkspaceRelativePath(fileName, prettierPath)
        : this.findPkg(fileName, "prettier");
    } catch (error) {
      let moduleDirectory = "";
      if (!modulePath) {
        // If findPkg threw an error from `resolve.sync`, attempt to parse the
        // directory it failed on to provide a better error message
        const resolveSyncPathRegex = /Cannot find module '.*' from '(.*)'/;
        const resolveErrorMatches = resolveSyncPathRegex.exec(error.message);
        if (resolveErrorMatches && resolveErrorMatches[1]) {
          moduleDirectory = resolveErrorMatches[1];
        }
      }

      this.loggingService.logError(`Failed to local Prettier module.`, error);

      this.notificationService.showErrorMessage(FAILED_TO_LOAD_MODULE_MESSAGE, [
        `Attempted to load Prettier module from ${
          modulePath || moduleDirectory || "package.json"
        }`,
      ]);

      // Return here because there is a local module, but we can't resolve it.
      // Must do NPM install for prettier to work.
      return undefined;
    }

    // If global modules allowed, look for global module
    if (resolveGlobalModules && !modulePath) {
      const packageManager = (await commands.executeCommand<
        "npm" | "pnpm" | "yarn"
      >("npm.packageManager"))!;
      const resolvedGlobalPackageManagerPath = globalPathGet(packageManager);
      if (resolvedGlobalPackageManagerPath) {
        const globalModulePath = path.join(
          resolvedGlobalPackageManagerPath,
          "prettier"
        );
        if (fs.existsSync(globalModulePath)) {
          modulePath = globalModulePath;
          isGlobalModule = true;
        }
      }
    }

    let moduleInstance: PrettierModule | undefined = undefined;
    if (modulePath !== undefined) {
      // First check module cache
      moduleInstance = this.path2Module.get(modulePath);
      if (moduleInstance) {
        return moduleInstance;
      } else {
        try {
          const isAllowed = await this.isTrustedModule(
            modulePath,
            isGlobalModule
          );
          if (isAllowed) {
            moduleInstance = this.loadNodeModule<PrettierModule>(modulePath);
            if (moduleInstance) {
              this.path2Module.set(modulePath, moduleInstance);
            }
          } else {
            // Module is not allowed
            return undefined;
          }
        } catch (error) {
          this.loggingService.logError(
            `Failed to load Prettier module.`,
            error
          );

          this.notificationService.showErrorMessage(
            FAILED_TO_LOAD_MODULE_MESSAGE,
            [
              `Attempted to load Prettier module from ${
                modulePath || "package.json"
              }`,
            ]
          );

          // Returning here because module didn't load.
          return undefined;
        }
      }
    }

    if (!moduleInstance) {
      this.loggingService.logDebug(USING_BUNDLED_PRETTIER);
    }

    if (moduleInstance) {
      // If the instance is missing `format`, it's probably
      // not an instance of Prettier
      const isPrettierInstance = !!moduleInstance.format;
      const isValidVersion =
        moduleInstance.version &&
        !!moduleInstance.getSupportInfo &&
        !!moduleInstance.getFileInfo &&
        !!moduleInstance.resolveConfig &&
        semver.gte(moduleInstance.version, minPrettierVersion);

      if (!isPrettierInstance && prettierPath) {
        this.loggingService.logError(INVALID_PRETTIER_PATH_MESSAGE);
        this.notificationService.showErrorMessage(
          INVALID_PRETTIER_PATH_MESSAGE
        );
        return undefined;
      }

      if (!isValidVersion) {
        // We only prompt when formatting a file. If we did it on load there
        // could be lots of these notifications which would be annoying.
        this.notificationService.warnOutdatedPrettierVersion(modulePath);
        this.loggingService.logError(OUTDATED_PRETTIER_INSTALLED);
        return undefined;
      }
    }

    // If we made it this far, either a valid module was loaded or
    // no modules where found anywhere so we fall back to bundled instance
    return moduleInstance || prettier;
  }

  /**
   * Removes all saved module states.
   */
  public resetModuleExecutionState = async () => {
    updateGlobalState(alwaysAllowedExecutionStateKey, false);
    updateGlobalState(moduleExecutionStateKey, {
      libs: {},
    });
    this.deniedModules.clear();
    this.path2Module.clear();
  };

  /**
   * Clears the module and config cache
   */
  public async dispose() {
    prettier.clearConfigCache();
    this.path2Module.forEach((module) => {
      try {
        module.clearConfigCache();
      } catch (error) {
        this.loggingService.logError("Error clearing module cache.", error);
      }
    });
    this.path2Module.clear();
  }

  private async isTrustedModule(modulePath: string, isGlobal: boolean) {
    if (getFromGlobalState(alwaysAllowedExecutionStateKey, false)) {
      return true;
    }

    const moduleState = getFromGlobalState(moduleExecutionStateKey, {
      libs: {},
    }) as PrettierExecutionState;

    if (this.deniedModules.has(modulePath)) {
      return false;
    }

    let isTrustedModule = moduleState.libs[modulePath];
    if (!isTrustedModule) {
      const approvalResult = await this.notificationService.askForModuleApproval(
        modulePath,
        isGlobal
      );

      if (approvalResult === ConfirmationSelection.alwaysAllow) {
        isTrustedModule = true;
        updateGlobalState(alwaysAllowedExecutionStateKey, isTrustedModule);
      } else {
        isTrustedModule = approvalResult === ConfirmationSelection.allow;

        if (isTrustedModule) {
          moduleState.libs[modulePath] = isTrustedModule;
          updateGlobalState(moduleExecutionStateKey, moduleState);
        } else {
          this.loggingService.logWarning(
            `Module is not allowed to loaded from '${modulePath}'`
          );
          this.deniedModules.add(modulePath);
        }
      }
    }

    return isTrustedModule;
  }

  // Source: https://github.com/microsoft/vscode-eslint/blob/master/server/src/eslintServer.ts
  private loadNodeModule<T>(moduleName: string): T | undefined {
    const r =
      typeof __webpack_require__ === "function"
        ? __non_webpack_require__
        : require;
    try {
      return r(moduleName);
    } catch (error) {
      this.loggingService.logError(
        `Error loading node module '${moduleName}'`,
        error
      );
    }
    return undefined;
  }

  private isInternalTestRoot(dir: string): boolean {
    if (process.env.NODE_ENV !== "production") {
      // This is for testing purposes only. This code is removed in the
      // shipped version of this extension so do not use this in your
      // project. It won't work.
      return fs.existsSync(path.join(dir, ".do-not-use-prettier-vscode-root"));
    } else {
      return false;
    }
  }

  /**
   * Recursively search upwards for a given module definition based on
   * package.json or node_modules existence
   * @param {string} fsPath file system path to start searching from
   * @param {string} pkgName package's name to search for
   * @returns {string} resolved path to module
   */
  private findPkg(fsPath: string, pkgName: string): string | undefined {
    const stateKey = `module-path:${fsPath}:${pkgName}`;
    const packagePathState = getFromWorkspaceState(stateKey, false);
    if (packagePathState) {
      return packagePathState;
    }

    // Only look for a module definition outside of any `node_modules` directories
    const splitPath = fsPath.split("/");
    let finalPath = fsPath;
    const nodeModulesIndex = splitPath.indexOf("node_modules");

    if (nodeModulesIndex > 1) {
      finalPath = splitPath.slice(0, nodeModulesIndex).join("/");
    }

    // First look for an explicit package.json dep
    const packageJsonResDir = findUp.sync(
      (dir) => {
        if (fs.existsSync(path.join(dir, "package.json"))) {
          let packageJson;
          try {
            packageJson = JSON.parse(
              fs.readFileSync(path.join(dir, "package.json"), "utf8")
            );
          } catch (e) {
            // Swallow, if we can't read it we don't want to resolve based on it
          }

          if (
            packageJson &&
            ((packageJson.dependencies && packageJson.dependencies[pkgName]) ||
              (packageJson.devDependencies &&
                packageJson.devDependencies[pkgName]))
          ) {
            return dir;
          }
        }

        if (this.isInternalTestRoot(dir)) {
          return findUp.stop;
        }
      },
      { cwd: finalPath, type: "directory" }
    );

    if (packageJsonResDir) {
      const packagePath = resolve.sync(pkgName, { basedir: packageJsonResDir });
      updateWorkspaceState(stateKey, packagePath);
      return packagePath;
    }

    // If no explicit package.json dep found, instead look for implicit dep
    const nodeModulesResDir = findUp.sync(
      (dir) => {
        if (fs.existsSync(path.join(dir, "node_modules", pkgName))) {
          return dir;
        }

        if (this.isInternalTestRoot(dir)) {
          return findUp.stop;
        }
      },
      { cwd: finalPath, type: "directory" }
    );

    if (nodeModulesResDir) {
      const packagePath = resolve.sync(pkgName, { basedir: nodeModulesResDir });
      updateWorkspaceState(stateKey, packagePath);
      return packagePath;
    }

    return;
  }
}
