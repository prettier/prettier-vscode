<div style="padding: 0 25px 0">
<div align="center"><img src="https://github.com/remimarsal/prettier-now-vscode/raw/master/prettier-logo.png" alt="Logo" height="128" /></div><h1 align="center">Prettier Now</h1><h3 align="center" style="border:none">Code Formatter for Visual Studio Code</h2><div align="center">
<img src="https://vsmarketplacebadge.apphb.com/version/remimarsal.prettier-now.svg" alt="">
<img src="https://vsmarketplacebadge.apphb.com/installs/remimarsal.prettier-now.svg" alt=""></div>
<br/>
<div align="center">
<img src="https://github.com/remimarsal/prettier-now-vscode/raw/master/prettier-now2.gif" alt="Visual" />
</div>

<span>VS Code package to format your Javascript using [Prettier Miscellaneous](https://github.com/arijs/prettier-miscellaneous). *Based on [Esben Petersen's extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) and [Bastian Kistner's extension](https://marketplace.visualstudio.com/items?itemName=passionkind.prettier-vscode-with-tabs).*</span>
<span>Prettier Miscellaneous is a fork of [Prettier](https://github.com/prettier/prettier) and allows more customization of the output.<br/>
This extension is a wrapper around Prettier Miscellaneous, please report issues regarding the output on [Prettier Now](https://github.com/remimarsal/prettier-now-vscode/issues) or [Prettier Miscellaneous](https://github.com/arijs/prettier-miscellaneous/issues).</span><br/><br/>


--------------------------------------------------------------------------------

### Changelog

#### *Update 1.4.0*
  - Added Prettier in status bar
  - Added output to show parsing errors
  - Added options to toggle Prettier in status bar / toggle automatic opening of Prettier output / toggle auto scroll to detected error
  - Disabled parser option (selecting parser is handled automatically)
  - Added missing option to disable JSON formatting
  - Disabling a language should now work as expected

#### *Update 1.3.0*
*Added support for GraphQL and CSS files with PostCSS syntax.*

#### *Update 1.2.0*
*New options jsxSingleQuote, spaceBeforeParen, alignObjectProperties. breakBeforeElse should now break properly.*

#### *Update 1.1.0*
*Added support for TypeScript, CSS, LESS and SASS files.*

--------------------------------------------------------------------------------

### What does prettier do?

Prettier takes your code and reprints it from scratch by taking into account the line length.

For example, take the following code:

```js
foo(arg1, arg2, arg3, arg4);
```

It fits in a single line so it's going to stay as is. However, we've all run into this situation:

```js
foo(reallyLongArg(), omgSoManyParameters(), IShouldRefactorThis(), isThereSeriouslyAnotherOne());
```

Suddenly our previous format for calling function breaks down because this is too long. Prettier is going to do the painstaking work of reprinting it like that for you:

```js
foo(
  reallyLongArg(),
  omgSoManyParameters(),
  IShouldRefactorThis(),
  isThereSeriouslyAnotherOne()
);
```

Prettier enforces a consistent code **style** (i.e. code formatting that won't affect the AST) across your entire codebase because it disregards the original styling by parsing it away and re-printing the parsed AST with its own rules that take the maximum line length
into account, wrapping code when necessary.

--------------------------------------------------------------------------------
### Installation

Install through VS Code extensions. Search for `Prettier Now`.

[Visual Studio Code Market Place: Prettier Now](https://marketplace.visualstudio.com/items?itemName=remimarsal.prettier-now)

Can also be installed using 

```
ext install prettier-now
```
--------------------------------------------------------------------------------

### Usage

#### Format On Save

Set `editor.formatOnSave` to `true` in settings to automatically format files on save.

#### Or using Command Palette (CMD + Shift + P)

```
CMD + Shift + P -> Format Document
```

If you are using the Prettier output option, it is recommanded to use the [Output Colorizer](https://marketplace.visualstudio.com/items?itemName=IBM.output-colorizer) extension to get some syntactic coloring in the logs.

<div align="center">
<img src="https://github.com/remimarsal/prettier-now-vscode/raw/master/output.png" alt="Visual" height="320" />
</div>

*<small>In order to run Prettier on your file, make sure VSCode recognises it as a filetype supported by Prettier Now. The filetype currently recognized is shown in the status bar. (e.g: JavaScript for .js files, Sass for .scss files, etc...). If for some reasons Prettier isn't applied on some filetype and you think it should, please let me know and report it [here](https://github.com/remimarsal/prettier-now-vscode/issues) !</small>*

--------------------------------------------------------------------------------

### Settings
Extension settings are specified within VSCode Settings.
Example config:
```
"prettier.jsxSingleQuote": true,
"prettier.useTabs": false,
"prettier.jsonEnable": [] // Will disable Prettier Misc on JSON files
"prettier.openOutput": false
```
<br/>

<h3 align="center">

`Prettier Misc options`

</h3>

| Option | Description | Default |
| ------------- | ------------- | ------------- |
| **printWidth**|Fit code within this line limit.| `120`
| **tabWidth**|Number of spaces it should use per tab.|`4`
|**useTabs**|Use tabs instead of spaces.|`true`
|**singleQuote**|If true, will use single instead of double quotes.<br/><br/>*Notes:<br/>• Quotes in JSX will always be double and ignore this setting.<br/>• If the number of quotes outweighs the other quote, the quote which is less used will be used to format the string - Example: `"I'm double quoted"` results in `"I'm double quoted"` and `"This \"example\" is single quoted"` results in `'This "example" is single quoted'`.*|`true`
|**jsxSingleQuote**|If true, will use single instead of double quotes in JSX.|`false`
|**trailingComma**|Controls the printing of trailing commas wherever possible.<br /><br />Valid options:<br/>`none` - No trailing commas<br/>`es5`  - Trailing commas where valid in ES5 (objects, arrays, etc)<br/>`all`  - Trailing commas wherever possible (function arguments)|`"none"`
|**bracketSpacing**|Print spaces between brackets in array literals.<br /><br />Valid options: <br/>`true` - Example: `[ foo: bar ]`<br/>`false` - Example: `[foo: bar]`.|`true`
|**bracesSpacing**|Print spaces between brackets in object literals<br /><br />Valid options: <br/>`true` - Example: `{ foo: bar }`<br/>`false` - Example: `{foo: bar}`.|`true`
|**breakProperty**|Allow object properties to break lines between the property name and its value.|`false`
|**arrowParens**|Always put parentheses on arrow function arguments.|`true`
|**arrayExpand**|Expand arrays into one item per line.|`false`
|**flattenTernaries**|Format ternaries in a flat style. (**UNSTABLE**)|`false`
|**breakBeforeElse**|Put else clause in a new line.|`false`
|**spaceBeforeParen**|Put a space before function parenthesis.|`false`
|**alignObjectProperties**|Align colons in multiline object literals. Does nothing if object has computed property names.|`false`
|**semi**|Print semicolons at the ends of statements.<br/><br/>Valid options:<br/>`true` - Add a semicolon at the end of every statement.<br/>`false` - Only add semicolons at the beginning of lines that may introduce ASI failures.|`true`
|**jsxBracketSameLine**|If true, puts the `>` of a multi-line jsx element at the end of the last line instead of being alone on the next line.|`false`
|**groupFirstArg**|Print functions like setTimeout in a more compact form.|`false`
|**noSpaceEmptyFn**|Omit space before empty anonymous function body.|`false`

<br/>
<br/>

<h3 align="center">

`Extension options`

</h3>

| Option | Description | Default |
| ------------- | ------------- | ------------- |
|**statusBar**|Display Prettier status in the bottom bar|`true`
|**openOutput**|Automatically opens Prettier output when an error is detected|`true`
|**autoScroll**|Scroll automatically to line where error has been detected|`true`
|**javascriptEnable**|Will apply Prettier Misc using JavaScript parser.<br /><br />Supported options:<br/>`javascript` - JavaScript files<br/>`javascriptreact` - JSX files<br/><br/>*You can now try to add other languages IDs that have JavaScript syntax but result is not guaranteed. No restart is required.*|`["javascript","javascriptreact"]`
|**typescriptEnable**|Will apply Prettier Misc using TypeScript parser.<br /><br />Supported options:<br/>`typescript` - TypeScript files<br/>`typescriptreact` - TSX files<br/><br/>*You can now try to add other languages IDs that have TypeScript syntax but result is not guaranteed. No restart is required.*|`["typescript","typescriptreact"]`
|**cssEnable**|Will apply Prettier Misc using PostCSS parser.<br /><br />Supported options:<br/>`css` - CSS files<br/>`less` - LESS files<br/>`scss` - SASS files<br/>`postcss` - CSS files with PostCSS syntax<br/><br/>*You can now try to add other languages IDs that have CSS syntax but result is not guaranteed. No restart is required.*|`["css","less","scss","postcss"]`
|**jsonEnable**|Will apply Prettier Misc using JSON parser.<br /><br />Supported options:<br/>`json` - JSON files<br/><br/>*You can now try to add other languages IDs that have JSON syntax but result is not guaranteed. No restart is required.*|`["json"]`
|**graphqlEnable**|Will apply Prettier Misc using GraphQL parser.<br /><br />Supported options:<br/>`graphql` - GQL and GraphQL files<br/><br/>*You can now try to add other languages IDs that have GraphQL syntax but result is not guaranteed. No restart is required.*|`["graphql"]`

--------------------------------------------------------------------------------
### Know issues
* Prettier JSON parser doesn't tolerate comments as they're not part of JSON spec. It is cumbersome since it will trigger an error on document save and more and more projects make use of comments in JSON files (included VSCode configuration files). This will get fixed in upcoming versions of Prettier (see this [issue](https://github.com/prettier/prettier/issues/2378)).

--------------------------------------------------------------------------------
### Contribute

Feel free to open issue or PRs [Here](https://github.com/remimarsal/prettier-now-vscode)!
</div>