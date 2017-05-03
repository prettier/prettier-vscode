# Change Log
All notable changes to the "prettier-vscode" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

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
