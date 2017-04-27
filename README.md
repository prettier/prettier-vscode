# Prettier formatter for Visual Studio Code

VS Code package to format your Javascript using [Prettier](https://github.com/prettier/prettier).

### Installation

Install through VS Code extensions. Search for `Prettier - JavaScript formatter`

[Visual Studio Code Market Place: Prettier - JavaScript formatter](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

Can also be installed using 

```
ext install prettier-vscode
```

### Usage

#### Using Command Palette (CMD + Shift + P)

```
1. CMD + Shift + P -> Format Document
OR
1. Select the text you want to Prettify
2. CMD + Shift + P -> Format Selection
```

#### Format On Save

Respects `editor.formatOnSave` setting.

### Settings
#### prettier.eslintIntegration (default: false)
Use *[prettier-eslint](https://github.com/prettier/prettier-eslint)* instead of *prettier*.
Other settings will only be fallbacks in case they could not be inferred from eslint rules.

#### prettier.printWidth (default: 80)

Fit code within this line limit

#### prettier.tabWidth (default: 2)

Number of spaces it should use per tab

#### prettier.useFlowParser (default: false)
Use the flow parser instead of babylon. **Deprecated** use `parser: 'flow'` instead

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

#### prettier.parser (default: 'babylon')
Which parser to use. Valid options are 'flow' and 'babylon'

#### prettier.semi (default: true)
Whether to add a semicolon at the end of every line (semi: true),
or only at the beginning of lines that may introduce ASI failures (semi: false)

#### prettier.useTabs (default: false)
If true, indent lines with tabs

### Prettier resolution
This extension will use prettier from your project's local dependencies. Should prettier not be installed locally with your project's dependencies, a copy will be bundled with the extension. 

### Contribute

This is my first Visual Studio Extension so I probably made some terrible choices. Feel free to open issue or PRs!
