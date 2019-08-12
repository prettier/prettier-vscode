import * as prettier from 'prettier';

/**
 * prettier-vscode specific configuration
 */
interface ExtensionConfig {
    /**
     * Path to '.prettierignore' or similar.
     */
    ignorePath: string;
    /**
     * If true will skip formatting if a prettierconfig isn't found.
     */
    requireConfig: boolean;
    /**
     * Array of language IDs to ignore
     */
    disableLanguages: string[];
}

/**
 * Configuration for prettier-vscode
 */
export type PrettierVSCodeConfig = ExtensionConfig & prettier.Options;
