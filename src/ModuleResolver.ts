import * as path from "path";
import * as prettier from "prettier";
import * as readPkgUp from "read-pkg-up";
import * as resolve from "resolve";
import { LoggingService } from "./LoggingService";
import { PrettierModule } from "./types";

export class ModuleResolver {
  constructor(private loggingService: LoggingService) {}

  public getPrettierInstance(fileName?: string): PrettierModule {
    if (!fileName) {
      this.loggingService.appendLine(
        "No path provided, using bundled prettier.",
        "INFO"
      );
      return prettier;
    }

    const prettierInstance: PrettierModule = this.requireLocalPkg(
      fileName,
      "prettier"
    );

    if (!prettierInstance) {
      this.loggingService.appendLine(
        "Falling back to bundled version of prettier.",
        "WARN"
      );
    }

    return prettierInstance || prettier;
  }

  /**
   * Require package explicitly installed relative to given path.
   * Fallback to bundled one if no pacakge was found bottom up.
   * @param {string} fspath file system path starting point to resolve package
   * @param {string} pkgName package's name to require
   * @returns module
   */
  public requireLocalPkg(fspath: string, pkgName: string): any {
    let modulePath;
    try {
      modulePath = this.findPkg(fspath, pkgName);
      if (modulePath !== void 0) {
        this.loggingService.appendLine(
          `Loaded module '${pkgName}' from '${modulePath}'.`,
          "INFO"
        );
        return require(modulePath);
      }
    } catch (e) {
      this.loggingService.appendLine(
        `Failed to load ${pkgName} from ${modulePath}.`,
        "INFO"
      );
    }
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
