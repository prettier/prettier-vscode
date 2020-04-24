import { execSync } from "child_process";
import * as findUp from "find-up";
import * as fs from "fs";
import * as mem from "mem";
import * as path from "path";
import * as prettier from "prettier";
import * as resolve from "resolve";
import * as semver from "semver";
// tslint:disable-next-line: no-implicit-dependencies
import { Disposable, Uri } from "vscode";
import { resolveGlobalNodePath, resolveGlobalYarnPath } from "./Files";
import { LoggingService } from "./LoggingService";
import { FAILED_TO_LOAD_MODULE_MESSAGE } from "./message";
import { NotificationService } from "./NotificationService";
import { PackageManagers, PrettierModule } from "./types";
import { getConfig, getWorkspaceRelativePath } from "./util";

const minPrettierVersion = "1.13.0";
declare const __webpack_require__: typeof require;
declare const __non_webpack_require__: typeof require;

interface ModuleResult<T> {
  moduleInstance: T | undefined;
  modulePath: string | undefined;
}

interface ModuleResolutionOptions {
  showNotifications: boolean;
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
  private findPkgMem: (fsPath: string, pkgName: string) => string | undefined;
  private resolvedModules = new Array<string>();

  constructor(
    private loggingService: LoggingService,
    private notificationService: NotificationService
  ) {
    this.findPkgMem = mem(this.findPkg, {
      cacheKey: (args) => `${args[0]}:${args[1]}`,
    });
  }

  /**
   * Returns an instance of the prettier module.
   * @param fileName The path of the file to use as the starting point. If none provided, the bundled prettier will be used.
   */
  public getPrettierInstance(
    fileName?: string,
    options?: ModuleResolutionOptions
  ): PrettierModule {
    if (!fileName) {
      return prettier;
    }

    const { prettierPath, packageManager, resolveGlobalModules } = getConfig(
      Uri.file(fileName)
    );

    // tslint:disable-next-line: prefer-const
    let { moduleInstance, modulePath } = this.requireLocalPkg<PrettierModule>(
      fileName,
      "prettier",
      prettierPath,
      options
    );

    if (resolveGlobalModules && !moduleInstance) {
      const globalModuleResult = this.requireGlobalPkg<PrettierModule>(
        packageManager,
        "prettier"
      );
      if (
        globalModuleResult?.moduleInstance &&
        globalModuleResult?.modulePath
      ) {
        moduleInstance = globalModuleResult.moduleInstance;
        modulePath = globalModuleResult.modulePath;
      }
    }

    if (!moduleInstance && options?.showNotifications) {
      this.loggingService.logInfo("Using bundled version of prettier.");
    }

    if (moduleInstance) {
      const isValidVersion =
        moduleInstance.version &&
        !!moduleInstance.getSupportInfo &&
        !!moduleInstance.getFileInfo &&
        !!moduleInstance.resolveConfig &&
        semver.gte(moduleInstance.version, minPrettierVersion);

      if (!isValidVersion) {
        if (options?.showNotifications) {
          // We only prompt when formatting a file. If we did it on load there
          // could be lots of these notifications which would be annoying.
          this.notificationService.warnOutdatedPrettierVersion(modulePath);
        }
        this.loggingService.logError(
          "Outdated version of prettier installed. Falling back to bundled version of prettier."
        );
        // Invalid version, force bundled
        moduleInstance = undefined;
      }
    }

    return moduleInstance || prettier;
  }

  public getModuleInstance(fsPath: string, pkgName: string): any {
    let { moduleInstance } = this.requireLocalPkg<any>(fsPath, pkgName);

    const { packageManager, resolveGlobalModules } = getConfig();
    if (resolveGlobalModules && !moduleInstance) {
      const globalModuleResult = this.requireGlobalPkg<PrettierModule>(
        packageManager,
        pkgName
      );
      if (globalModuleResult?.moduleInstance) {
        moduleInstance = globalModuleResult.moduleInstance;
      }
    }
    return moduleInstance;
  }

  /**
   * Clears the module and config cache
   */
  public dispose() {
    this.getPrettierInstance().clearConfigCache();
    this.resolvedModules.forEach((modulePath) => {
      const r =
        typeof __webpack_require__ === "function"
          ? __non_webpack_require__
          : require;
      try {
        const mod: any = r.cache[r.resolve(modulePath)];
        mod?.exports?.clearConfigCache();
        delete r.cache[r.resolve(modulePath)];
      } catch (error) {
        this.loggingService.logError("Error clearing module cache.", error);
      }
    });
  }

