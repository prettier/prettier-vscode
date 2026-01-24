import * as path from "path";
import { pathToFileURL } from "url";
import type { FileInfoOptions, Options, ResolveConfigOptions } from "prettier";
import type {
  PrettierFileInfoResult,
  PrettierPlugin,
  PrettierSupportLanguage,
  PrettierInstance,
  PrettierInstanceConstructor,
} from "./types.js";
import type { PrettierNodeModule } from "./ModuleResolverNode.js";
import { resolveModuleEntry } from "./utils/resolve-module-entry.js";

/**
 * Unified Prettier instance that uses native ESM dynamic import().
 * Works with both Prettier v2 and v3+ since we're now an ESM module.
 */
export const PrettierDynamicInstance: PrettierInstanceConstructor = class PrettierDynamicInstance implements PrettierInstance {
  public version: string | null = null;
  private prettierModule: PrettierNodeModule | undefined;

  constructor(private modulePath: string) {}

  public async import(): Promise</* version of imported prettier */ string> {
    // Resolve to actual entry file since ESM doesn't support directory imports
    // modulePath is like /path/to/node_modules/prettier, resolve "prettier" from there
    const entryPath = resolveModuleEntry(
      this.modulePath,
      path.basename(this.modulePath),
    );
    const moduleUrl = pathToFileURL(entryPath).href;
    const imported = await import(moduleUrl);
    // Handle both ESM (Prettier v3+) and CJS (Prettier v2) modules
    // CJS modules imported via ESM have their exports on the default property
    this.prettierModule = (
      imported.default?.version ? imported.default : imported
    ) as PrettierNodeModule;
    this.version = this.prettierModule?.version ?? null;
    if (this.version == null) {
      throw new Error(`Failed to load Prettier instance: ${this.modulePath}`);
    }
    return this.version;
  }

  public async format(
    source: string,
    options?: Options | undefined,
  ): Promise<string> {
    if (!this.prettierModule) {
      await this.import();
    }
    return this.prettierModule!.format(source, options);
  }

  public async getFileInfo(
    filePath: string,
    fileInfoOptions?: FileInfoOptions | undefined,
  ): Promise<PrettierFileInfoResult> {
    if (!this.prettierModule) {
      await this.import();
    }
    return this.prettierModule!.getFileInfo(filePath, fileInfoOptions);
  }

  public async getSupportInfo({
    plugins,
  }: {
    plugins: (string | PrettierPlugin)[];
  }): Promise<{
    languages: PrettierSupportLanguage[];
  }> {
    if (!this.prettierModule) {
      await this.import();
    }
    return this.prettierModule!.getSupportInfo({ plugins });
  }

  public async clearConfigCache(): Promise<void> {
    if (!this.prettierModule) {
      await this.import();
    }
    return this.prettierModule!.clearConfigCache();
  }

  public async resolveConfigFile(
    filePath?: string | undefined,
  ): Promise<string | null> {
    if (!this.prettierModule) {
      await this.import();
    }
    return this.prettierModule!.resolveConfigFile(filePath);
  }

  public async resolveConfig(
    fileName: string,
    options?: ResolveConfigOptions | undefined,
  ): Promise<Options | null> {
    if (!this.prettierModule) {
      await this.import();
    }
    return this.prettierModule!.resolveConfig(fileName, options);
  }
};
