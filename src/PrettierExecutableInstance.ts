import { spawn } from "child_process";
import type { FileInfoOptions, Options, ResolveConfigOptions } from "prettier";
import type {
  PrettierFileInfoResult,
  PrettierPlugin,
  PrettierSupportLanguage,
  PrettierInstance,
} from "./types.js";

/**
 * Prettier instance that executes Prettier through a custom executable command.
 * This is useful for Docker-centric workspaces where Prettier runs inside a container.
 */
export class PrettierExecutableInstance implements PrettierInstance {
    public version: string | null = null;

    constructor(
      private customExecutable: string,
      private prettierPath: string,
    ) {}

    public async import(): Promise<string> {
      // Get Prettier version by executing it with --version flag
      const versionCommand = this.buildCommand("--version", "");
      try {
        const stdout = await this.executeCommand(versionCommand);
        this.version = stdout.trim();
        return this.version;
      } catch (error) {
        throw new Error(
          `Failed to get Prettier version using custom executable: ${error}`,
        );
      }
    }

    public async format(
      source: string,
      options?: Options | undefined,
    ): Promise<string> {
      if (!this.version) {
        await this.import();
      }

      // Build the command with options
      const args = this.buildOptionsArgs(options);
      const command = this.buildCommand(args, "");

      try {
        return await this.executeCommand(command, source);
      } catch (error) {
        throw new Error(`Prettier formatting failed: ${error}`);
      }
    }

    public async getFileInfo(
      filePath: string,
      fileInfoOptions?: FileInfoOptions | undefined,
    ): Promise<PrettierFileInfoResult> {
      if (!this.version) {
        await this.import();
      }

      const args = ["--file-info", this.escapeArg(filePath)];

      if (fileInfoOptions?.ignorePath) {
        const ignorePath =
          typeof fileInfoOptions.ignorePath === "string"
            ? fileInfoOptions.ignorePath
            : fileInfoOptions.ignorePath.toString();
        args.push("--ignore-path", this.escapeArg(ignorePath));
      }

      if (fileInfoOptions?.withNodeModules) {
        args.push("--with-node-modules");
      }

      if (fileInfoOptions?.plugins) {
        for (const plugin of fileInfoOptions.plugins) {
          if (typeof plugin === "string") {
            args.push("--plugin", this.escapeArg(plugin));
          }
        }
      }

      const command = this.buildCommand(args.join(" "), "");

      try {
        const stdout = await this.executeCommand(command);
        return JSON.parse(stdout) as PrettierFileInfoResult;
      } catch (error) {
        throw new Error(`Failed to get file info: ${error}`);
      }
    }

    public async getSupportInfo({
      plugins,
    }: {
      plugins: (string | PrettierPlugin)[];
    }): Promise<{
      languages: PrettierSupportLanguage[];
    }> {
      if (!this.version) {
        await this.import();
      }

      const args = ["--support-info"];

      for (const plugin of plugins) {
        if (typeof plugin === "string") {
          args.push("--plugin", this.escapeArg(plugin));
        }
      }

      const command = this.buildCommand(args.join(" "), "");

      try {
        const stdout = await this.executeCommand(command);
        return JSON.parse(stdout) as { languages: PrettierSupportLanguage[] };
      } catch (error) {
        throw new Error(`Failed to get support info: ${error}`);
      }
    }

    public async clearConfigCache(): Promise<void> {
      // Custom executables don't maintain a config cache in the extension
      // The cache would be on the Prettier side, which we can't directly clear
      return;
    }

    public async resolveConfigFile(
      filePath?: string | undefined,
    ): Promise<string | null> {
      if (!this.version) {
        await this.import();
      }

      const args = ["--find-config-path"];
      if (filePath) {
        args.push(this.escapeArg(filePath));
      }

      const command = this.buildCommand(args.join(" "), "");

      try {
        const stdout = await this.executeCommand(command);
        const result = stdout.trim();
        return result === "" || result === "null" ? null : result;
      } catch {
        return null;
      }
    }

    public async resolveConfig(
      fileName: string,
      options?: ResolveConfigOptions | undefined,
    ): Promise<Options | null> {
      if (!this.version) {
        await this.import();
      }

      const args = ["--resolve-config", this.escapeArg(fileName)];

      if (options?.config) {
        const config =
          typeof options.config === "string"
            ? options.config
            : options.config.toString();
        args.unshift("--config", this.escapeArg(config));
      }

      if (options?.editorconfig === false) {
        args.push("--no-editorconfig");
      }

      const command = this.buildCommand(args.join(" "), "");

      try {
        const stdout = await this.executeCommand(command);
        const result = stdout.trim();
        return result === "" || result === "null"
          ? null
          : (JSON.parse(result) as Options);
      } catch {
        return null;
      }
    }