  /**
   * Require package explicitly installed relative to given path.
   * Fallback to bundled one if no package was found bottom up.
   * @param {string} fsPath file system path starting point to resolve package
   * @param {string} pkgName package's name to require
   * @returns module
   */
  private requireLocalPkg<T>(
    fsPath: string,
    pkgName: string,
    modulePath?: string,
    options?: ModuleResolutionOptions
  ): ModuleResult<T> {
    if (modulePath === "") {
      modulePath = undefined;
    }

    try {
      modulePath = modulePath
        ? getWorkspaceRelativePath(fsPath, modulePath)
        : this.findPkgMem(fsPath, pkgName);

      if (modulePath !== undefined) {
        const moduleInstance = this.loadNodeModule(modulePath);
        if (this.resolvedModules.indexOf(modulePath) === -1) {
          this.resolvedModules.push(modulePath);
        }
        this.loggingService.logInfo(
          `Loaded module '${pkgName}@${
            moduleInstance.version ?? "unknown"
          }' from '${modulePath}'`
        );
        return { moduleInstance, modulePath };
      }
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

      this.loggingService.logError(
        `Failed to load local module ${pkgName}.`,
        error
      );

      if (options?.showNotifications) {
        this.notificationService.showErrorMessage(
          FAILED_TO_LOAD_MODULE_MESSAGE,
          [
            `Attempted to load ${pkgName} from ${
              modulePath || moduleDirectory || "package.json"
            }`,
          ]
        );
      }
    }
    return { moduleInstance: undefined, modulePath };
  }

  private requireGlobalPkg<T>(
    packageManager: PackageManagers,
    pkgName: string
  ): ModuleResult<T> {
    const resolvedGlobalPackageManagerPath = globalPathGet(packageManager);
    if (resolvedGlobalPackageManagerPath) {
      const modulePath = path.join(resolvedGlobalPackageManagerPath, pkgName);
      try {
        if (fs.existsSync(modulePath)) {
          const moduleInstance = this.loadNodeModule(modulePath);
          if (this.resolvedModules.indexOf(modulePath) === -1) {
            this.resolvedModules.push(modulePath);
          }
          this.loggingService.logInfo(
            `Loaded module '${pkgName}@${
              moduleInstance.version ?? "unknown"
            }' from '${modulePath}'`
          );
          return { moduleInstance, modulePath };
        }
      } catch (error) {
        this.loggingService.logError(
          `Failed to load global module ${pkgName}.`,
          error
        );
        return { moduleInstance: undefined, modulePath };
      }
    }
    return { moduleInstance: undefined, modulePath: undefined };
  }

  // Source: https://github.com/microsoft/vscode-eslint/blob/master/server/src/eslintServer.ts#L209
  private loadNodeModule(moduleName: string): any | undefined {
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

  /**
   * Recursively search upwards for a given module definition based on
   * package.json or node_modules existence
   * @param {string} fsPath file system path to start searching from
   * @param {string} pkgName package's name to search for
   * @returns {string} resolved path to module
   */
  private findPkg(fsPath: string, pkgName: string): string | undefined {
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

        if (fs.existsSync(path.join(dir, ".prettier-vscode-root"))) {
          return findUp.stop;
        }
      },
      { cwd: finalPath, type: "directory" }
    );

    if (packageJsonResDir) {
      return resolve.sync(pkgName, { basedir: packageJsonResDir });
    }

    // If no explicit package.json dep found, instead look for implicit dep
    const nodeModulesResDir = findUp.sync(
      (dir) => {
        if (fs.existsSync(path.join(dir, "node_modules", pkgName))) {
          return dir;
        }

        if (process.env.NODE_ENV !== "production") {
          // This is for testing purposes only. This code is removed in the
          // shipped version of this extension so do not use this in your
          // project. It won't work.
          if (
            fs.existsSync(path.join(dir, ".do-not-use-prettier-vscode-root"))
          ) {
            return findUp.stop;
          }
        }
      },
      { cwd: finalPath, type: "directory" }
    );

    if (nodeModulesResDir) {
      return resolve.sync(pkgName, { basedir: nodeModulesResDir });
    }

    return;
  }
}
