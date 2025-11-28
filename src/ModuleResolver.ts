import { execSync } from "child_process";
import * as findUp from "find-up";
import * as fs from "fs";
import * as path from "path";
import * as prettier from "prettier";
import * as resolve from "resolve";
import * as semver from "semver";
import { commands, TextDocument, Uri, workspace } from "vscode";
import {
  resolveGlobalNodePath,
  resolveGlobalYarnPath,
} from "./utils/global-node-paths";
import { LoggingService } from "./LoggingService";
import {
  FAILED_TO_LOAD_MODULE_MESSAGE,
  INVALID_PRETTIER_CONFIG,
  INVALID_PRETTIER_PATH_MESSAGE,
  OUTDATED_PRETTIER_VERSION_MESSAGE,
  UNTRUSTED_WORKSPACE_USING_BUNDLED_PRETTIER,
  USING_BUNDLED_PRETTIER,
} from "./message";
import {
  ModuleResolverInterface,
  PackageManagers,
  PrettierOptions,
  PrettierResolveConfigOptions,
  PrettierVSCodeConfig,
} from "./types";
import {
  getWorkspaceConfig,
  getWorkspaceRelativePath,
} from "./utils/workspace";
import { PrettierInstance } from "./PrettierInstance";
import { PrettierWorkerInstance } from "./PrettierWorkerInstance";
import { PrettierMainThreadInstance } from "./PrettierMainThreadInstance";
import { resolveConfigPlugins } from "./utils/resolve-config-plugins";
import { isAboveV3 } from "./utils/versions";
import { loadNodeModule } from "./ModuleLoader";

const minPrettierVersion = "1.13.0";

export type PrettierNodeModule = typeof prettier;

type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

// Workaround for https://github.com/prettier/prettier-vscode/issues/3020
// Use require() to get a mutable fs module reference and override statSync
// eslint-disable-next-line @typescript-eslint/no-var-requires
const mutableFs: Mutable<typeof import("fs")> = require("fs");
const origFsStatSync = fs.statSync;
const fsStatSyncWorkaround = (
  filePath: fs.PathLike,
  options: fs.StatSyncOptions,
) => {
  if (
    options?.throwIfNoEntry === true ||
    options?.throwIfNoEntry === undefined
  ) {
    return origFsStatSync(filePath, options);
  }
  options.throwIfNoEntry = true;
  try {
    return origFsStatSync(filePath, options);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return undefined;
    }
    throw error;
  }
};
// Force cast because we return undefined in some cases
// which is not part of the original fs.StatSyncFn return type
// but is necessary for the workaround to function correctly
mutableFs.statSync = fsStatSyncWorkaround as fs.StatSyncFn;

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

export class ModuleResolver implements ModuleResolverInterface {
  private findPkgCache: Map<string, string>;
  private ignorePathCache = new Map<string, string>();

  private path2Module = new Map<string, PrettierInstance>();

  constructor(private loggingService: LoggingService) {
    this.findPkgCache = new Map();
  }

  public getGlobalPrettierInstance(): PrettierNodeModule {
    return prettier;
  }

  private loadPrettierVersionFromPackageJson(modulePath: string): string {
    let cwd = "";
    try {
      fs.readdirSync(modulePath); // checking if dir with readdir will handle directories and symlinks
      cwd = modulePath;
    } catch {
      cwd = path.dirname(modulePath);
    }
    const packageJsonPath = findUp.sync(
      (dir) => {
        const pkgFilePath = path.join(dir, "package.json");
        if (fs.existsSync(pkgFilePath)) {
          return pkgFilePath;
        }
      },
      { cwd },
    );

    if (!packageJsonPath) {
      throw new Error("Cannot find Prettier package.json");
    }

    const prettierPkgJson = loadNodeModule(packageJsonPath) as {
      version?: string;
    } | null;

    let version: string | null = null;

    if (prettierPkgJson && typeof prettierPkgJson.version === "string") {
      version = prettierPkgJson.version;
    }

    if (!version) {
      throw new Error("Cannot load Prettier version from package.json");
    }

    return version;
  }

