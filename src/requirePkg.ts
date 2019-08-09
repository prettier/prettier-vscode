import * as path from 'path';
import * as resolve from 'resolve';
import { addToOutput } from './errorHandler';
const readPkgUp = require('read-pkg-up');

/**
 * Recursively search for a `package.json` upwards containing given package as a dependency or devDependency.
 * @param fspath file system path to start searching from
 * @param pkgName package's name to search for
 * @returns resolved path to prettier
 */
function findPkg(fspath: string, pkgName: string): string | undefined {
  const res = readPkgUp.sync({ cwd: fspath, normalize: false });
  const { root } = path.parse(fspath);

  if (
    res.pkg &&
    ((res.pkg.dependencies && res.pkg.dependencies[pkgName]) ||
      (res.pkg.devDependencies && res.pkg.devDependencies[pkgName]))
  ) {
    return resolve.sync(pkgName, { basedir: res.path });
  }

  if (res.path) {
    const parent = path.resolve(path.dirname(res.path), '..');
    if (parent !== root) {
      return findPkg(parent, pkgName);
    }
  }
}

/**
 * Require package explicitly installed relative to given path.
 * Fallback to bundled one if no pacakge was found bottom up.
 * @param fspath file system path starting point to resolve package
 * @param pkgName package's name to require
 * @returns module
 */
export function requireLocalPkg(fspath: string, pkgName: string): any {
  try {
    const modulePath = findPkg(fspath, pkgName);
    if (modulePath) {
      return require(modulePath);
    }
  } catch (e) {
    addToOutput(`Failed to load local ${pkgName}. Using bundled version.`);
  }
  return require(pkgName);
}
