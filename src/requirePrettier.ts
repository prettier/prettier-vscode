const path = require('path');
const Module = require('module');

interface Prettier {
    format: (string, PrettierConfig?) => string;
    readonly version: string;
}

/**
 * Require 'prettier' relative to given path.
 * Fallback to packaged one if no prettier was found bottom up.
 * @param {string} fspath file system path starting point to resolve 'prettier'
 * @returns {Prettier} prettier
 */
function requirePrettier(fspath: string): Prettier {
    const fileModule = new Module(fspath);
    fileModule.paths = Module._nodeModulePaths(path.join(fspath, '..'));
    try {
        return fileModule.require('prettier');
    } catch (e) {
        // No local prettier found
    }
    return require('prettier');
}
export default requirePrettier;
