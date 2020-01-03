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

### Default Formatter

To ensure that this extension is used over other extensions you may have installed, be sure to set it as the default formatter in your VS Code settings. This setting can be set for all languages or by a specific language.

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

### Prettier Resolution

This extension will use prettier from your project's local dependencies (recommended). When the `prettier.resolveGlobalModules` is set to `true` the extension can also attempt to resolve global modules. Should prettier not be installed locally with your project's dependencies or globally on the machine, the version of prettier that is bundled with the extension will be used.

To install prettier in your project run:

```
npm install prettier -D
```

### Plugins

This extension supports [Prettier plugins](https://prettier.io/docs/en/plugins.html) when you are using a locally or globally resolved version of prettier. If you have Prettier and a plugin registered in your `package.json`, this extension will attempt to register the language and provide automatic code formatting for the built-in and plugin languages.

## Configuration

There are multiple options for configuring Prettier with this extension. You can use [VS Code settings](#prettiers-settings), [prettier configuration files](https://prettier.io/docs/en/configuration.html), or an `.editorconfig` file. The VS Code settings are meant to be used as a fallback and are generally intended only for use on non-project files. **It is recommended that you always include a prettier configuration file in your project specifying all settings for your project.** This will ensure that no matter how you run prettier - from this extension, from the CLI, or from another IDE with Prettier, the same settings will get applied.

Using [Prettier Configuration files](https://prettier.io/docs/en/configuration.html) to set formatting options is the recommended approach. Options are searched recursively down from the file being formatted so if you want to apply prettier settings to your entire project simply set a configuration in the root. Settings can also be configured through VS Code - however, these settings will only apply while running the extension, not when running prettier through the command line.

### Configuring Default Options

Some users may not wish to create a new Prettier config for every project or use the VS Code settings. Because Prettier searches recursively up the file path, you can place a global prettier config at `~/.prettierrc` to be used as a fallback.

You can also use the setting [`prettier.configPath`](https://github.com/prettier/prettier-vscode#prettierconfigpath) to provide a global configuration. However, be careful, if this is set this value will always be used and local configuration files will be ignored.

### Visual Studio Code Settings

You can use [VS Code settings](#prettiers-settings) to configure prettier. Settings will be read from (listed by priority):

1. [Prettier configuration file](https://prettier.io/docs/en/configuration.html)
1. `.editorconfig`
1. Visual Studio Code Settings (Ignored if any other configuration is present)

> NOTE: If any local configuration file is present (i.e. `.prettierrc`) the VS Code settings will **NOT** be used.

## Migrating from Versions 2.x

Version 3.0 has a number of breaking changes. The settings for Linters have been removed. Linters are still supported, but the settings are no longer needed. See the [documentation on linters below](#linter-integration). See also [Error Messages](#error-messages)

> NOTE: If you are seeing messages about legacy configuration settings, double check that you don't have any settings for the linters in your workspace or global settings. You must remove these. See also [Error Messages](#error-messages)

Finally, there are a few smaller breaking changes, including removal of support for older versions of prettier. See the [CHANGELOG](https://github.com/prettier/prettier-vscode/blob/master/CHANGELOG.md) for details.

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

### Format Selection

Format selection works on several languages depending on what Prettier itself supports. The following languages currently are supported:

```
javascript
javascriptreact
typescript
typescriptreact
json
graphql
```

## Linter Integration

The preferred way of integrating with linters is to let Prettier do the formatting and configure the linter to not deal with formatting rules. [You can see how this is done here](https://prettier.io/docs/en/integrating-with-linters.html). To continue to use Prettier and your linter we recommend you use the [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint), [TSLint](https://marketplace.visualstudio.com/items?itemName=ms-vscode.vscode-typescript-tslint-plugin) or [Stylelint](https://marketplace.visualstudio.com/items?itemName=stylelint.vscode-stylelint) extensions directly.

You can enable Auto-Fix on Save for ESLint, TSLint or Stylelint and still have formatting and quick fixes:

```
"editor.codeActionsOnSave": {
    // For ESLint
    "source.fixAll.eslint": true,
    // For TSLint
    "source.fixAll.tslint": true,
    // For Stylelint
    "source.fixAll.stylelint": true
}
```

> NOTE: If you are seeing conflicts between Prettier and ESLint this is because you don't have the right ESLint or TSLint rules set as explained in the [Prettier documentation](https://prettier.io/docs/en/integrating-with-linters.html).

### Prettier Linter Integration (advanced)

> WARNING: Due to a [bug](https://github.com/prettier/prettier-vscode/issues/870) in the `prettier-eslint` library, this extension is NOT compatible with ESLint version 6.

The advanced option for integrating linters with Prettier is to use `prettier-eslint`, `prettier-tslint`, or `prettier-stylelint`. In order to use these integrations you MUST install these modules in your project's `package.json` along with dependencies like `prettier`, `eslint`, `tslint`, `stylelint`, etc.

This extension will automatically detect when you have these extensions installed and use them instead of `prettier` by itself. For configuration of these linter integrations, see their respective documentation.

## Settings

### Prettier's Settings

All prettier options can be configured directly in this extension. These settings are used as a fallback when no configuration file is present in your project, see the [configuration](#configuration) section of this document for more details. For reference on the options see the [prettier documentation](https://prettier.io/docs/en/options.html).

```
prettier.arrowParens
prettier.bracketSpacing
prettier.endOfLine
prettier.htmlWhitespaceSensitivity
prettier.insertPragma
prettier.jsxBracketSameLine
prettier.jsxSingleQuote
prettier.printWidth
prettier.proseWrap
prettier.quoteProps
prettier.requirePragma
prettier.semi
prettier.singleQuote
prettier.tabWidth
prettier.trailingComma
prettier.useTabs
prettier.vueIndentScriptAndStyle
```

### Extension Settings

These settings are specific to VS Code and need to be set in the VS Code settings file. See the [documentation](https://code.visualstudio.com/docs/getstarted/settings) for how to do that.

#### prettier.requireConfig (default: `false`)

Require a prettier configuration file to format files. Untitled files will still be formatted using the VS Code Prettier configuration even with this option set to `true`.

#### prettier.ignorePath (default: `.prettierignore`)

Supply the path to an ignore file such as `.gitignore` or `.prettierignore`.
Files which match will not be formatted. Set to `null` to not read ignore files.

**Note, if this is set, this value will always be used and local ignore files will be ignored.**

#### prettier.configPath

Supply a custom path to the prettier configuration file.

**Note, if this is set, this value will always be used and local configuration files will be ignored. A better option for global defaults is to put a `~/.prettierrc` file in your home directory.**

#### prettier.prettierPath

Supply a custom path to the prettier module.

#### prettier.packageManager

Controls the package manager to be used to resolve modules. This has only an influence if the `prettier.resolveGlobalModules` setting is `true` and modules are resolved globally. Valid values are `"npm"` or `"yarn"` or `"pnpm"`.

#### prettier.resolveGlobalModules (default: `false`)

When enabled, this extension will attempt to use global npm or yarn modules if local modules cannot be resolved.

> NOTE: This setting can have a negative performance impact, particularly on Windows when you have attached network drives. Only enable this if you must use global modules. It is recommended that you always use local modules when possible.

#### prettier.disableLanguages

A list of languages IDs to disable this extension on.

**Note: Disabling a language enabled in a parent folder will prevent formatting instead of letting any other formatter to run**

#### prettier.useEditorConfig (default: `true`)

Whether or not to take .editorconfig into account when parsing configuration. See the [prettier.resolveConfig docs](https://prettier.io/docs/en/api.html) for details.

## Error Messages

**Failed to load module. If you have prettier or plugins referenced in package.json, ensure you have run `npm install`**

When a `package.json` is present in your project and it contains prettier, plugins, or linter libraries this extension will attempt to load these modules from your `node_module` folder. If you see this error, it most likely means you need to run `npm install` or `yarn install` to install the packages in your `package.json`.

**Your project is configured to use an outdated version of prettier that cannot be used by this extension. Upgrade to the latest version of prettier.**

You must upgrade to a newer version of prettier.

**You have legacy linter settings in your VS Code config. They are no longer being used.**

If you receive this error message it means that one of the following settings were found in your VS Code config. Either in your global or workspace settings. These configuration options should be deleted as they are no longer used for anything. See [these instructions for linter configuration](#linter-integration).

```
prettier.eslintIntegration
prettier.tslintIntegration
prettier.stylelintIntegration
```

## Telemetry

This extension uses Application Insights to track anonymous feature usage and version info. We don't record IP addresses or any other personally identifiable information. The reason we track this data is simply to help with prioritization of features.

This extension respects the VS Code telemetry setting so if you have telemetry disabled in VS Code we will also not collect telemetry. See the [Visual Studio Code docs](https://code.visualstudio.com/docs/getstarted/telemetry#_disable-telemetry-reporting) for information on how to disable telemetry.