  /**
   * Returns an instance of the prettier module.
   * @param fileName The path of the file to use as the starting point. If none provided, the bundled prettier will be used.
   */
  public async getPrettierInstance(
    fileName: string,
  ): Promise<PrettierNodeModule | PrettierInstance | undefined> {
    if (!workspace.isTrusted) {
      this.loggingService.logDebug(UNTRUSTED_WORKSPACE_USING_BUNDLED_PRETTIER);
      return prettier;
    }

    const { prettierPath, resolveGlobalModules } = getWorkspaceConfig(
      Uri.file(fileName),
    );

    // Look for local module
    let modulePath: string | undefined = undefined;

    try {
      modulePath = prettierPath
        ? getWorkspaceRelativePath(fileName, prettierPath)
        : this.findPkg(fileName, "prettier");
    } catch (error) {
      let moduleDirectory = "";
      if (!modulePath && error instanceof Error) {
        // If findPkg threw an error from `resolve.sync`, attempt to parse the
        // directory it failed on to provide a better error message
        const resolveSyncPathRegex = /Cannot find module '.*' from '(.*)'/;
        const resolveErrorMatches = resolveSyncPathRegex.exec(error.message);
        if (resolveErrorMatches && resolveErrorMatches[1]) {
          moduleDirectory = resolveErrorMatches[1];
        }
      }

      this.loggingService.logInfo(
        `Attempted to determine module path from ${
          modulePath || moduleDirectory || "package.json"
        }`,
      );
      this.loggingService.logError(FAILED_TO_LOAD_MODULE_MESSAGE, error);

      // Return here because there is a local module, but we can't resolve it.
      // Must do NPM install for prettier to work.
      return undefined;
    }

    // If global modules allowed, look for global module
    if (resolveGlobalModules && !modulePath) {
      let workspaceFolder;
      if (workspace.workspaceFolders) {
        const folder = workspace.getWorkspaceFolder(Uri.file(fileName));
        if (folder) workspaceFolder = folder.uri;
      }
      const packageManager = (await commands.executeCommand<
        "npm" | "pnpm" | "yarn"
      >("npm.packageManager", workspaceFolder))!;
      const resolvedGlobalPackageManagerPath = globalPathGet(packageManager);
      if (resolvedGlobalPackageManagerPath) {
        const globalModulePath = path.join(
          resolvedGlobalPackageManagerPath,
          "prettier",
        );
        if (fs.existsSync(globalModulePath)) {
          modulePath = globalModulePath;
        }
      }
    }

    let moduleInstance: PrettierInstance | undefined = undefined;

    if (modulePath !== undefined) {
      this.loggingService.logDebug(`Local prettier module path: ${modulePath}`);
      // First check module cache
      moduleInstance = this.path2Module.get(modulePath);
      if (moduleInstance) {
        return moduleInstance;
      } else {
        try {
          const prettierVersion =
            this.loadPrettierVersionFromPackageJson(modulePath);

          const isAboveVersion3 = isAboveV3(prettierVersion);

          if (isAboveVersion3) {
            moduleInstance = new PrettierWorkerInstance(modulePath);
          } else {
            moduleInstance = new PrettierMainThreadInstance(modulePath);
          }
          if (moduleInstance) {
            this.path2Module.set(modulePath, moduleInstance);
          }
        } catch (error) {
          this.loggingService.logInfo(
            `Attempted to load Prettier module from ${
              modulePath || "package.json"
            }`,
          );
          this.loggingService.logError(FAILED_TO_LOAD_MODULE_MESSAGE, error);

          // Returning here because module didn't load.
          return undefined;
        }
      }
    }

    if (moduleInstance) {
      const version = await moduleInstance.import();

      if (!version && prettierPath) {
        this.loggingService.logError(INVALID_PRETTIER_PATH_MESSAGE);
        return undefined;
      }

      const isValidVersion = version && semver.gte(version, minPrettierVersion);

      if (!isValidVersion) {
        this.loggingService.logInfo(
          `Attempted to load Prettier module from ${modulePath}`,
        );
        this.loggingService.logError(OUTDATED_PRETTIER_VERSION_MESSAGE);
        return undefined;
      } else {
        this.loggingService.logDebug(`Using prettier version ${version}`);
      }
      return moduleInstance;
    } else {
      this.loggingService.logDebug(USING_BUNDLED_PRETTIER);
      return prettier;
    }
  }

  public async getResolvedIgnorePath(
    fileName: string,
    ignorePath: string,
  ): Promise<string | undefined> {
    const cacheKey = `${fileName}:${ignorePath}`;
    // cache resolvedIgnorePath because resolving it checks the file system
    let resolvedIgnorePath = this.ignorePathCache.get(cacheKey);
    if (!resolvedIgnorePath) {
      resolvedIgnorePath = getWorkspaceRelativePath(fileName, ignorePath);
      // if multiple different workspace folders contain this same file, we
      // may have chosen one that doesn't actually contain .prettierignore
      if (workspace.workspaceFolders) {
        // all workspace folders that contain the file
        const folders = workspace.workspaceFolders
          .map((folder) => folder.uri.fsPath)
          .filter((folder) => {
            // https://stackoverflow.com/a/45242825
            const relative = path.relative(folder, fileName);
            return (
              relative &&
              !relative.startsWith("..") &&
              !path.isAbsolute(relative)
            );
          })
          // sort folders innermost to outermost
          .sort((a, b) => b.length - a.length);
        for (const folder of folders) {
          const p = path.join(folder, ignorePath);
          if (
            // https://stackoverflow.com/questions/17699599/node-js-check-if-file-exists#comment121041700_57708635
            await fs.promises.stat(p).then(
              () => true,
              () => false,
            )
          ) {
            resolvedIgnorePath = p;
            break;
          }
        }
      }
    }
    if (resolvedIgnorePath) {
      this.ignorePathCache.set(cacheKey, resolvedIgnorePath);
    }
    return resolvedIgnorePath;
  }

