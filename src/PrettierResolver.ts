import * as path from "path";
import * as prettier from "prettier";
import * as readPkgUp from "read-pkg-up";
import * as resolve from "resolve";
import { addToOutput } from "./errorHandler";
import { PrettierModule } from "./types.d";

/**
 * Recursively search for a package.json upwards containing given package
 * as a dependency or devDependency.
 * @param {string} fspath file system path to start searching from
 * @param {string} pkgName package's name to search for
 * @returns {string} resolved path to prettier
 */
function findPkg(fspath: string, pkgName: string): string | undefined {
  const res = readPkgUp.sync({ cwd: fspath, normalize: false });
  const { root } = path.parse(fspath);
  if (
    res &&
    res.packageJson &&
    ((res.packageJson.dependencies && res.packageJson.dependencies[pkgName]) ||
      (res.packageJson.devDependencies &&
        res.packageJson.devDependencies[pkgName]))
  ) {
    return resolve.sync(pkgName, { basedir: res.path });
  } else if (res && res.path) {
    const parent = path.resolve(path.dirname(res.path), "..");
    if (parent !== root) {
      return findPkg(parent, pkgName);
    }
  }
  return;
}

/**
 * Require package explicitly installed relative to given path.
 * Fallback to bundled one if no pacakge was found bottom up.
 * @param {string} fspath file system path starting point to resolve package
 * @param {string} pkgName package's name to require
 * @returns module
 */
function requireLocalPkg(fspath: string, pkgName: string): any {
  let modulePath;
  try {
    modulePath = findPkg(fspath, pkgName);
    if (modulePath !== void 0) {
      return require(modulePath);
    }
  } catch (e) {
    addToOutput(`Failed to load ${pkgName} from ${modulePath}. Using bundled.`);
  }

  return require(pkgName);
}

export class PrettierResolver {
  // public static setInstancePath(instancePath: string) {
  //   PrettierResolver.instancePath = instancePath;
  // }

  // public static clearInstanceCache() {
  //   PrettierResolver.instancePath = undefined;
  //   PrettierResolver.instance = undefined;
  // }

  public static getPrettierInstance(instancePath?: string): PrettierModule {
    if (PrettierResolver.instance) {
      return PrettierResolver.instance;
    }

    const prettierInstance: PrettierModule = instancePath
      ? requireLocalPkg(instancePath, "prettier")
      : prettier;

    return prettierInstance;
  }

  private static instance: PrettierModule | undefined;
  // private static instancePath: string | undefined;
}
