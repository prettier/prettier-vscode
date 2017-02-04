# Change Log
All notable changes to the "prettier-vscode" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.7.0]
- Removed `Prettier` action.
- Use vscode actions `Format Document` and `Format Selection`.
- Removed `prettier.formatOnSave` setting in favor of the more general setting `editor.formatOnSave` 
- Deprecated `useFlowParser` setting. Introduced `parser` setting. (Since prettier 0.0.10)

## [0.1.0]
- Initial release