# Prettier+ &middot; [![Visual Studio Marketplace](https://img.shields.io/visual-studio-marketplace/v/svipas.prettier-plus.svg)](https://marketplace.visualstudio.com/items?itemName=svipas.prettier-plus)

[Prettier](https://prettier.io) (code formatter) for the VS Code. To see what was changed you can take a look at the [CHANGELOG](https://github.com/svipas/vscode-prettier-plus/blob/master/CHANGELOG.md).

Works with JavaScript, JSX, Flow, TypeScript, JSON, HTML, Vue, Angular, CSS, Less, SCSS, `styled-components`, `styled-jsx`, GraphQL, Markdown, CommonMark, GitHub-Flavored Markdown, MDX, Yaml, Elm (via `elm-format`), Java, PHP, PostgreSQL, Ruby, Swift, TOML.

## Installation

Install through VS Code extensions, search for `Prettier+` by `Benas Svipas`.

&#x26a0; A word of warning-if you have any other code formatting extensions installed they might take precedence and format your code instead of Prettier leading to unexpected results.

## Usage

### Command palette

```
1. Format Document With... -> Prettier+
2. Format Selection With... -> Prettier+
```

### Keyboard shortcuts

```
Mac: Shift + Option + F
Windows: Shift + Alt + F
Linux: Ctrl + Shift + I
```

### Format a file on save

```json
// Format all files on save
"editor.formatOnSave": true,

// Format per-language file on save
"[javascript]": {
  "editor.formatOnSave": false
}
```

## Prettier resolution

**Prettier (1.18.2)** copy is bundled with the extension so additionally you don't need to install prettier to format your code. _If extension detects local prettier dependency in your project it will use it from your project instead of bundled version in the extension._

## ESLint, TSLint and stylelint integrations

`prettier-eslint (9.0.0)`, `prettier-tslint (0.4.2)` and `prettier-stylelint (0.4.2)` are bundled with the extension. There is no need for a separate local or global install of either for functionality.

`eslint`, `tslint`, `stylelint` and all required dependencies by your specific configuration must be installed locally. **Global installations will not be recognized.**

If you have both `"prettier.eslintIntegration"` and `"prettier.tslintIntegration"` enabled in your VS Code settings, then TSLint will be used to lint your TypeScript code. If you would rather use ESLint, disable the TSLint integration by setting `"prettier.tslintIntegration"` to `false`.

## Settings

<details>
<summary><strong>Prettier settings</strong></summary>

Settings will be read from (listed by priority):

1. [Prettier config file](https://prettier.io/docs/en/configuration.html)
2. `.editorconfig`

Or if there's no Prettier config file:

1. `.editorconfig`
2. VS Code settings (described below with their defaults)

**prettier.printWidth (default: 80)**

Specify the line length that the printer will wrap on. [Learn more here.](https://prettier.io/docs/en/options.html#print-width)

**prettier.tabWidth (default: 2)**

Specify the number of spaces per indentation-level. [Learn more here.](https://prettier.io/docs/en/options.html#tab-width)

**prettier.singleQuote (default: false)**

Use single quotes instead of double quotes. [Learn more here.](https://prettier.io/docs/en/options.html#quotes)

**prettier.trailingComma (default: 'none')**

Print trailing commas wherever possible when multi-line. (A single-line array, for example, never gets trailing commas.) [Learn more here.](https://prettier.io/docs/en/options.html#trailing-commas)

Valid options:

- `"none"` - No trailing commas.
- `"es5"` - Trailing commas where valid in ES5 (objects, arrays, etc.)
- `"all"` - Trailing commas wherever possible (including function arguments). This requires node 8 or a transform.

**prettier.bracketSpacing (default: true)**

Print spaces between brackets in object literals. [Learn more here.](https://prettier.io/docs/en/options.html#bracket-spacing)

**prettier.jsxBracketSameLine (default: false)**

Put the `>` of a multi-line JSX element at the end of the last line instead of being alone on the next line (does not apply to self closing elements). [Learn more here.](https://prettier.io/docs/en/options.html#jsx-brackets)

**prettier.parser (default: 'none')**

Specify which parser to use. [Learn more here.](https://prettier.io/docs/en/options.html#parser)

_Prettier automatically infers the parser from the input file path, so you shouldn't have to change this setting._

Both the `babel` and `flow` parsers support the same set of JavaScript features (including Flow type annotations). They might differ in some edge cases, so if you run into one of those you can try `flow` instead of `babel`.

Valid options:

- `"none"` - Automatically infers the parser from the input file path.
- `"babel"` - Via `@babel/parser` named `babylon` until v1.16.0
- `"babel-flow"` - Same as `babel` but enables Flow parsing explicitly to avoid ambiguity. First available in v1.16.0
- `"flow"` - Via `flow-parser`
- `"typescript"` - Via `@typescript-eslint/typescript-estree`. First available in v1.4.0
- `"css"` - Via `postcss-scss` and `postcss-less`, autodetects which to use. First available in v1.7.1
- `"scss"` - Same parsers as `css`, prefers `postcss-scss`. First available in v1.7.1
- `"less"` - Same parsers as `css`, prefers `postcss-less`. First available in v1.7.1
- `"json"` - Via `@babel/parser parseExpression`. First available in v1.5.0
- `"json5"` - Same parser as `json`, but outputs as `json5`. First available in v1.13.0
- `"json-stringify"` - Same parser as `json`, but outputs like `JSON.stringify`. First available in v1.13.0
- `"graphql"` - Via `graphql/language`. First available in v1.5.0
- `"markdown"` - Via `remark-parse`. First available in v1.8.0
- `"mdx"` - Via `remark-parse` and `@mdx-js/mdx`. First available in v1.15.0
- `"html"` - Via `angular-html-parser`. First available in 1.15.0
- `"vue"` - Same parser as `html`, but also formats vue-specific syntax. First available in 1.10.0
- `"angular"` - Same parser as `html`, but also formats angular-specific syntax via `angular-estree-parser`. First available in 1.15.0
- `"lwc"` - Same parser as `html`, but also formats LWC-specific syntax for unquoted template attributes. First available in 1.17.0
- `"yaml` - Via `yaml` and `yaml-unist-parser`. First available in 1.14.0

**prettier.semi (default: true)**

Print semicolons at the ends of statements. [Learn more here.](https://prettier.io/docs/en/options.html#semicolons)

**prettier.useTabs (default: false)**

Indent lines with tabs instead of spaces. [Learn more here.](https://prettier.io/docs/en/options.html#tabs)

**prettier.proseWrap (default: 'preserve')**

By default, Prettier will wrap markdown text as-is since some services use a linebreak-sensitive renderer, e.g. GitHub comment and BitBucket. In some cases you may want to rely on editor/viewer soft wrapping instead, so this option allows you to opt out with `"never"`. [Learn more here.](https://prettier.io/docs/en/options.html#prose-wrap)

Valid options:

- `"preserve"` - Wrap prose as-is. First available in v1.9.0
- `"always"` - Wrap prose if it exceeds the print width.
- `"never"` - Do not wrap prose.

**prettier.arrowParens (default: 'avoid')**

Include parentheses around a sole arrow function parameter. [Learn more here.](https://prettier.io/docs/en/options.html#arrow-function-parentheses)

Valid options:

- `"avoid"` - Omit parens when possible. Example: `x => x`
- `"always"` - Always include parens. Example: `(x) => x`

**prettier.jsxSingleQuote (default: false)**

Use single quotes instead of double quotes in JSX. [Learn more here.](https://prettier.io/docs/en/options.html#jsx-quotes)

**prettier.htmlWhitespaceSensitivity (default: 'css')**

Specify the global whitespace sensitivity for HTML files. [Learn more here.](https://prettier.io/docs/en/options.html#html-whitespace-sensitivity)

Valid options:

- `"css"` - Respect the default value of CSS `display` property.
- `"strict"` - Whitespaces are considered sensitive.
- `"ignore"` - Whitespaces are considered insensitive.

**prettier.endOfLine (default: 'auto')**

Specify the end of line used by Prettier. [Learn more here.](https://prettier.io/docs/en/options.html#end-of-line)

Valid options:

- `"auto"` - Maintain existing line endings (mixed values within one file are normalised by looking at what's used after the first line)
- `"lf"` - Line Feed only (`\n`), common on Linux and macOS as well as inside git repos
- `"crlf"` - Carriage Return + Line Feed characters (`\r\n`), common on Windows
- `"cr"` - Carriage Return character only (`\r`), used very rarely

**prettier.quoteProps (default: 'as-needed')**

Change when properties in objects are quoted. [Learn more here.](https://prettier.io/docs/en/options.html#quote-props)

Valid options:

- `"as-needed"` - Only add quotes around object properties where required.
- `"consistent"` - If at least one property in an object requires quotes, quote all properties.
- `"preserve"` - Respect the input use of quotes in object properties.

</details>

<details>
<summary><strong>VS Code specific settings</strong></summary>

These settings are specific to VS Code and need to be set in the VS Code settings file. See the [documentation](https://code.visualstudio.com/docs/getstarted/settings) for how to do that.

**prettier.eslintIntegration (default: false) - JavaScript and TypeScript only**

Use [prettier-eslint](https://github.com/prettier/prettier-eslint) instead of _prettier_. Other settings will only be fallbacks in case they could not be inferred from eslint rules.

**prettier.tslintIntegration (default: false) - JavaScript and TypeScript only**

Use [prettier-tslint](https://github.com/azz/prettier-tslint) instead of _prettier_. Other settings will only be fallbacks in case they could not be inferred from tslint rules.

**prettier.stylelintIntegration (default: false) - CSS, SCSS and Less only**

Use [prettier-stylelint](https://github.com/hugomrdias/prettier-stylelint) instead of _prettier_. Other settings will only be fallbacks in case they could not be inferred from stylelint rules.

**prettier.requireConfig (default: false)**

Require a config file to format code.

**prettier.ignorePath (default: .prettierignore)**

Path to a `.prettierignore` or similar file such as `.gitignore`. Files which match will not be formatted. Set to `null` to not read ignore files. **Restart required.**

**prettier.disableLanguages (default: ["vue"])**

List of languages IDs to ignore. **Restart required.** _Disabling a language enabled in a parent folder will prevent formatting instead of letting any other formatter to run._

</details>

## Contributing

Feel free to open issues or PRs!

### Debug extension

- Open this repository inside VS Code.
- Run `Debug: Select and Start Debugging` from command palette or open debug sidebar.
- Select `Launch extension`.

### Run tests

- Run tests from terminal via `yarn test`

## Credits

All credits goes to the [prettier-vscode](https://github.com/prettier/prettier-vscode) and [prettier](https://github.com/prettier/prettier).
