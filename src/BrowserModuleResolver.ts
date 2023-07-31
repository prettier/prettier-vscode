import {
  PrettierFileInfoOptions,
  PrettierFileInfoResult,
  PrettierSupportLanguage,
  PrettierModule,
  PrettierOptions,
  ModuleResolverInterface,
  PrettierVSCodeConfig,
} from "./types";

import * as prettierStandalone from "prettier/standalone";

import * as angularPlugin from "prettier/parser-angular";
import * as babelPlugin from "prettier/parser-babel";
import * as glimmerPlugin from "prettier/parser-glimmer";
import * as graphqlPlugin from "prettier/parser-graphql";
import * as htmlPlugin from "prettier/parser-html";
import * as markdownPlugin from "prettier/parser-markdown";
import * as meriyahPlugin from "prettier/parser-meriyah";
import * as typescriptPlugin from "prettier/parser-typescript";
import * as yamlPlugin from "prettier/parser-yaml";

// commented out as the cod uses `new Function("return this") which
// is not allowed in the VS Code extension host as it enforces
// the Trusted Types Content Security Policy
//import * as flowPlugin from "prettier/parser-flow";
//import * as postcssPlugin from "prettier/parser-postcss";

import { TextDocument, Uri } from "vscode";
import { LoggingService } from "./LoggingService";
import { getWorkspaceRelativePath } from "./util";
import { ResolveConfigOptions, Options } from "prettier";

const plugins = [
  angularPlugin,
  babelPlugin,
  glimmerPlugin,
  graphqlPlugin,
  htmlPlugin,
  markdownPlugin,
  meriyahPlugin,
  typescriptPlugin,
  yamlPlugin,
];

export class ModuleResolver implements ModuleResolverInterface {
  constructor(private loggingService: LoggingService) {}

  public async getPrettierInstance(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _fileName: string
  ): Promise<PrettierModule | undefined> {
    return this.getGlobalPrettierInstance();
  }

  public async getResolvedIgnorePath(
    fileName: string,
    ignorePath: string
  ): Promise<string | undefined> {
    return getWorkspaceRelativePath(fileName, ignorePath);
  }

  public getGlobalPrettierInstance(): PrettierModule {
    this.loggingService.logInfo("Using standalone prettier");
    return {
      format: (source: string, options: PrettierOptions) => {
        return prettierStandalone.format(source, { ...options, plugins });
      },
      getSupportInfo: (): { languages: PrettierSupportLanguage[] } => {
        return {
          languages: [
            {
              vscodeLanguageIds: [
                "javascript",
                "javascriptreact",
                "mongo",
                "mongodb",
              ],
              extensions: [],
              parsers: [
                "babel",
                "espree",
                "meriyah",
                "babel-flow",
                "babel-ts",
                "flow",
                "typescript",
              ],
            },
            {
              vscodeLanguageIds: ["typescript"],
              extensions: [],
              parsers: ["typescript", "babel-ts"],
            },
            {
              vscodeLanguageIds: ["typescriptreact"],
              extensions: [],
              parsers: ["typescript", "babel-ts"],
            },
            {
              vscodeLanguageIds: ["json"],
              extensions: [],
              parsers: ["json-stringify"],
            },
            {
              vscodeLanguageIds: ["json"],
              extensions: [],
              parsers: ["json"],
            },
            {
              vscodeLanguageIds: ["jsonc"],
              parsers: ["json"],
            },
            {
              vscodeLanguageIds: ["json5"],
              extensions: [],
              parsers: ["json5"],
            },
            {
              vscodeLanguageIds: ["handlebars"],
              extensions: [],
              parsers: ["glimmer"],
            },
            {
              vscodeLanguageIds: ["graphql"],
              extensions: [],
              parsers: ["graphql"],
            },
            {
              vscodeLanguageIds: ["markdown"],
              parsers: ["markdown"],
            },
            {
              vscodeLanguageIds: ["mdx"],
              extensions: [],
              parsers: ["mdx"],
            },
            {
              vscodeLanguageIds: ["html"],
              extensions: [],
              parsers: ["angular"],
            },
            {
              vscodeLanguageIds: ["html"],
              extensions: [],
              parsers: ["html"],
            },
            {
              vscodeLanguageIds: ["html"],
              extensions: [],
              parsers: ["lwc"],
            },
            {
              vscodeLanguageIds: ["vue"],
              extensions: [],
              parsers: ["vue"],
            },
            {
              vscodeLanguageIds: ["yaml", "ansible", "home-assistant"],
              extensions: [],
              parsers: ["yaml"],
            },
          ],
        };
      },
      getFileInfo: async (
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        filePath: string,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        options?: PrettierFileInfoOptions
      ): Promise<PrettierFileInfoResult> => {
        // TODO: implement ignore file reading
        return { ignored: false, inferredParser: null };
      },
    };
  }

  async resolveConfig(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    prettierInstance: {
      resolveConfigFile(filePath?: string | undefined): Promise<string | null>;
      resolveConfig(
        fileName: string,
        options?: ResolveConfigOptions | undefined
      ): Promise<Options | null>;
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    uri: Uri,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fileName: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    vscodeConfig: PrettierVSCodeConfig
  ): Promise<Options | "error" | "disabled" | null> {
    return null;
  }

  async getResolvedConfig(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _doc: TextDocument,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _vscodeConfig: PrettierVSCodeConfig
  ): Promise<"error" | "disabled" | PrettierOptions | null> {
    return null;
  }

  dispose() {
    // nothing to do
  }
}
