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
  <a href="https://dev.azure.com/prettier/prettier-vscode/_build?definitionId=6">
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

### Plugins

This extension support [Prettier plugins](https://prettier.io/docs/en/plugins.html) when you are using a locally resolved version of prettier. If you have Prettier and a plugin registered in your `package.json`, this extension will attempt to register the language and provide automatic code formatting for the built-in and plugin languages.

### VSCode ESLint and TSLint Integration

The prefered way of integrating with linters is to let Prettier do the formatting and configure the linter to not deal with formatting rules. [You can see how this is done here.](https://prettier.io/docs/en/integrating-with-linters.html). To continue to use Prettier and your linter we recommend you use the [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) or [TSLint](https://marketplace.visualstudio.com/items?itemName=ms-vscode.vscode-typescript-tslint-plugin) extensions directly.

You can enable Auto-Fix on Save for either TSLint or ESLint and still have formatting and quick fixes:

```
"eslint.autoFixOnSave": true,
"tslint.autoFixOnSave": true,
```

> NOTE: If you are seeing conflicts between Prettier and ESLint this is because you don't have the right ESLint or TSLint rules set as explained in the [Prettier documentation](https://prettier.io/docs/en/integrating-with-linters.html).

**Legacy Configuration**

> WARNING: Due to a [bug](https://github.com/prettier/prettier-vscode/issues/870) in the `prettier-eslint` library, this extension is NOT compatible with ESLint version 6.

The legacy approach is to use the linters bundled in this project. `prettier-eslint` and `prettier-tslint` are included with the installation of this extension. There is no need for a separate local or global install of either for functionality.

`eslint`, `tslint`, and all peer dependencies required by your specific configuration must be installed locally. Global installations will not be recognized.

If you have both `"prettier.tslintIntegration"` and `"prettier.eslintIntegration"` enabled in your Visual Studio Code settings, then TSLint will be used to lint your TypeScript code. If you would rather use ESLint, disable the TSLint integration by setting `"prettier.tslintIntegration"` to `false`.

## Settings

### Prettier's Settings

Settings will be read from (listed by priority):

1. [Prettier configuration file](https://prettier.io/docs/en/configuration.html)
1. `.editorconfig`

Or if no prettier configuration file exist

1. `.editorconfig`
1. VSCode prettier's settings (described below with their default)

#### prettier.printWidth (default: 80)

Fit code within this line limit

#### prettier.tabWidth (default: 2)

Number of spaces it should use per tab

#### prettier.singleQuote (default: false)

If true, will use single instead of double quotes

#### prettier.trailingComma (default: 'none')

Controls the printing of trailing commas wherever possible. Valid options:

- "none" - No trailing commas
- "es5" - Trailing commas where valid in ES5 (objects, arrays, etc)
- "all" - Trailing commas wherever possible (function arguments)

#### prettier.bracketSpacing (default: true)

Controls the printing of spaces inside object literals

#### prettier.jsxBracketSameLine (default: false)

If true, puts the `>` of a multi-line jsx element at the end of the last line instead of being alone on the next line

#### prettier.parser (default: 'babylon') - JavaScript only

Which parser to use. Valid options are 'flow' and 'babylon'.

#### prettier.semi (default: true)

Whether to add a semicolon at the end of every line (semi: true),
or only at the beginning of lines that may introduce ASI failures (semi: false)

#### prettier.useTabs (default: false)

If true, indent lines with tabs

#### prettier.proseWrap (default: 'preserve')

(Markdown) wrap prose over multiple lines.

#### prettier.arrowParens (default: 'avoid')

Include parentheses around a sole arrow function parameter

#### prettier.jsxSingleQuote (default: false)

Use single quotes instead of double quotes in JSX.

#### prettier.htmlWhitespaceSensitivity (default: 'css')

Specify the global whitespace sensitivity for HTML files. [Learn more here](https://prettier.io/docs/en/options.html#html-whitespace-sensitivity)

#### prettier.endOfLine (default: 'auto')

Specify the end of line used by prettier. [Learn more here](https://prettier.io/docs/en/options.html#end-of-line)

#### prettier.quoteProps (default: 'as-needed')

Change when properties in objects are quoted. [Learn more here](https://prettier.io/docs/en/options.html#quote-props)

### VSCode specific settings

These settings are specific to VSCode and need to be set in the VSCode settings file. See the [documentation](https://code.visualstudio.com/docs/getstarted/settings) for how to do that.

#### prettier.eslintIntegration (default: false) - JavaScript and TypeScript only **DEPRECATED**

Use _[prettier-eslint](https://github.com/prettier/prettier-eslint)_ instead of _prettier_.
Other settings will only be fallbacks in case they could not be inferred from ESLint rules.

#### prettier.tslintIntegration (default: false) - JavaScript and TypeScript only **DEPRECATED**

Use _[prettier-tslint](https://github.com/azz/prettier-tslint)_ instead of _prettier_.
Other settings will only be fallbacks in case they could not be inferred from TSLint rules.

#### prettier.stylelintIntegration (default: false) - CSS, SCSS and LESS only **DEPRECATED**

Use _[prettier-stylelint](https://github.com/hugomrdias/prettier-stylelint)_ instead of _prettier_.
Other settings will only be fallbacks in case they could not be inferred from stylelint rules.

#### prettier.requireConfig (default: false)

Require a 'prettierconfig' to format

#### prettier.ignorePath (default: .prettierignore)

Supply the path to an ignore file such as `.gitignore` or `.prettierignore`.
Files which match will not be formatted. Set to `null` to not read ignore files. Restart required.

#### prettier.disableLanguages (default: ["vue"])

A list of languages IDs to disable this extension on. Restart required.
_Note: Disabling a language enabled in a parent folder will prevent formatting instead of letting any other formatter to run_

## Prettier resolution

This extension will use prettier from your project's local dependencies. Should prettier not be installed locally with your project's dependencies, a copy will be bundled with the extension.
