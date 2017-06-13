# Prettier Now - Formatter for Visual Studio Code with tabs support

[![](http://vsmarketplacebadge.apphb.com/version/remimarsal.prettier-now.svg)](https://marketplace.visualstudio.com/items?itemName=remimarsal.prettier-now)
[![](http://vsmarketplacebadge.apphb.com/installs/remimarsal.prettier-now.svg)](https://marketplace.visualstudio.com/items?itemName=remimarsal.prettier-now)

VS Code package to format your Javascript using [Prettier Miscellaneous](https://github.com/arijs/prettier-miscellaneous).
Based on [Esben Petersen's extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) and [Bastian Kistner's extension](https://marketplace.visualstudio.com/items?itemName=passionkind.prettier-vscode-with-tabs).

Prettier Miscellaneous aka prettier-with-tabs is a fork of Prettier and allows more customization of the output.
This extension is just a wrapper around Prettier Miscellaneous, please report any issues regarding the output [Here](https://github.com/arijs/prettier-miscellaneous).

#### *Update 1.1.0*
Added support for TypeScript, CSS, LESS and SASS files.
<br/>

### Installation

Install through VS Code extensions. Search for `Prettier Now`.

[Visual Studio Code Market Place: Prettier Now](https://marketplace.visualstudio.com/items?itemName=remimarsal.prettier-now)

Can also be installed using 

```
ext install prettier-now
```

### Usage

#### Format On Save

Set `editor.formatOnSave` to `true` in settings to automatically format JavaScript files on save.

#### Or using Command Palette (CMD + Shift + P)

```
CMD + Shift + P -> Format Document
```


### Settings

| Option | Description | Default |
| ------------- | ------------- | ------------- |
| **printWidth**|Fit code within this line limit| `120`
| **tabWidth**|Number of spaces it should use per tab|`4`
|**useTabs**|Use tabs instead of spaces|`true`
|**singleQuote**|If true, will use single instead of double quotes|`true`
|**trailingComma**|Controls the printing of trailing commas wherever possible.<br /><br />Valid options:<br />`none` - No trailing commas<br />`es5`  - Trailing commas where valid in ES5 (objects, arrays, etc)<br />`all`  - Trailing commas wherever possible (function arguments)<br />|`none`
|**bracketSpacing**|Print spaces between brackets in array literals|`true`
|**bracesSpacing**|Print spaces between brackets in object literals|`true`
|**breakProperty**|Allow object properties to break lines between the property name and its value|`false`
|**arrowParens**|Always put parentheses on arrow function arguments|`true`
|**arrayExpand**|Expand arrays into one item per line|`false`
|**flattenTernaries**|Format ternaries in a flat style (**UNSTABLE**)|`false`
|**breakBeforeElse**|Put else clause in a new line|`false`
|**semi**|Print semicolons at the ends of statements.|`true`
|**javascriptEnable**|Will apply Prettier Misc on JavaScript files.<br /><br />Valid options:<br />`javascript` - JavaScript files<br/>`javascriptreact` - JSX files|`["javascript","javascriptreact"]`
|**typescriptEnable**|Will apply Prettier Misc on TypeScript files.<br /><br />Valid options:<br />`typescript` - TypeScript files<br/>`typescriptreact` - TSX files|`["typescript","typescriptreact"]`
|**cssEnable**|Will apply Prettier Misc on Styling files.<br /><br />Valid options:<br />`css` - CSS files<br/>`less` - LESS files<br/>`scss` - SASS files|`["css","less","scss"]`
|**jsxBracketSameLine**|If true, puts the `>` of a multi-line jsx element at the end of the last line instead of being alone on the next line|`false`
|**groupFirstArg**|Print functions like setTimeout in a more compact form|`false`
|**noSpaceEmptyFn**|Omit space before empty anonymous function body|`false`
|**parser**|Which parser to use.<br /><br />Valid options:<br />`babylon` - Babylon parser<br/>`flow` - Flow parser|`babylon`


### Contribute

This is my first Visual Studio Extension so I probably made some terrible choices. Feel free to open issue or PRs!