  private adjustFileNameForPrettierVersion3_1_1(
    prettierInstance: { version: string | null },
    fileName: string,
  ) {
    if (!prettierInstance.version) {
      return fileName;
    }
    // Avoid https://github.com/prettier/prettier/pull/15363
    const isGte3_1_1 = semver.gte(prettierInstance.version, "3.1.1");
    if (isGte3_1_1) {
      return path.join(fileName, "noop.js");
    }
    return fileName;
  }

  public async resolveConfig(
    prettierInstance: {
      version: string | null;
      resolveConfigFile(filePath?: string): Promise<string | null>;
      resolveConfig(
        fileName: string,
        options?: prettier.ResolveConfigOptions,
      ): Promise<PrettierOptions | null>;
    },
    uri: Uri,
    fileName: string,
    vscodeConfig: PrettierVSCodeConfig,
  ): Promise<"error" | "disabled" | PrettierOptions | null> {
    const isVirtual = uri.scheme !== "file" && uri.scheme !== "vscode-userdata";

    let configPath: string | undefined;
    try {
      if (!isVirtual) {
        configPath =
          (await prettierInstance.resolveConfigFile(
            this.adjustFileNameForPrettierVersion3_1_1(
              prettierInstance,
              fileName,
            ),
          )) ?? undefined;
      }
    } catch (error) {
      this.loggingService.logError(
        `Error resolving prettier configuration for ${fileName}`,
        error,
      );
      return "error";
    }

    const resolveConfigOptions: PrettierResolveConfigOptions = {
      config: isVirtual
        ? undefined
        : vscodeConfig.configPath
          ? getWorkspaceRelativePath(fileName, vscodeConfig.configPath)
          : configPath,
      editorconfig: isVirtual ? undefined : vscodeConfig.useEditorConfig,
    };

    let resolvedConfig: PrettierOptions | null;
    try {
      resolvedConfig = isVirtual
        ? null
        : await prettierInstance.resolveConfig(fileName, resolveConfigOptions);
    } catch (error) {
      this.loggingService.logError(
        "Invalid prettier configuration file detected.",
        error,
      );
      this.loggingService.logError(INVALID_PRETTIER_CONFIG);

      return "error";
    }
    if (resolveConfigOptions.config) {
      this.loggingService.logInfo(
        `Using config file at ${resolveConfigOptions.config}`,
      );
    }

    if (resolvedConfig) {
      resolvedConfig = resolveConfigPlugins(resolvedConfig, fileName);
    }

    if (
      !isVirtual &&
      !vscodeConfig.configPath &&
      !configPath &&
      vscodeConfig.requireConfig
    ) {
      this.loggingService.logInfo(
        "Require config set to true and no config present. Skipping file.",
      );
      return "disabled";
    }

    return resolvedConfig;
  }

  public async getResolvedConfig(
    { fileName, uri }: TextDocument,
    vscodeConfig: PrettierVSCodeConfig,
  ): Promise<"error" | "disabled" | PrettierOptions | null> {
    const prettierInstance: typeof prettier | PrettierInstance =
      (await this.getPrettierInstance(fileName)) || prettier;

    const resolvedConfig = await this.resolveConfig(
      prettierInstance,
      uri,
      fileName,
      vscodeConfig,
    );

    return resolvedConfig;
  }

