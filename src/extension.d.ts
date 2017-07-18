/**
 * prettier-vscode specific configuration
 */
export interface ExtensionConfig {
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
    cssEnable: ('css' | 'less' | 'sass' | 'postcss' | string)[];
    /**
     * Language ids to run json prettier on.
     */
    jsonEnable: ('json' | string)[];
    /**
     * Language ids to run graphql prettier on.
     */
    graphqlEnable: ('graphql' | string)[];
    /**
     * Use 'prettier-eslint' instead of 'prettier'.
     * Other settings will only be fallbacks in case they could not be inferred from eslint rules.
     */
    eslintIntegration: boolean;
}
