/**
 * prettier-vscode specific configuration
 */
export interface ExtensionConfig {
    /**
     * Language IDs to run javascript parser on.
     */
    javascriptEnable: ('javascript' | 'javascriptreact' | string)[];
    /**
     * Language IDs to run typescript parser on.
     */
    typescriptEnable: ('typescript' | 'typescriptreact' | string)[];
    /**
     * Language IDs to run postcss parser on.
     */
    cssEnable: ('css' | 'less' | 'sass' | 'postcss' | string)[];
    /**
     * Language IDs to run json parser on.
     */
    jsonEnable: ('json' | string)[];
    /**
     * Language IDs to run graphql parser on.
     */
    graphqlEnable: ('graphql' | string)[];
    /**
     * Use 'prettier-eslint' instead of 'prettier'.
     * Other settings will only be fallbacks in case they could not be inferred from eslint rules.
     */
    eslintIntegration: boolean;
}
