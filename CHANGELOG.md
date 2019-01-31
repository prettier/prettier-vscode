# Change Log

All notable changes to the "prettier-vscode" extension will be documented in this file.

<!-- Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file. -->

## [Unreleased]

## [1.8.0]

-   Prettier [1.16](https://prettier.io/blog/2019/01/20/1.16.0.html)
-   prettier-tslint 0.4.2

## [1.7.0]

-   Validate the `"prettier"` key in `package.json` using the prettier settings schema
-   Prettier [1.15](https://prettier.io/blog/2018/11/07/1.15.0.html)
-   New options: jsxSingleQuote, htmlWhitespaceSensitivity and endOfLine (More info in readme).

## [1.6.0]

-   disableLanguages only in User / Workspace settings (no more in folder settings).It allows to register formatters for every supported language.
-   Prettier [1.14](https://prettier.io/blog/2018/07/29/1.14.0.html)
-   New option: tslintIntegration (boolean) use `prettier-tslint` instead of `prettier`

## [1.5.0]

-   Revert notification popup: remove it.
-   fix parser inference

## [1.4.0]

-   [prettier 1.13.4](https://prettier.io/blog/2018/05/27/1.13.0.html)
-   prettier-stylelint 0.4.2

## [1.3.1]

-   [prettier 1.12.1](https://prettier.io/blog/2018/04/11/1.12.0.html)

## [1.3.0]

-   [prettier 1.12.0](https://prettier.io/blog/2018/04/11/1.12.0.html)

## [1.2.0]

-   [Prettier 1.11.1](https://prettier.io/blog/2018/02/26/1.11.0.html)

## [1.1.3]

-   Improve prettier resolution algorithm for monorepos
-   prettier-eslint@8.8.1
-   `vue` is now disabled by default. Opt-in by removing `vue` from disableLanguages setting

## [1.1.2]

-   prettier-eslint@8.3.1 revert previous update

## [1.1.1]

-   prettier-eslint@8.7.5

## [1.1.0]

-   Disabling a language `disableLanguages` now allows to use an other formatter. NOT when disabling in a sub workspace folder (noop)
-   Prettier 1.10, `vue` `jsonc` `postcss` support.

## [1.0.0]

-   Prettier 1.9
-   New option: requireConfig (boolean) Format only files which have a prettier config (.prettierrc, ...)
-   Don't merge editor's options into prettier config

## [0.25.0]

-   Multi-root support.
-   Removed all `*Enable` settings, these are now inferred from Prettier itself. Use scoped `editor.formatOnSave` to disable formatting some languages on save.
    (See README)
-   Markdown support
-   Prettier 1.8.2

## [0.24.0]

-   new setting, ignorePath. Ignore files.
-   Eslint now also runs on TypeScript files.
-   new setting, stylelintIntegration. prettier + stylelint.
-   Prettier 1.7

## [0.23.1]

-   Prettier 1.6.1

## [0.23.0]

-   Read configuration from files.
-   Prettier 1.6

## [0.22.0]

-   Changed Status bar: hide/show depending on active editor.
-   Fix local resolution.

## [0.21.0]

-   Reworked error messages. They are now in a dedicated output channel.

## [0.20.0]

-   Prettier 1.5
-   Added JSON and GraphQL formatting (Range formatting disabled)
-   Disable range formatting with postcss parser (broken)

## [0.19.1]

-   Fix sass language id (sass -> scss)
-   Update prettier to 1.4.4
-   Update prettier-eslint to 6.3.0

## [0.19.0]

-   Option to select language ids prettier will run on.
-   Prettier 1.4.2

## [0.18.0]

-   Prettier 1.4
-   Now also formats CSS and TypeScript
-   Format Selection highly improved.

## [0.17.0]

-   Bump dependencies.
-   `jsx` language support in addition to `javascript` and `javascriptreact`.

## [0.16.0]

-   New setting eslintIntegration. Use `prettier-eslint` under the hood.

## [0.14.0]

-   Bundled with prettier 1.1.0
-   New setting `useTabs`. (prettier 1.0)
-   New setting `semi`. (prettier 1.0)

## [0.13.0]

-   Local prettier has to be _explicitely_ installed (dependencies or devDependencies)

## [0.11.0]

-   Resolve 'prettier' against formatted file. Nearest upward _node_modules/prettier_

## [0.10.0]

-   New setting `jsxBracketSameLine`. (prettier 0.17.0)
-   Changed `trailingComma` setting `['none', 'es5', 'all']` (prettier 0.19.0)

## [0.7.0]

-   Removed `Prettier` action.
-   Use vscode actions `Format Document` and `Format Selection`.
-   Removed `prettier.formatOnSave` setting in favor of the more general setting `editor.formatOnSave`
-   Deprecated `useFlowParser` setting. Introduced `parser` setting. (Since prettier 0.0.10)

## [0.1.0]

-   Initial release
