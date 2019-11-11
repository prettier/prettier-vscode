import * as mem from "mem";
import * as path from "path";
import * as prettier from "prettier";
import * as readPkgUp from "read-pkg-up";
import * as resolve from "resolve";
import * as semver from "semver";
import { LoggingService } from "./LoggingService";
import { NotificationService } from "./NotificationService";
import { PrettierModule } from "./types";
import { getWorkspaceRelativePath } from "./util";

const minPrettierVersion = "1.13.0";
declare const __webpack_require__: typeof require;
declare const __non_webpack_require__: typeof require;

interface ModuleResult {
  moduleInstance: any | undefined;
  modulePath: string | undefined;
}
export class ModuleResolver {
  private findPkgMem: (fspath: string, pkgName: string) => string | undefined;
  private resolvedModules = new Array<string>();
  constructor(
    private loggingService: LoggingService,
    private notificationService: NotificationService
  ) {
    this.findPkgMem = mem(this.findPkg);
  }

  /**
   * Returns an instance of thge prettier module.
   * @param fileName The path of the file to use as the starting point. If none provided, the bundled prettier will be used.
   */
  public getPrettierInstance(
    prettierPath?: string,
    fileName?: string,
    promptIfOutdated: boolean = false
  ): PrettierModule {
    if (!fileName) {
      this.loggingService.logMessage(
        "No path provided, using bundled prettier.",
        "INFO"
      );
      return prettier;
    }

    // tslint:disable-next-line: prefer-const
    let { moduleInstance, modulePath } = this.requireLocalPkg<PrettierModule>(
      fileName,
      "prettier",
      prettierPath
    );

    if (!moduleInstance) {
      this.loggingService.logMessage(
        "Falling back to bundled version of prettier.",
        "WARN"
      );
    }

    if (moduleInstance) {
      const isValidVersion =
        moduleInstance.version &&
        !!moduleInstance.getSupportInfo &&
        !!moduleInstance.getFileInfo &&
        !!moduleInstance.resolveConfig &&
        semver.gte(moduleInstance.version, minPrettierVersion);

      if (!isValidVersion) {
        if (promptIfOutdated) {
          // We only prompt when formatting a file. If we did it on load there
          // could be lots of these notifications which would be annoying.
          this.notificationService.warnOutdatedPrettierVersion(
            moduleInstance,
            modulePath
          );
        }
        this.loggingService.logMessage(
          "Outdated version of prettier installed. Falling back to bundled version of prettier.",
          "ERROR"
        );
        // Invalid version, force bundled
        moduleInstance = undefined;
      }
    }

    return moduleInstance || prettier;
  }

  public getModuleInstance(fspath: string, pkgName: string): any {
    const { moduleInstance } = this.requireLocalPkg<any>(fspath, pkgName);
    return moduleInstance;
  }

  /**
   * Clears the module cache
   */
  public clearModuleCache() {
    this.resolvedModules.forEach(modulePath => {
      const r =
        typeof __webpack_require__ === "function"
          ? __non_webpack_require__
          : require;
      try {
        delete r.cache[r.resolve(modulePath)];
      } catch (error) {
        this.loggingService.logError(error);
      }
    });
  }

  /**
   * Require package explicitly installed relative to given path.
   * Fallback to bundled one if no pacakge was found bottom up.
   * @param {string} fspath file system path starting point to resolve package
   * @param {string} pkgName package's name to require
   * @returns module
   */
  private requireLocalPkg<T>(
    fspath: string,
    pkgName: string,
    modulePath?: string
  ): ModuleResult {
    try {
      modulePath = modulePath
        ? getWorkspaceRelativePath(fspath, modulePath)
        : this.findPkgMem(fspath, pkgName);

      if (modulePath !== void 0) {
        const moduleInstance = this.loadNodeModule(modulePath);
        if (this.resolvedModules.indexOf(modulePath) === -1) {
          this.resolvedModules.push(modulePath);
        }
        this.loggingService.logMessage(
          `Loaded module '${pkgName}@${moduleInstance.version}' from '${modulePath}'.`,
          "INFO"
        );
        return { moduleInstance, modulePath };
      }
    } catch (error) {
      this.loggingService.logMessage(
        `Failed to load ${pkgName} from ${modulePath}.`,
        "INFO"
      );
      this.notificationService.showErrorMessage(
        "ext.config.failedToLoadModule",
        `Failed to load module.`,
        [`Attempted to load ${pkgName} from ${modulePath || "package.json"}.`]
      );
    }
    return { moduleInstance: undefined, modulePath };
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
      this.loggingService.logError(error);
    }
    return undefined;
  }

  /**
   * Recursively search for a package.json upwards containing given package
   * as a dependency or devDependency.
   * @param {string} fspath file system path to start searching from
   * @param {string} pkgName package's name to search for
   * @returns {string} resolved path to module
   */
  private findPkg(fspath: string, pkgName: string): string | undefined {
    const res = readPkgUp.sync({ cwd: fspath, normalize: false });
    const { root } = path.parse(fspath);
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
