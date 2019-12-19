import { execSync } from "child_process";
import * as fs from "fs";
import * as mem from "mem";
import * as path from "path";
import * as prettier from "prettier";
import * as readPkgUp from "read-pkg-up";
import * as resolve from "resolve";
import * as semver from "semver";
// tslint:disable-next-line: no-implicit-dependencies
import { Disposable } from "vscode";
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

const globalPaths: {
  [key: string]: { cache: string | undefined; get(): string | undefined };
} = {
  npm: {
    cache: undefined,
    get(): string | undefined {
      return resolveGlobalNodePath();
    }
  },
  pnpm: {
    cache: undefined,
    get(): string {
      const pnpmPath = execSync("pnpm root -g")
        .toString()
        .trim();
      return pnpmPath;
    }
  },
  yarn: {
    cache: undefined,
    get(): string | undefined {
      return resolveGlobalYarnPath();
    }
  }
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
      cacheKey: args => `${args[0]}:${args[1]}`
    });
  }

  /**
   * Returns an instance of the prettier module.
   * @param fileName The path of the file to use as the starting point. If none provided, the bundled prettier will be used.
   */
  public getPrettierInstance(
    fileName?: string,
    isUserInteractive: boolean = false
  ): PrettierModule {
    if (!fileName) {
      return prettier;
    }

    const { prettierPath, packageManager, resolveGlobalModules } = getConfig();

    // tslint:disable-next-line: prefer-const
    let { moduleInstance, modulePath } = this.requireLocalPkg<PrettierModule>(
      fileName,
      "prettier",
      prettierPath
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

    if (!moduleInstance && isUserInteractive) {
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
        if (isUserInteractive) {
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
    this.resolvedModules.forEach(modulePath => {
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
    modulePath?: string
  ): ModuleResult<T> {
    try {
      modulePath = modulePath
        ? getWorkspaceRelativePath(fsPath, modulePath)
        : this.findPkgMem(fsPath, pkgName);

      if (modulePath !== void 0) {
        const moduleInstance = this.loadNodeModule(modulePath);
        if (this.resolvedModules.indexOf(modulePath) === -1) {
          this.resolvedModules.push(modulePath);
        }
        this.loggingService.logInfo(
          `Loaded module '${pkgName}@${moduleInstance.version ??
            "unknown"}' from '${modulePath}'`
        );
        return { moduleInstance, modulePath };
      }
    } catch (error) {
      this.loggingService.logError(
        `Failed to load ${pkgName} from '${modulePath}'`,
        error
      );
      this.notificationService.showErrorMessage(FAILED_TO_LOAD_MODULE_MESSAGE, [
        `Attempted to load ${pkgName} from ${modulePath || "package.json"}`
      ]);
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
            `Loaded module '${pkgName}@${moduleInstance.version ??
              "unknown"}' from '${modulePath}'`
          );
          return { moduleInstance, modulePath };
        }
      } catch (error) {
        this.loggingService.logError(
          `Failed to load ${pkgName} from '${modulePath}'`,
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
   * Recursively search for a package.json upwards containing given package
   * as a dependency or devDependency.
   * @param {string} fsPath file system path to start searching from
   * @param {string} pkgName package's name to search for
   * @returns {string} resolved path to module
   */
  private findPkg(fsPath: string, pkgName: string): string | undefined {
    // Get the closest `package.json` file, that's outside of any `node_modules`
    // directory.
    const splitPath = fsPath.split("/");
    let finalPath = fsPath;
    const nodeModulesIndex = splitPath.indexOf("node_modules");

    if (nodeModulesIndex > 1) {
      finalPath = splitPath.slice(0, nodeModulesIndex).join("/");
    }

    const res = readPkgUp.sync({ cwd: finalPath, normalize: false });
    const { root } = path.parse(finalPath);

    if (
      res &&
      res.packageJson &&
      ((res.packageJson.dependencies &&
        res.packageJson.dependencies[pkgName]) ||
        (res.packageJson.devDependencies &&
          res.packageJson.devDependencies[pkgName]))
    ) {
      return resolve.sync(pkgName, { basedir: res.path });
    } else if (res && res.path) {
      const parent = path.resolve(path.dirname(res.path), "..");
      if (parent !== root) {
        return this.findPkg(parent, pkgName);
      }
    }
    return;
  }
}
