const path = require('path');
const readPkgUp = require('read-pkg-up');

interface Prettier {
    format: (string, PrettierConfig?) => string;
    readonly version: string;
}
/**
 * Recursively search for a package.json upwards containing prettier 
 * as a dependency or devDependency.
 * @param {string} fspath file system path to start searching from
 * @returns {string} resolved path to prettier
 */
function readFromPkg(fspath: string): string | undefined {
    const res = readPkgUp.sync({ cwd: fspath })
    if (res.pkg && (
        (res.pkg.dependencies && res.pkg.dependencies.prettier)
        || (res.pkg.devDependencies && res.pkg.devDependencies.prettier)
    )) {
        return path.resolve(res.path, '..', 'node_modules/prettier');
    } else if (res.path) {
        return readFromPkg(path.resolve(path.dirname(res.path), '..'));
    }
}

/**
 * Require 'prettier' explicitely installed relative to given path.
 * Fallback to packaged one if no prettier was found bottom up.
 * @param {string} fspath file system path starting point to resolve 'prettier'
 * @returns {Prettier} prettier
 */
function requirePrettier(fspath: string): Prettier {
    const prettierPath = readFromPkg(fspath);
    if (prettierPath !== void 0) {
        const resolvedPrettier: Prettier = require(prettierPath);
        console.log("Using prettier", resolvedPrettier.version, "from", prettierPath);
        return resolvedPrettier;
    }
    return require('prettier');
}
export default requirePrettier;