  /**
   * Clears the module and config cache
   */
  public async dispose() {
    await prettier.clearConfigCache();
    this.path2Module.forEach((module) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        module.clearConfigCache();
      } catch (error) {
        this.loggingService.logError("Error clearing module cache.", error);
      }
    });
    this.path2Module.clear();
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
   * Find a package through transitive dependencies. This is necessary for
   * package managers like pnpm that don't hoist dependencies to the root
   * node_modules. For example, if project A depends on package B, and B
   * depends on prettier, pnpm won't make prettier accessible from A's directory.
   * This method checks each dependency to see if it provides access to the target package.
   *
   * @param {string} startDir Directory to start searching from
   * @param {string} pkgName Package name to search for
   * @returns {string | undefined} Resolved path to the package, or undefined if not found
   */
  private findPkgThroughTransitiveDeps(
    startDir: string,
    pkgName: string,
  ): string | undefined {
    const searchResult = findUp.sync(
      (dir) => {
        const nodeModulesPath = path.join(dir, "node_modules");
        if (!fs.existsSync(nodeModulesPath)) {
          if (this.isInternalTestRoot(dir)) {
            return findUp.stop;
          }
          return;
        }

        // Get list of installed dependencies from node_modules
        let installedDeps: string[];
        try {
          installedDeps = fs.readdirSync(nodeModulesPath).filter((name) => {
            // Skip hidden files and pnpm internal directories
            if (name.startsWith(".")) return false;
            // Check if it's a directory or symlink
            const depPath = path.join(nodeModulesPath, name);
            try {
              const stat = fs.lstatSync(depPath);
              return stat.isDirectory() || stat.isSymbolicLink();
            } catch {
              return false;
            }
          });
        } catch {
          if (this.isInternalTestRoot(dir)) {
            return findUp.stop;
          }
          return;
        }

        // Check each dependency to see if it provides access to the target package
        for (const depName of installedDeps) {
          // Skip scoped packages for now (would need special handling)
          if (depName.startsWith("@")) continue;

          const depPath = path.join(nodeModulesPath, depName);
          try {
            // Get the real path (resolves symlinks)
            const realDepPath = fs.realpathSync(depPath);

            // Try to resolve the target package from within the dependency's directory
            try {
              resolve.sync(pkgName, {
                basedir: realDepPath,
                preserveSymlinks: false,
              });
              // Found! Return this directory
              return dir;
            } catch {
              // This dependency doesn't provide access to the target package
            }
          } catch {
            // Couldn't get real path for this dependency, skip it
          }
        }

        if (this.isInternalTestRoot(dir)) {
          return findUp.stop;
        }
      },
      { cwd: startDir, type: "directory" },
    );

    if (searchResult) {
      // Now we need to find the actual path through the dependency
      const nodeModulesPath = path.join(searchResult, "node_modules");
      const installedDeps = fs.readdirSync(nodeModulesPath).filter((name) => {
        if (name.startsWith(".")) return false;
        const depPath = path.join(nodeModulesPath, name);
        try {
          const stat = fs.lstatSync(depPath);
          return stat.isDirectory() || stat.isSymbolicLink();
        } catch {
          return false;
        }
      });

      for (const depName of installedDeps) {
        if (depName.startsWith("@")) continue;

        const depPath = path.join(nodeModulesPath, depName);
        try {
          const realDepPath = fs.realpathSync(depPath);
          try {
            return resolve.sync(pkgName, {
              basedir: realDepPath,
              preserveSymlinks: false,
            });
          } catch {
            // Continue to next dependency
          }
        } catch {
          // Continue to next dependency
        }
      }
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
    const cacheKey = `${fsPath}:${pkgName}`;
    const packagePathState = this.findPkgCache.get(cacheKey);
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
              fs.readFileSync(path.join(dir, "package.json"), "utf8"),
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
      { cwd: finalPath, type: "directory" },
    );

    if (packageJsonResDir) {
      const packagePath = resolve.sync(pkgName, { basedir: packageJsonResDir });
      this.findPkgCache.set(cacheKey, packagePath);
      return packagePath;
    }

    // If no explicit package.json dep found, try to resolve through transitive
    // dependencies. This handles cases where prettier is a dependency of one of the
    // project's dependencies. This is important for pnpm which doesn't hoist
    // dependencies to the root node_modules.
    const transitiveResult = this.findPkgThroughTransitiveDeps(
      finalPath,
      pkgName,
    );

    if (transitiveResult) {
      this.findPkgCache.set(cacheKey, transitiveResult);
      return transitiveResult;
    }

    // If no transitive dep found, instead look for implicit dep in node_modules
    const nodeModulesResDir = findUp.sync(
      (dir) => {
        if (fs.existsSync(path.join(dir, "node_modules", pkgName))) {
          return dir;
        }

        if (this.isInternalTestRoot(dir)) {
          return findUp.stop;
        }
      },
      { cwd: finalPath, type: "directory" },
    );

    if (nodeModulesResDir) {
      const packagePath = resolve.sync(pkgName, { basedir: nodeModulesResDir });
      this.findPkgCache.set(cacheKey, packagePath);
      return packagePath;
    }

    return;
  }
}
