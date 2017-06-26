# Prettier Now - Formatter for Visual Studio Code with tabs support

[![](https://vsmarketplacebadge.apphb.com/version/remimarsal.prettier-now.svg)](https://marketplace.visualstudio.com/items?itemName=remimarsal.prettier-now)
[![](https://vsmarketplacebadge.apphb.com/installs/remimarsal.prettier-now.svg)](https://marketplace.visualstudio.com/items?itemName=remimarsal.prettier-now)

VS Code package to format your Javascript using [Prettier Miscellaneous](https://github.com/arijs/prettier-miscellaneous).
Based on [Esben Petersen's extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) and [Bastian Kistner's extension](https://marketplace.visualstudio.com/items?itemName=passionkind.prettier-vscode-with-tabs).

Prettier Miscellaneous aka prettier-with-tabs is a fork of Prettier and allows more customization of the output.
This extension is just a wrapper around Prettier Miscellaneous, please report any issues regarding the output [Here](https://github.com/arijs/prettier-miscellaneous).

#### *Update 1.2.0*
*New options jsxSingleQuote, spaceBeforeParen, alignObjectProperties. breakBeforeElse should now break properly.*
<br/>
#### *Update 1.1.0*
*Added support for TypeScript, CSS, LESS and SASS files.*
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

Set `editor.formatOnSave` to `true` in settings to automatically format files on save.

#### Or using Command Palette (CMD + Shift + P)

```
CMD + Shift + P -> Format Document
```


### Settings

| Option | Description | Default |
| ------------- | ------------- | ------------- |
| **printWidth**|Fit code within this line limit.| `120`
| **tabWidth**|Number of spaces it should use per tab.|`4`
|**useTabs**|Use tabs instead of spaces.|`true`
|**singleQuote**|If true, will use single instead of double quotes<br/><br/>Notes:<ul><li>Quotes in JSX will always be double and ignore this setting.</li><li>If the number of quotes outweighs the other quote, the quote which is less used will be used to format the string - Example: `"I'm double quoted"` results in `"I'm double quoted"` and `"This \"example\" is single quoted"` results in `'This "example" is single quoted'`.</li></ul>|`true`
|**jsxSingleQuote**|If true, will use single instead of double quotes in JSX.|`false`
|**trailingComma**|Controls the printing of trailing commas wherever possible.<br /><br />Valid options:<ul><li>`none` - No trailing commas</li><li>`es5`  - Trailing commas where valid in ES5 (objects, arrays, etc)</li><li>`all`  - Trailing commas wherever possible (function arguments)</li></ul>|`none`
|**bracketSpacing**|Print spaces between brackets in array literals.<br /><br />Valid options: <ul><li>`true` - Example: `[ foo: bar ]`</li><li>`false` - Example: `[foo: bar]`.</li></ul>|`true`
|**bracesSpacing**|Print spaces between brackets in object literals<br /><br />Valid options: <ul><li>`true` - Example: `{ foo: bar }`</li><li>`false` - Example: `{foo: bar}`.</li></ul>|`true`
|**breakProperty**|Allow object properties to break lines between the property name and its value.|`false`
|**arrowParens**|Always put parentheses on arrow function arguments.|`true`
|**arrayExpand**|Expand arrays into one item per line.|`false`
|**flattenTernaries**|Format ternaries in a flat style. (**UNSTABLE**)|`false`
|**breakBeforeElse**|Put else clause in a new line.|`false`
|**spaceBeforeParen**|Put a space before function parenthesis.|`false`
|**alignObjectProperties**|Align colons in multiline object literals. Does nothing if object has computed property names.|`false`
|**semi**|Print semicolons at the ends of statements.<br/><br/>Valid options:<ul><li>`true` - Add a semicolon at the end of every statement.</li><li>`false` - Only add semicolons at the beginning of lines that may introduce ASI failures.|`true`
|**javascriptEnable**|Will apply Prettier Misc on JavaScript files.<br /><br />Valid options:<ul><li>`javascript` - JavaScript files</li><li>`javascriptreact` - JSX files</li></ul>|`["javascript","javascriptreact"]`
|**typescriptEnable**|Will apply Prettier Misc on TypeScript files.<br /><br />Valid options:<ul><li>`typescript` - TypeScript files</li><li>`typescriptreact` - TSX files</li></ul>|`["typescript","typescriptreact"]`
|**cssEnable**|Will apply Prettier Misc on Styling files.<br /><br />Valid options:<ul><li>`css` - CSS files</li><li>`less` - LESS files</li><li>`scss` - SASS files</li></ul>|`["css","less","scss"]`
|**jsxBracketSameLine**|If true, puts the `>` of a multi-line jsx element at the end of the last line instead of being alone on the next line.|`false`
|**groupFirstArg**|Print functions like setTimeout in a more compact form.|`false`
|**noSpaceEmptyFn**|Omit space before empty anonymous function body.|`false`
|**parser**|Specify which parser to use. Both the `babylon` and `flow` parsers support the same set of JavaScript features (including Flow).<br /><br />Valid options:<ul><li>`babylon` - Babylon parser</li><li>`flow` - Flow parser</li></ul>|`babylon`


### Contribute

This is my first Visual Studio Extension so I probably made some terrible choices. Feel free to open issue or PRs!