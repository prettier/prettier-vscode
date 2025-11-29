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

// Prettier 3 moved parsers from prettier/parser-* to prettier/plugins/*
import * as acornPlugin from "prettier/plugins/acorn";
import * as angularPlugin from "prettier/plugins/angular";
import * as babelPlugin from "prettier/plugins/babel";
import * as estreePlugin from "prettier/plugins/estree";
import * as flowPlugin from "prettier/plugins/flow";
import * as glimmerPlugin from "prettier/plugins/glimmer";
import * as graphqlPlugin from "prettier/plugins/graphql";
import * as htmlPlugin from "prettier/plugins/html";
import * as markdownPlugin from "prettier/plugins/markdown";
import * as meriyahPlugin from "prettier/plugins/meriyah";
import * as typescriptPlugin from "prettier/plugins/typescript";
import * as postcssPlugin from "prettier/plugins/postcss";
import * as yamlPlugin from "prettier/plugins/yaml";

import { TextDocument, Uri } from "vscode";
import { LoggingService } from "./LoggingService";
import { getWorkspaceRelativePath } from "./utils/workspace";
import { ResolveConfigOptions, Options } from "prettier";

const plugins = [
  acornPlugin,
  angularPlugin,
  babelPlugin,
  estreePlugin,
  flowPlugin,
  glimmerPlugin,
  graphqlPlugin,
  htmlPlugin,
  markdownPlugin,
  meriyahPlugin,
  postcssPlugin,
  typescriptPlugin,
  yamlPlugin,
];

export class ModuleResolver implements ModuleResolverInterface {
  constructor(private loggingService: LoggingService) {}

  public async getPrettierInstance(
    _fileName: string,
  ): Promise<PrettierModule | undefined> {
    return this.getGlobalPrettierInstance();
  }

  public async getResolvedIgnorePath(
    fileName: string,
    ignorePath: string,
  ): Promise<string | undefined> {
    return getWorkspaceRelativePath(fileName, ignorePath);
  }

  public getGlobalPrettierInstance(): PrettierModule {
    this.loggingService.logInfo("Using standalone prettier");
    return {
      format: async (source: string, options: PrettierOptions) => {
        return prettierStandalone.format(source, { ...options, plugins });
      },
      getSupportInfo: async (): Promise<{
        languages: PrettierSupportLanguage[];
      }> => {
        return {
          languages: [
            {
              name: "JavaScript",
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
              name: "TypeScript",
              vscodeLanguageIds: ["typescript"],
              extensions: [],
              parsers: ["typescript", "babel-ts"],
            },
            {
              name: "TSX",
              vscodeLanguageIds: ["typescriptreact"],
              extensions: [],
              parsers: ["typescript", "babel-ts"],
            },
            {
              name: "JSON.stringify",
              vscodeLanguageIds: ["json"],
              extensions: [],
              parsers: ["json-stringify"],
            },
            {
              name: "JSON",
              vscodeLanguageIds: ["json"],
              extensions: [],
              parsers: ["json"],
            },
            {
              name: "JSON with Comments",
              vscodeLanguageIds: ["jsonc"],
              parsers: ["json"],
            },
            {
              name: "JSON5",
              vscodeLanguageIds: ["json5"],
              extensions: [],
              parsers: ["json5"],
            },
            {
              name: "Handlebars",
              vscodeLanguageIds: ["handlebars"],
              extensions: [],
              parsers: ["glimmer"],
            },
            {
              name: "GraphQL",
              vscodeLanguageIds: ["graphql"],
              extensions: [],
              parsers: ["graphql"],
            },
            {
              name: "Markdown",
              vscodeLanguageIds: ["markdown"],
              parsers: ["markdown"],
            },
            {
              name: "MDX",
              vscodeLanguageIds: ["mdx"],
              extensions: [],
              parsers: ["mdx"],
            },
            {
              name: "Angular",
              vscodeLanguageIds: ["html"],
              extensions: [],
              parsers: ["angular"],
            },
            {
              name: "HTML",
              vscodeLanguageIds: ["html"],
              extensions: [],
              parsers: ["html"],
            },
            {
              name: "Lightning Web Components",
              vscodeLanguageIds: ["html"],
              extensions: [],
              parsers: ["lwc"],
            },
            {
              name: "Vue",
              vscodeLanguageIds: ["vue"],
              extensions: [],
              parsers: ["vue"],
            },
            {
              name: "YAML",
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
        options?: PrettierFileInfoOptions,
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
        options?: ResolveConfigOptions | undefined,
      ): Promise<Options | null>;
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    uri: Uri,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fileName: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    vscodeConfig: PrettierVSCodeConfig,
  ): Promise<Options | "error" | "disabled" | null> {
    return null;
  }

  async getResolvedConfig(
    _doc: TextDocument,

    _vscodeConfig: PrettierVSCodeConfig,
  ): Promise<"error" | "disabled" | PrettierOptions | null> {
    return null;
  }

  async clearConfigCache() {
    // nothing to do for browser
  }

  dispose() {
    // nothing to do
  }
}
