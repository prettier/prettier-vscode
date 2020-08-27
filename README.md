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
  <a href="https://github.com/prettier/prettier-vscode/actions?query=workflow%3AMain">
    <img alt="Build Status" src="https://github.com/prettier/prettier-vscode/workflows/Main/badge.svg?branch=main"></a>
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

To install prettier in your project and pin its version [as recommended](https://prettier.io/docs/en/install.html), run:

```
npm install prettier -D --save-exact
```

### Plugins

This extension supports [Prettier plugins](https://prettier.io/docs/en/plugins.html) when you are using a locally or globally resolved version of prettier. If you have Prettier and a plugin registered in your `package.json`, this extension will attempt to register the language and provide automatic code formatting for the built-in and plugin languages.

## Configuration

There are multiple options for configuring Prettier with this extension. You can use [VS Code settings](#prettier-settings), [prettier configuration files](https://prettier.io/docs/en/configuration.html), or an `.editorconfig` file. The VS Code settings are meant to be used as a fallback and are generally intended only for use on non-project files. **It is recommended that you always include a prettier configuration file in your project specifying all settings for your project.** This will ensure that no matter how you run prettier - from this extension, from the CLI, or from another IDE with Prettier, the same settings will get applied.

Using [Prettier Configuration files](https://prettier.io/docs/en/configuration.html) to set formatting options is the recommended approach. Options are searched recursively down from the file being formatted so if you want to apply prettier settings to your entire project simply set a configuration in the root. Settings can also be configured through VS Code - however, these settings will only apply while running the extension, not when running prettier through the command line.

### Configuring Default Options

Some users may not wish to create a new Prettier config for every project or use the VS Code settings. Because Prettier searches recursively up the file path, you can place a global prettier config at `~/.prettierrc` to be used as a fallback.

You can also use the setting [`prettier.configPath`](https://github.com/prettier/prettier-vscode#prettierconfigpath) to provide a global configuration. However, be careful, if this is set this value will always be used and local configuration files will be ignored.

### Visual Studio Code Settings

You can use [VS Code settings](#prettier-settings) to configure prettier. Settings will be read from (listed by priority):

1. [Prettier configuration file](https://prettier.io/docs/en/configuration.html)
1. `.editorconfig`
1. Visual Studio Code Settings (Ignored if any other configuration is present)

> NOTE: If any local configuration file is present (i.e. `.prettierrc`) the VS Code settings will **NOT** be used.

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

There are two ways to use Prettier and linters together. The first approach is to simply let each tool do what it was meant for: Prettier formats and the linter lints. You do this by disabling any rules in your linter that check formatting and let Prettier automatically handle all the formatting. The second approach is to use the linter to run prettier though a plugin with the linter.

### Disable Formatting Rules in the Linter

The easiest and recommended way of integrating with linters is to let Prettier do the formatting and configure the linter to not deal with formatting rules. You can find instructions on how to configure each linter on the Prettier docs site. You can then use each of the linting extensions as you normally would.

- **ESLint**: [Extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) | [Configuration](https://prettier.io/docs/en/integrating-with-linters.html#disable-formatting-rules)
- **TSLint**: [Extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode.vscode-typescript-tslint-plugin) | [Configuration](https://prettier.io/docs/en/integrating-with-linters.html#disable-formatting-rules-1)
- **Stylelint**: [Extension](https://marketplace.visualstudio.com/items?itemName=stylelint.vscode-stylelint) | [Configuration](https://prettier.io/docs/en/integrating-with-linters.html#disable-formatting-rules-2)

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

### Run Prettier through Linters

Another option to run Prettier and linters together is to have the linters run Prettier. For these configurations you **DO NOT USE THIS EXTENSION**. Instead you use the linter extensions to run the linter and Prettier. See the Prettier documentation for instructions on how to configure each linter. This setup is generally **not recommended**, but can be useful in certain circumstances. To learn about why you probably should avoid this setup see [the prettier documentation](https://prettier.io/docs/en/integrating-with-linters.html#notes).

- **ESLint**: [Extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) | [Configuration](https://prettier.io/docs/en/integrating-with-linters.html#use-eslint-to-run-prettier)
- **TSLint**: [Extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode.vscode-typescript-tslint-plugin) | [Configuration](https://prettier.io/docs/en/integrating-with-linters.html#use-tslint-to-run-prettier)
- **Stylelint**: [Extension](https://marketplace.visualstudio.com/items?itemName=stylelint.vscode-stylelint) | [Configuration](https://prettier.io/docs/en/integrating-with-linters.html#use-stylelint-to-run-prettier)

Disable format on save so this extension doesn't run and enable code actions to run the linters on save.

```
"editor.formatOnSave": false,
"editor.codeActionsOnSave": {
    // For ESLint
    "source.fixAll.eslint": true,
    // For TSLint
    "source.fixAll.tslint": true,
    // For Stylelint
    "source.fixAll.stylelint": true
}
```

## Settings

### Prettier Settings

All prettier options can be configured directly in this extension. These settings are used as a fallback when no configuration file is present in your project, see the [configuration](#configuration) section of this document for more details. For reference on the options see the [prettier documentation](https://prettier.io/docs/en/options.html).

> The default values of these configurations are always to their Prettier 2.0 defaults. In order to use defaults from earlier versions of prettier you must set them manually using your VS Code settings or local project configurations.

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
prettier.embeddedLanguageFormatting
```

### Extension Settings

These settings are specific to VS Code and need to be set in the VS Code settings file. See the [documentation](https://code.visualstudio.com/docs/getstarted/settings) for how to do that.

#### prettier.enable (default: `true`)

Controls whether prettier is enabled or not. You must restart VS Code when you change this setting.

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

Supply a custom path to the prettier module. This path should be to the module folder, not the bin/script path. i.e. `./node_modules/prettier`, not `./bin/prettier`.

#### prettier.packageManager

Controls the package manager to be used to resolve modules. This has only an influence if the `prettier.resolveGlobalModules` setting is `true` and modules are resolved globally. Valid values are `"npm"` or `"yarn"` or `"pnpm"`.

#### prettier.resolveGlobalModules (default: `false`)

When enabled, this extension will attempt to use global npm or yarn modules if local modules cannot be resolved.

> NOTE: This setting can have a negative performance impact, particularly on Windows when you have attached network drives. Only enable this if you must use global modules. It is recommended that you always use local modules when possible.

#### prettier.disableLanguages

A list of languages IDs to disable this extension on.

**Note: Disabling a language enabled in a parent folder will prevent formatting instead of letting any other formatter to run**

#### prettier.documentSelectors

A list of [glob patterns](https://code.visualstudio.com/api/references/vscode-api#GlobPattern) to register Prettier formatter. Typically these will be in the format of `**/*.abc` to tell this extension to register itself as the formatter for all files with the `abc` extension. This feature can be useful when you have [overrides](https://prettier.io/docs/en/configuration.html#configuration-overrides) set in your config file to map custom extensions to a parser.

It is likely will need to also update your prettier config. For example, if I register the following document selector by itself, Prettier still won't know what to do with that file. I either need a Prettier extension that formats `.abc` file format or I need to configure Prettier.

```json
{
  "prettier.documentSelectors": ["**/*.abc"]
}
```

To tell Prettier how to format a file of type `.abc` I can set an override in the prettier config that makes this file type use the `babel` parser.

```json
{
  "overrides": [
    {
      "files": "*.abc",
      "options": {
        "parser": "babel"
      }
    }
  ]
}
```

#### prettier.useEditorConfig (default: `true`)

Whether or not to take .editorconfig into account when parsing configuration. See the [prettier.resolveConfig docs](https://prettier.io/docs/en/api.html) for details.

#### prettier.withNodeModules (default: `false`)

Whether or not to process files in the `node_modules` folder.

## Error Messages

**Failed to load module. If you have prettier or plugins referenced in package.json, ensure you have run `npm install`**

When a `package.json` is present in your project and it contains prettier, plugins, or linter libraries this extension will attempt to load these modules from your `node_module` folder. If you see this error, it most likely means you need to run `npm install` or `yarn install` to install the packages in your `package.json`.

**Your project is configured to use an outdated version of prettier that cannot be used by this extension. Upgrade to the latest version of prettier.**

You must upgrade to a newer version of prettier.

```

```
