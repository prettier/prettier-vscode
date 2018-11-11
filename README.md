# Prettier formatter for Visual Studio Code

VS Code package to format your JavaScript / TypeScript / CSS using [Prettier](https://github.com/prettier/prettier).

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

### Custom keybindings

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

### VSCode ESLint and TSLint Integration

`prettier-eslint` and `prettier-tslint` are included with the installation of this extension.  There is no need for a separate local or global install of either for functionality.  

`eslint`, `tslint`, and all peer dependencies required by your specific configuration must be installed locally.  Global installations will not be recognized.

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
 - "es5"  - Trailing commas where valid in ES5 (objects, arrays, etc)
 - "all"  - Trailing commas wherever possible (function arguments)

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


### VSCode specific settings

These settings are specific to VSCode and need to be set in the VSCode settings file. See the [documentation](https://code.visualstudio.com/docs/getstarted/settings) for how to do that.

#### prettier.eslintIntegration (default: false) - JavaScript and TypeScript only
Use *[prettier-eslint](https://github.com/prettier/prettier-eslint)* instead of *prettier*.
Other settings will only be fallbacks in case they could not be inferred from ESLint rules.

#### prettier.tslintIntegration (default: false) - JavaScript and TypeScript only
Use *[prettier-tslint](https://github.com/azz/prettier-tslint)* instead of *prettier*.
Other settings will only be fallbacks in case they could not be inferred from TSLint rules.

#### prettier.stylelintIntegration (default: false) - CSS, SCSS and LESS only 
Use *[prettier-stylelint](https://github.com/hugomrdias/prettier-stylelint)* instead of *prettier*.
Other settings will only be fallbacks in case they could not be inferred from stylelint rules.

#### prettier.requireConfig (default: false)
Require a 'prettierconfig' to format

#### prettier.ignorePath (default: .prettierignore)
Supply the path to an ignore file such as `.gitignore` or `.prettierignore`.
Files which match will not be formatted. Set to `null` to not read ignore files. Restart required.

#### prettier.disableLanguages (default: ["vue"])
A list of languages IDs to disable this extension on. Restart required.
*Note: Disabling a language enabled in a parent folder will prevent formatting instead of letting any other formatter to run*

## Prettier resolution

This extension will use prettier from your project's local dependencies. Should prettier not be installed locally with your project's dependencies, a copy will be bundled with the extension.

## Contribute
Feel free to open issues or PRs!

### Running extension
- Open this repository inside VSCode
- Debug sidebar
- `Launch Extension`

### Running tests
Tests open a VSCode instance and load `./testProject` as root workspace.

- Open this repository inside VSCode
- Debug sidebar
- `Launch Tests`

OR

Without having an instance VSCode running (or it won't start)
`npm run test` 
