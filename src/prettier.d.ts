import { ExtensionConfig } from './extension.d';

/**
 * Prettier configuration
 */
export interface PrettierConfig {
    parser?: 'babylon' | 'flow' | 'postcss' | 'json' | 'graphql' | 'typescript';
    printWidth?: number;
    tabWidth?: number;
    useTabs?: boolean;
    jsxSingleQuote?: boolean;
    singleQuote?: boolean;
    trailingComma?: 'none' | 'es5' | 'all';
    bracketSpacing?: boolean;
    bracesSpacing?: boolean;
    breakProperty?: boolean;
    arrowParens?: boolean;
    arrayExpand?: boolean;
    flattenTernaries?: boolean;
    breakBeforeElse?: boolean;
    jsxBracketSameLine?: boolean;
    noSpaceEmptyFn?: boolean;
    semi?: boolean;
    spaceBeforeFunctionParen?: boolean;
    alignObjectProperties?: boolean;
    [key: string]: any;
}

/**
 * Configuration for prettier-vscode
 */
export type PrettierVSCodeConfig = PrettierConfig & ExtensionConfig;
export interface Prettier {
    format: (string: string, PrettierConfig?: PrettierConfig) => string;
    readonly version: string;
}
