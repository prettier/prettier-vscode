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

#### printWidth (default: 80)

Fit code within this line limit

#### tabWidth (default: 2)

Number of spaces it should use per tab

#### useFlowParser (default: false)
Use the flow parser instead of babylon. **Deprecated** use `parser: 'flow'` instead

#### singleQuote (default: false)
If true, will use single instead of double quotes

#### trailingComma (default: false)
Controls the printing of trailing commas wherever possible

#### bracketSpacing (default: true)
Controls the printing of spaces inside object literals

#### jsxBracketSameLine (default: false)
If true, puts the `>` of a multi-line jsx element at the end of the last line instead of being alone on the next line

#### parser (default: 'babylon')
Which parser to use. Valid options are 'flow' and 'babylon'

### Contribute

This is my first Visual Studio Extension so I probably made some terrible choices. Feel free to open issue or PRs!