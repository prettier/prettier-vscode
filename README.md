# Prettier Now - Formatter for Visual Studio Code with tabs support

VS Code package to format your Javascript using [Prettier Miscellaneous](https://github.com/arijs/prettier-miscellaneous).
Based on [Esben Petersen's extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) and [Bastian Kistner's extension](https://marketplace.visualstudio.com/items?itemName=passionkind.prettier-vscode-with-tabs)

Prettier Miscellaneous aka prettier-with-tabs is a fork of Prettier and allows more customization of the output.
This extension is just a wrapper around Prettier Miscellaneous, please report any issues regarding the output [Here](https://github.com/arijs/prettier-miscellaneous).

### Installation

Install through VS Code extensions. Search for `Prettier Now - JavaScript formatter`

[Visual Studio Code Market Place: Prettier - JavaScript formatter](https://marketplace.visualstudio.com/items?itemName=remimarsal.prettier-now)

Can also be installed using 

```
ext install prettier-now
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

#### useTabs (default: 'true')
Use tabs instead of spaces

#### singleQuote (default: true)
If true, will use single instead of double quotes

#### trailingComma (default: 'es5')
Controls the printing of trailing commas wherever possible. Valid options:
 - "none" - No trailing commas
 - "es5"  - Trailing commas where valid in ES5 (objects, arrays, etc)
 - "all"  - Trailing commas wherever possible (function arguments)

 #### bracketSpacing (default: true)
Print spaces between brackets in array literals

 #### bracesSpacing (default: true)
Print spaces between brackets in object literals

 #### breakProperty (default: false)
Allow object properties to break lines between the property name and its value

 #### arrowParens (default: false)
Always put parentheses on arrow function arguments

 #### arrayExpand (default: false)
Expand arrays into one item per line

 #### flattenTernaries (default: false)
Format ternaries in a flat style (UNSTABLE)

 #### breakBeforeElse (default: false)
Put else clause in a new line

#### jsxBracketSameLine (default: false)
If true, puts the `>` of a multi-line jsx element at the end of the last line instead of being alone on the next line

#### groupFirstArg (default: false)
Print functions like setTimeout in a more compact form

#### noSpaceEmptyFn (default: false)
Omit space before empty anonymous function body

#### parser (default: 'babylon')
Which parser to use. Valid options are 'flow' and 'babylon'

#### useFlowParser (default: false)
Use the flow parser instead of babylon. **Deprecated** use `parser: 'flow'` instead

### Contribute

This is my first Visual Studio Extension so I probably made some terrible choices. Feel free to open issue or PRs!