type ParserOption = 'babylon' | 'flow' | 'postcss' | 'typescript';
type TrailingCommaOption = 'none' | 'es5' | 'all';

/**
 * Prettier configuration
 */
export interface PrettierConfig {
    printWidth?: number;
    tabWidth?: number;
    useTabs?: boolean;
    singleQuote?: boolean;
    trailingComma?: TrailingCommaOption;
    bracketSpacing?: boolean;
    bracesSpacing?: boolean;
    breakProperty?: boolean;
    arrowParens?: boolean;
    arrayExpand?: boolean;
    flattenTernaries?: boolean;
    breakBeforeElse?: boolean;
    jsxBracketSameLine?: boolean;
    noSpaceEmptyFn?: boolean;
    parser?: ParserOption;
    semi?: boolean;
    spaceBeforeFunctionParen: boolean;
}

/**
 * prettier-vscode specific configuration
 */
interface ExtensionConfig {
    /**
     * Language ids to run javascript prettier on.
     */
    javascriptEnable: ('javascript' | 'javascriptreact' | string)[];
    /**
     * Language ids to run typescript prettier on.
     */
    typescriptEnable: ('typescript' | 'typescriptreact' | string)[];
    /**
     * Language ids to run postcss prettier on.
     */
    cssEnable: ('css' | 'less' | 'sass' | string)[];
}

/**
 * Configuration for prettier-vscode
 */
export type PrettierVSCodeConfig = PrettierConfig & ExtensionConfig;
export interface Prettier {
    format: (string, PrettierConfig?) => string;
    readonly version: string;
}

type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace';