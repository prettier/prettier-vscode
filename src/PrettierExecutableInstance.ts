import { execFile, spawn } from "child_process";
import { promisify } from "util";
import { FileInfoOptions, Options, ResolveConfigOptions } from "prettier";
import {
  PrettierInstance,
  PrettierInstanceConstructor,
} from "./PrettierInstance";
import {
  PrettierFileInfoResult,
  PrettierPlugin,
  PrettierSupportLanguage,
} from "./types";

const execFileAsync = promisify(execFile);

/**
 * Helper function to execute a command with stdin input
 */
function execWithStdin(
  executable: string,
  args: string[],
  input: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const process = spawn(executable, args, {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    process.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    process.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    process.on("error", (error) => {
      reject(error);
    });

    process.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `Process exited with code ${code}`));
      } else {
        resolve(stdout);
      }
    });

    // Write input to stdin
    process.stdin.write(input);
    process.stdin.end();
  });
}

/**
 * PrettierExecutableInstance runs Prettier as an external executable process.
 * This is useful for scenarios like Docker where Prettier needs to run in a
 * different environment than the VS Code extension host.
 */
export const PrettierExecutableInstance: PrettierInstanceConstructor =
  class PrettierExecutableInstance implements PrettierInstance {
    public version: string | null = null;
    private executable: string;
    private args: string[];

    constructor(executablePath: string) {
      // executablePath is a JSON string containing the array of executable + args
      const executableArray = JSON.parse(executablePath);
      if (!Array.isArray(executableArray) || executableArray.length === 0) {
        throw new Error(
          "prettierExecutable must be a non-empty array of strings",
        );
      }
      this.executable = executableArray[0];
      this.args = executableArray.slice(1);
    }

    public async import(): Promise<string> {
      // Get version from the executable
      try {
        const { stdout } = await execFileAsync(this.executable, [
          ...this.args,
          "--version",
        ]);
        this.version = stdout.trim();
        return this.version;
      } catch (error) {
        throw new Error(
          `Failed to get version from Prettier executable: ${error}`,
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

      const args = [...this.args];

      // Add parser option
      if (options?.parser) {
        args.push("--parser", options.parser as string);
      }

      // Add filepath for language inference
      if (options?.filepath) {
        args.push("--stdin-filepath", options.filepath);
      }

      // Add other common options
      if (options?.printWidth !== undefined) {
        args.push("--print-width", options.printWidth.toString());
      }
      if (options?.tabWidth !== undefined) {
        args.push("--tab-width", options.tabWidth.toString());
      }
      if (options?.useTabs === true) {
        args.push("--use-tabs");
      }
      if (options?.semi === false) {
        args.push("--no-semi");
      }
      if (options?.singleQuote === true) {
        args.push("--single-quote");
      }
      if (options?.quoteProps) {
        args.push("--quote-props", options.quoteProps);
      }
      if (options?.jsxSingleQuote === true) {
        args.push("--jsx-single-quote");
      }
      if (options?.trailingComma) {
        args.push("--trailing-comma", options.trailingComma);
      }
      if (options?.bracketSpacing === false) {
        args.push("--no-bracket-spacing");
      }
      if (options?.bracketSameLine === true) {
        args.push("--bracket-same-line");
      }
      if (options?.arrowParens) {
        args.push("--arrow-parens", options.arrowParens);
      }
      if (options?.proseWrap) {
        args.push("--prose-wrap", options.proseWrap);
      }
      if (options?.htmlWhitespaceSensitivity) {
        args.push(
          "--html-whitespace-sensitivity",
          options.htmlWhitespaceSensitivity,
        );
      }
      if (options?.vueIndentScriptAndStyle === true) {
        args.push("--vue-indent-script-and-style");
      }
      if (options?.endOfLine) {
        args.push("--end-of-line", options.endOfLine);
      }
      if (options?.embeddedLanguageFormatting) {
        args.push(
          "--embedded-language-formatting",
          options.embeddedLanguageFormatting,
        );
      }
      if (options?.singleAttributePerLine === true) {
        args.push("--single-attribute-per-line");
      }

      // Range formatting
      if (options?.rangeStart !== undefined) {
        args.push("--range-start", options.rangeStart.toString());
      }
      if (options?.rangeEnd !== undefined) {
        args.push("--range-end", options.rangeEnd.toString());
      }

      // Plugins
      if (options?.plugins && Array.isArray(options.plugins)) {
        for (const plugin of options.plugins) {
          if (typeof plugin === "string") {
            args.push("--plugin", plugin);
          }
        }
      }

      try {
        const formattedText = await execWithStdin(this.executable, args, source);
        return formattedText;
      } catch (error: any) {
        // If prettier exits with error, the stderr will contain the error message
        throw new Error(
          `Prettier executable error: ${error.message || error}`,
        );
      }
    }

    public async getFileInfo(
      _filePath: string,
      _fileInfoOptions?: FileInfoOptions | undefined,
    ): Promise<PrettierFileInfoResult> {
      // For external executables, we can't easily get file info
      // Return a minimal implementation that doesn't mark files as ignored
      // This means we'll rely on the --stdin-filepath option for parser detection
      return {
        ignored: false,
        inferredParser: null,
      };
    }

    public async getSupportInfo({
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      plugins,
    }: {
      plugins: (string | PrettierPlugin)[];
    }): Promise<{
      languages: PrettierSupportLanguage[];
    }> {
      // For external executables, we need to query for supported languages
      // For now, return a default set of common languages
      // In a full implementation, we could execute `prettier --support-info` and parse the output
      try {
        const args = [...this.args, "--support-info"];
        const { stdout } = await execFileAsync(this.executable, args);
        const supportInfo = JSON.parse(stdout);
        return { languages: supportInfo.languages || [] };
      } catch {
        // Fallback to empty array if we can't get support info
        // This will cause the extension to use the bundled prettier's language list
        return { languages: [] };
      }
    }

    public async clearConfigCache(): Promise<void> {
      // External executables don't maintain a config cache in our process
      // So this is a no-op
      return;
    }

    public async resolveConfigFile(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      filePath?: string | undefined,
    ): Promise<string | null> {
      // For external executables, we can't easily resolve config files
      // Return null to indicate no config file resolution
      return null;
    }

    public async resolveConfig(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      fileName: string,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      options?: ResolveConfigOptions | undefined,
    ): Promise<Options | null> {
      // For external executables, we can't easily resolve config
      // The executable will handle config resolution internally
      return null;
    }
  };
