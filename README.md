# Prettier Formatter for Visual Studio Code

[Prettier](https://prettier.io/) is an opinionated code formatter. It enforces a consistent style by parsing your code and re-printing it with its own rules that take the maximum line length into account, wrapping code when necessary.

<p align="center">
  <em>
    JavaScript
    · TypeScript
    · Flow
    · JSX
    · JSON
  </em>
  <br />
  <em>
    CSS
    · SCSS
    · Less
  </em>
  <br />
  <em>
    HTML
    · Vue
    · Angular
  </em>
  <br />
  <em>
    GraphQL
    · Markdown
    · YAML
  </em>
  <br />
  <em>
    <a href="https://prettier.io/docs/en/plugins.html">
      Your favorite language?
    </a>
  </em>
</p>

<p align="center">
  <a href="https://dev.azure.com/prettier/prettier-vscode/_build?definitionId=9">
    <img alt="Azure Pipelines Build Status" src="https://dev.azure.com/prettier/prettier-vscode/_apis/build/status/prettier.prettier-vscode?branchName=master"></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode">
    <img alt="VS Code Marketplace Downloads" src="https://img.shields.io/visual-studio-marketplace/d/esbenp.prettier-vscode"></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode">
    <img alt="VS Code Marketplace Installs" src="https://img.shields.io/visual-studio-marketplace/i/esbenp.prettier-vscode"></a>
  <a href="#badge">
    <img alt="code style: prettier" src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square"></a>
  <a href="https://twitter.com/PrettierCode">
    <img alt="Follow Prettier on Twitter" src="https://img.shields.io/twitter/follow/prettiercode.svg?label=follow+prettier&style=flat-square"></a>
</p>

## Installation

Install through VS Code extensions. Search for `Prettier - Code formatter`

[Visual Studio Code Market Place: Prettier - Code formatter](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

Can also be installed in VS Code: Launch VS Code Quick Open (Ctrl+P), paste the following command, and press enter.

```
ext install esbenp.prettier-vscode
```

&#x26a0; A word of warning-if you have any other code formatting extensions installed such as for example hugely popular `HookyQR.beautify` or `taichi.react-beautify` they might take precedence and format your code instead of Prettier leading to unexpected results.

## Migrating from Versions 2.x

Version 3.0 has a number of breaking changes. The main thing to be aware of is that this extension no longer supports adding prettier specific settings to the VS Code configuration. If you previously had settings like `prettier.tabWidth` or anthing else from the [Prettier Configuration](https://prettier.io/docs/en/options.html) those VS Code settings will be ignored. Version 3.0 of the extension will attempt to find and warn you if it detects those settings as well as help you migrate to a `.prettierrc` file. See also [Error Messages](#error-messages)

Additionally, the settings for Linters have been removed. Linters are still supported, but the settings are no longer needed. See the [documentation on linters below](#vs-code-eslint-and-tslint-integration). See also [Error Messages](#error-messages)

Finnaly, there are a few smaller breaking changes, including removal of support for older versions of prettier. See the [CHANGELOG](https://github.com/prettier/prettier-vscode/blob/master/CHANGELOG.md) for details.

## Prettier Resolution

This extension will use prettier from your project's local dependencies (recommended). Should prettier not be installed locally with your project's dependencies, a copy will be bundled with the extension.

To install prettier in your project run:

```
npm install prettier -D
```

## Plugins

This extension supports [Prettier plugins](https://prettier.io/docs/en/plugins.html) when you are using a locally resolved version of prettier. If you have Prettier and a plugin registered in your `package.json`, this extension will attempt to register the language and provide automatic code formatting for the built-in and plugin languages.

## Usage

### Using Command Palette (CMD/CTRL + Shift + P)

```
1. CMD + Shift + P -> Format Document
OR
1. Select the text you want to Prettify
2. CMD + Shift + P -> Format Selection
```

### Keyboard Shortcuts

Visual Studio Code provides [default keyboard shortcuts](https://code.visualstudio.com/docs/getstarted/keybindings#_keyboard-shortcuts-reference) for code formatting. You can learn about these for each platform in the [VS Code documentation](https://code.visualstudio.com/docs/getstarted/keybindings#_keyboard-shortcuts-reference).

If you don't like the defaults, you can rebind `editor.action.formatDocument` and `editor.action.formatSelection` in the keyboard shortcuts menu of vscode.

### Format On Save

Respects `editor.formatOnSave` setting.

You can turn on format-on-save on a per-language basis by scoping the setting:

```json
// Set the default
"editor.formatOnSave": false,
// Enable per-language
"[javascript]": {
    "editor.formatOnSave": true
}
```

### VS Code ESLint and TSLint Integration

The prefered way of integrating with linters is to let Prettier do the formatting and configure the linter to not deal with formatting rules. [You can see how this is done here](https://prettier.io/docs/en/integrating-with-linters.html). To continue to use Prettier and your linter we recommend you use the [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) or [TSLint](https://marketplace.visualstudio.com/items?itemName=ms-vscode.vscode-typescript-tslint-plugin) extensions directly.

You can enable Auto-Fix on Save for either TSLint or ESLint and still have formatting and quick fixes:

```
"eslint.autoFixOnSave": true,
"editor.codeActionsOnSave": {
    "source.fixAll.tslint": true
}
```

> NOTE: If you are seeing conflicts between Prettier and ESLint this is because you don't have the right ESLint or TSLint rules set as explained in the [Prettier documentation](https://prettier.io/docs/en/integrating-with-linters.html).

**Prettier Linter Integration (advanced)**

> WARNING: Due to a [bug](https://github.com/prettier/prettier-vscode/issues/870) in the `prettier-eslint` library, this extension is NOT compatible with ESLint version 6.

The advanced option for integrating linters with Prettier is to use `prettier-eslint`, `prettier-tslint`, or `prettier-stylelint`. In order to use these integrations you MUST install these modules in your project's `package.json` along with dependancies like `prettier`, `eslint`, `tslint`, etc.

This extension will automatically detect when you have these extensions installed and use them instead of `prettier` by itself. For configuration of these linter integrations, see their respective documentation.

## Telemetry

This extension uses Application Insights to track anonymous feature usage and version info. We don't record IP addresses or any other personally identifiable information. The reason we track this data is simply to help with prioritization of features.

This extension respects the VS Code telemetry setting so if you have telemetry disabled in VS Code we will also not collect telemetry. See the [Visual Studio Code docs](https://code.visualstudio.com/docs/getstarted/telemetry#_disable-telemetry-reporting) for information on how to disable telemetry.

## Settings

### Prettier's Settings

Settings will be read from (listed by priority):

1. [Prettier configuration file](https://prettier.io/docs/en/configuration.html)
1. `.editorconfig`

### Extension Settings

These settings are specific to VS Code and need to be set in the VS Code settings file. See the [documentation](https://code.visualstudio.com/docs/getstarted/settings) for how to do that.

#### prettier.requireConfig (default: false)

Require a 'prettierconfig' to format

#### prettier.ignorePath

Supply the path to an ignore file such as `.gitignore` or `.prettierignore`.
Files which match will not be formatted. Set to `null` to not read ignore files. Restart required.

#### prettier.configPath

Supply a custom path to the prettier configuration file.

#### prettier.prettierPath

Supply a custom path to the prettier module.

#### prettier.disableLanguages

A list of languages IDs to disable this extension on. Restart required.
_Note: Disabling a language enabled in a parent folder will prevent formatting instead of letting any other formatter to run_

## Error Messages

**You have legacy settings in your VS Code config. They are being ignored Would you like to migrate them to '.prettierrc'?.**

If you recieve this error message it means that one of the following settings were found in your VS Code config. Either in your global or workspace settings.

Remove any of the following configurations by moving them to the [Prettier Configuration](https://prettier.io/docs/en/options.html).

```
prettier.printWidth
prettier.tabWidth
prettier.singleQuote
prettier.trailingComma
prettier.bracketSpacing
prettier.jsxBracketSameLine
prettier.semi
prettier.useTabs
prettier.proseWrap
prettier.arrowParens
prettier.jsxSingleQuote
prettier.htmlWhitespaceSensitivity
prettier.endOfLine
prettier.quoteProps
```

**You have legacy linter settings in your VS Code config. They are no longer being used.**

If you recieve this error message it means that one of the following settings were found in your VS Code config. Either in your global or workspace settings. These configuration options should be deleted. See [these instructions for linter configuration](#vs-code-eslint-and-tslint-integration).

```
prettier.eslintIntegration
prettier.tslintIntegration
prettier.stylelintIntegration
```
