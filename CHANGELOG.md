# Change Log
All notable changes to the "prettier-vscode" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

## [0.24.0]
- new setting, ignorePath. Ignore files.
- Eslint now also runs on TypeScript files.
- new setting, stylelintIntegration. prettier + stylelint.
- Prettier 1.7

## [0.23.1]
- Prettier 1.6.1

## [0.23.0]
- Read configuration from files.
- Prettier 1.6

## [0.22.0]
- Changed Status bar: hide/show depending on active editor.
- Fix local resolution.

## [0.21.0]
- Reworked error messages. They are now in a dedicated output channel.

## [0.20.0]
- Prettier 1.5
- Added JSON and GraphQL formatting (Range formatting disabled)
- Disable range formatting with postcss parser (broken)

## [0.19.1]
- Fix sass language id (sass -> scss)
- Update prettier to 1.4.4
- Update prettier-eslint to 6.3.0

## [0.19.0]
- Option to select language ids prettier will run on.
- Prettier 1.4.2

## [0.18.0]
- Prettier 1.4
- Now also formats CSS and TypeScript
- Format Selection highly improved.

## [0.17.0]
- Bump dependencies.
- `jsx` language support in addition to `javascript` and `javascriptreact`.

## [0.16.0]
- New setting eslintIntegration. Use `prettier-eslint` under the hood.

## [0.14.0]
- Bundled with prettier 1.1.0
- New setting `useTabs`. (prettier 1.0)
- New setting `semi`. (prettier 1.0)

## [0.13.0]
- Local prettier has to be *explicitely* installed (dependencies or devDependencies)

## [0.11.0]
- Resolve 'prettier' against formatted file. Nearest upward *node_modules/prettier*

## [0.10.0]
- New setting `jsxBracketSameLine`. (prettier 0.17.0)
- Changed `trailingComma` setting `['none', 'es5', 'all']` (prettier 0.19.0)

## [0.7.0]
- Removed `Prettier` action.
- Use vscode actions `Format Document` and `Format Selection`.
- Removed `prettier.formatOnSave` setting in favor of the more general setting `editor.formatOnSave`
- Deprecated `useFlowParser` setting. Introduced `parser` setting. (Since prettier 0.0.10)

## [0.1.0]
- Initial release
