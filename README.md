# Prettier formatter for Visual Studio Code with tabs support

VS Code package to format your Javascript using [Prettier](https://github.com/jlongster/prettier).
Based on [Esben Petersen's extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

### Installation

Install through VS Code extensions. Search for `Prettier - JavaScript formatter`

[Visual Studio Code Market Place: Prettier - JavaScript formatter](https://marketplace.visualstudio.com/items?itemName=passionkind.prettier-vscode-with-tabs)

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

#### printWidth (default: 120)

Fit code within this line limit

#### tabWidth (default: 4)

Number of spaces it should use per tab

#### useFlowParser (default: false)
Use the flow parser instead of babylon. **Deprecated** use `parser: 'flow'` instead

#### singleQuote (default: true)
If true, will use single instead of double quotes

#### trailingComma (default: 'es5')
Controls the printing of trailing commas wherever possible. Valid options:
 - "none" - No trailing commas
 - "es5"  - Trailing commas where valid in ES5 (objects, arrays, etc)
 - "all"  - Trailing commas wherever possible (function arguments)

#### bracketSpacing (default: true)
Controls the printing of spaces inside object literals

#### jsxBracketSameLine (default: false)
If true, puts the `>` of a multi-line jsx element at the end of the last line instead of being alone on the next line

#### parser (default: 'babylon')
Which parser to use. Valid options are 'flow' and 'babylon'

#### useTabs (default: 'true')
Use tabs instead of spaces

### Contribute

This is my first Visual Studio Extension so I probably made some terrible choices. Feel free to open issue or PRs!