    private executeCommand(
      command: string,
      stdin?: string,
    ): Promise<string> {
      return new Promise((resolve, reject) => {
        // Execute the full command through shell
        const child = spawn(command, {
          shell: true,
        });

        let stdout = "";
        let stderr = "";

        child.stdout.on("data", (data) => {
          stdout += data.toString();
        });

        child.stderr.on("data", (data) => {
          stderr += data.toString();
        });

        child.on("error", (error) => {
          reject(new Error(`Failed to execute command: ${error.message}`));
        });

        child.on("close", (code) => {
          if (code !== 0) {
            reject(
              new Error(
                `Command exited with code ${code}. stderr: ${stderr}`,
              ),
            );
          } else {
            resolve(stdout);
          }
        });

        // Write stdin if provided
        if (stdin) {
          child.stdin.write(stdin);
        }
        child.stdin.end();
      });
    }

    private buildCommand(args: string, _filePath: string): string {
      // Replace placeholders in the custom executable command
      // ${prettier} = path to prettier (optional placeholder)
      let command = this.customExecutable;

      // Escape prettierPath to prevent command injection
      const escapedPrettierPath = this.escapeArg(this.prettierPath);

      // If no ${prettier} placeholder exists, append it to the command
      if (!command.includes("${prettier}")) {
        command = `${command} ${escapedPrettierPath}`;
      } else {
        command = command.replace(/\$\{prettier\}/g, escapedPrettierPath);
      }

      // Add arguments (these are already escaped in buildOptionsArgs or other methods)
      if (args) {
        command = `${command} ${args}`;
      }

      return command;
    }

    private buildOptionsArgs(options?: Options): string {
      if (!options) {
        return "--stdin-filepath dummy.js";
      }

      const args: string[] = [];

      // Required for stdin formatting
      if (options.filepath) {
        args.push("--stdin-filepath", this.escapeArg(options.filepath));
      } else {
        args.push("--stdin-filepath", "dummy.js");
      }

      if (options.parser) {
        args.push("--parser", this.escapeArg(options.parser as string));
      }

      if (options.plugins && Array.isArray(options.plugins)) {
        for (const plugin of options.plugins) {
          if (typeof plugin === "string") {
            args.push("--plugin", this.escapeArg(plugin));
          }
        }
      }

      // Add common formatting options
      if (options.printWidth !== undefined) {
        args.push("--print-width", String(options.printWidth));
      }
      if (options.tabWidth !== undefined) {
        args.push("--tab-width", String(options.tabWidth));
      }
      if (options.useTabs !== undefined) {
        args.push(options.useTabs ? "--use-tabs" : "--no-use-tabs");
      }
      if (options.semi !== undefined) {
        args.push(options.semi ? "--semi" : "--no-semi");
      }
      if (options.singleQuote !== undefined) {
        args.push(
          options.singleQuote ? "--single-quote" : "--no-single-quote",
        );
      }
      if (options.quoteProps) {
        args.push("--quote-props", this.escapeArg(options.quoteProps));
      }
      if (options.jsxSingleQuote !== undefined) {
        args.push(
          options.jsxSingleQuote ? "--jsx-single-quote" : "--no-jsx-single-quote",
        );
      }
      if (options.trailingComma) {
        args.push("--trailing-comma", this.escapeArg(options.trailingComma));
      }
      if (options.bracketSpacing !== undefined) {
        args.push(
          options.bracketSpacing ? "--bracket-spacing" : "--no-bracket-spacing",
        );
      }
      if (options.bracketSameLine !== undefined) {
        args.push(
          options.bracketSameLine
            ? "--bracket-same-line"
            : "--no-bracket-same-line",
        );
      }
      if (options.arrowParens) {
        args.push("--arrow-parens", this.escapeArg(options.arrowParens));
      }
      if (options.proseWrap) {
        args.push("--prose-wrap", this.escapeArg(options.proseWrap));
      }
      if (options.htmlWhitespaceSensitivity) {
        args.push(
          "--html-whitespace-sensitivity",
          this.escapeArg(options.htmlWhitespaceSensitivity),
        );
      }
      if (options.endOfLine) {
        args.push("--end-of-line", this.escapeArg(options.endOfLine));
      }
      if (options.embeddedLanguageFormatting) {
        args.push(
          "--embedded-language-formatting",
          this.escapeArg(options.embeddedLanguageFormatting),
        );
      }

      // Range formatting
      if (options.rangeStart !== undefined) {
        args.push("--range-start", String(options.rangeStart));
      }
      if (options.rangeEnd !== undefined) {
        args.push("--range-end", String(options.rangeEnd));
      }

      return args.join(" ");
    }

    private escapeArg(arg: string): string {
      // Escape arguments for shell execution to prevent command injection
      // Use single quotes for maximum safety, and escape any single quotes in the arg
      // This prevents shell interpretation of special characters
      // Replace single quotes with '\'' (end quote, escaped quote, start quote)
      return `'${arg.replace(/'/g, "'\\''")}'`;
    }
}
