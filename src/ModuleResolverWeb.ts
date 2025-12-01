import {
  PrettierFileInfoOptions,
  PrettierFileInfoResult,
  PrettierSupportLanguage,
  PrettierModule,
  PrettierOptions,
  ModuleResolverInterface,
  PrettierVSCodeConfig,
} from "./types.js";
import { TextDocument } from "vscode";
import { LoggingService } from "./LoggingService.js";
import { getWorkspaceRelativePath } from "./utils/workspace.js";
import type { ResolveConfigOptions, Options, Plugin } from "prettier";

// Prettier
import * as prettierStandalone from "prettier/standalone";
import { version as prettierVersion } from "prettier";

// Plugins
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

const plugins: Plugin[] = [
  acornPlugin,
  angularPlugin,
  babelPlugin,
  estreePlugin as Plugin, // estreePlugin doesn't have proper types
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

  public async getGlobalPrettierInstance(): Promise<PrettierModule> {
    this.loggingService.logInfo("Using standalone prettier");
    return {
      version: prettierVersion,
      format: async (source: string, options: PrettierOptions) => {
        return prettierStandalone.format(source, { ...options, plugins });
      },
      resolveConfigFile: async (): Promise<string | null> => {
        // Config file resolution not supported in browser
        return null;
      },
      resolveConfig: async (): Promise<PrettierOptions | null> => {
        // Config resolution not supported in browser
        return null;
      },
      clearConfigCache: async (): Promise<void> => {
        // No cache to clear in browser
      },
      getSupportInfo: async (): Promise<{
        languages: PrettierSupportLanguage[];
      }> => {
        return {
          languages: [
            {
              name: "CSS",
              vscodeLanguageIds: ["css"],
              extensions: [".css",".wxss"],
              parsers: ["css"],
            },
            {
              name: "PostCSS",
              vscodeLanguageIds: ["postcss"],
              extensions: [".pcss",".postcss"],
              parsers: ["css"],
            },
            {
              name: "Less",
              vscodeLanguageIds: ["less"],
              extensions: [".less"],
              parsers: ["less"],
            },
            {
              name: "SCSS",
              vscodeLanguageIds: ["scss"],
              extensions: [".scss"],
              parsers: ["scss"],
            },
            {
              name: "GraphQL",
              vscodeLanguageIds: ["graphql"],
              extensions: [".graphql",".gql",".graphqls"],
              parsers: ["graphql"],
            },
            {
              name: "Handlebars",
              vscodeLanguageIds: ["handlebars"],
              extensions: [".handlebars",".hbs"],
              parsers: ["glimmer"],
            },
            {
              name: "Angular",
              vscodeLanguageIds: ["html"],
              extensions: [".component.html"],
              parsers: ["angular"],
            },
            {
              name: "HTML",
              vscodeLanguageIds: ["html"],
              extensions: [".html",".hta",".htm",".html.hl",".inc",".xht",".xhtml"],
              parsers: ["html"],
            },
            {
              name: "Lightning Web Components",
              vscodeLanguageIds: ["html"],
              extensions: [],
              parsers: ["lwc"],
            },
            {
              name: "MJML",
              vscodeLanguageIds: ["mjml"],
              extensions: [".mjml"],
              parsers: ["mjml"],
            },
            {
              name: "Vue",
              vscodeLanguageIds: ["vue"],
              extensions: [".vue"],
              parsers: ["vue"],
            },
            {
              name: "JavaScript",
              vscodeLanguageIds: ["javascript","javascriptreact","mongo","mongodb"],
              extensions: [".js","._js",".bones",".cjs",".es",".es6",".gs",".jake",".javascript",".jsb",".jscad",".jsfl",".jslib",".jsm",".jspre",".jss",".mjs",".njs",".pac",".sjs",".ssjs",".xsjs",".xsjslib",".start.frag",".end.frag",".wxs"],
              parsers: ["babel","acorn","espree","meriyah","babel-flow","babel-ts","flow","typescript"],
            },
            {
              name: "Flow",
              vscodeLanguageIds: ["javascript"],
              extensions: [".js.flow"],
              parsers: ["flow","babel-flow"],
            },
            {
              name: "JSX",
              vscodeLanguageIds: ["javascriptreact"],
              extensions: [".jsx"],
              parsers: ["babel","babel-flow","babel-ts","flow","typescript","espree","meriyah"],
            },
            {
              name: "TypeScript",
              vscodeLanguageIds: ["typescript"],
              extensions: [".ts",".cts",".mts"],
              parsers: ["typescript","babel-ts"],
            },
            {
              name: "TSX",
              vscodeLanguageIds: ["typescriptreact"],
              extensions: [".tsx"],
              parsers: ["typescript","babel-ts"],
            },
            {
              name: "JSON.stringify",
              vscodeLanguageIds: ["json"],
              extensions: [".importmap"],
              parsers: ["json-stringify"],
            },
            {
              name: "JSON",
              vscodeLanguageIds: ["json"],
              extensions: [".json",".4DForm",".4DProject",".avsc",".geojson",".gltf",".har",".ice",".JSON-tmLanguage",".json.example",".mcmeta",".sarif",".tact",".tfstate",".tfstate.backup",".topojson",".webapp",".webmanifest",".yy",".yyp"],
              parsers: ["json"],
            },
            {
              name: "JSON with Comments",
              vscodeLanguageIds: ["jsonc"],
              extensions: [".jsonc",".code-snippets",".code-workspace",".sublime-build",".sublime-color-scheme",".sublime-commands",".sublime-completions",".sublime-keymap",".sublime-macro",".sublime-menu",".sublime-mousemap",".sublime-project",".sublime-settings",".sublime-theme",".sublime-workspace",".sublime_metrics",".sublime_session"],
              parsers: ["jsonc"],
            },
            {
              name: "JSON5",
              vscodeLanguageIds: ["json5"],
              extensions: [".json5"],
              parsers: ["json5"],
            },
            {
              name: "Markdown",
              vscodeLanguageIds: ["markdown"],
              extensions: [".md",".livemd",".markdown",".mdown",".mdwn",".mkd",".mkdn",".mkdown",".ronn",".scd",".workbook"],
              parsers: ["markdown"],
            },
            {
              name: "MDX",
              vscodeLanguageIds: ["mdx"],
              extensions: [".mdx"],
              parsers: ["mdx"],
            },
            {
              name: "YAML",
              vscodeLanguageIds: ["yaml","ansible","home-assistant"],
              extensions: [".yml",".mir",".reek",".rviz",".sublime-syntax",".syntax",".yaml",".yaml-tmlanguage",".yaml.sed",".yml.mysql"],
              parsers: ["yaml"],
            }
          
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
    _prettierInstance: {
      resolveConfigFile(filePath?: string | undefined): Promise<string | null>;
      resolveConfig(
        fileName: string,
        options?: ResolveConfigOptions | undefined,
      ): Promise<Options | null>;
    },
    _fileName: string,
    _vscodeConfig: PrettierVSCodeConfig,
  ): Promise<Options | "error" | "disabled" | null> {
    return null;
  }

  async getResolvedConfig(
    _doc: TextDocument,

    _vscodeConfig: PrettierVSCodeConfig,
  ): Promise<"error" | "disabled" | PrettierOptions | null> {
    return null;
  }

  dispose() {
    // nothing to do
  }
}

