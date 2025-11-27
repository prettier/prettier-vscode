# Custom File Extensions

This guide explains how to configure the Prettier VS Code extension to format files with custom extensions.

## Overview

Like [Prettier itself](https://prettier.io/docs/en/configuration.html#configuration-overrides), the VS Code extension supports Configuration Overrides. This allows you to register custom file extensions to use specific parsers.

## Basic Configuration

In your Prettier configuration file (`.prettierrc`, `.prettierrc.json`, etc.), you can use overrides to map file extensions to parsers:

```json
{
  "overrides": [
    {
      "files": ["*.abc"],
      "options": {
        "parser": "html"
      }
    }
  ]
}
```

## The VS Code Caveat

This configuration works with the Prettier CLI, but **there's an important caveat for VS Code**:

> VS Code must recognize the file's language as one that Prettier supports.

### How It Works

1. VS Code assigns each file a "language identifier" based on its extension
2. The Prettier extension only activates for language identifiers it recognizes
3. If VS Code doesn't recognize your file type, the extension won't offer to format it

### Example

| File                     | VS Code Language | Prettier Formats? |
| ------------------------ | ---------------- | ----------------- |
| `*.html`                 | `html`           | Yes               |
| `*.abc` (unregistered)   | `plaintext`      | No                |
| `*.abc` → `html` mapping | `html`           | Yes               |

---

## Solution 1: File Associations

If VS Code doesn't have a language associated with your file extension, you can add one.

### In VS Code Settings

Add to your `.vscode/settings.json` or user settings:

```json
{
  "files.associations": {
    "*.abc": "html",
    "*.xyz": "json"
  }
}
```

This tells VS Code to treat `.abc` files as HTML and `.xyz` files as JSON.

### Combined with Prettier Config

Make sure your Prettier config matches:

```json
{
  "overrides": [
    {
      "files": ["*.abc"],
      "options": {
        "parser": "html"
      }
    }
  ]
}
```

---

## Solution 2: Document Selectors

For more advanced cases, you can use the `prettier.documentSelectors` setting to explicitly register file patterns:

```json
{
  "prettier.documentSelectors": ["**/*.abc"]
}
```

This tells the extension to register as a formatter for all `.abc` files.

**Note:** You still need the Prettier config override to specify the parser.

---

## Solution 3: Custom Language Identifiers

If another extension registers your file type with a custom language identifier (e.g., `my-custom-language`), you have two options:

### Option A: Override the Language

If you don't need the other extension's features:

```json
{
  "files.associations": {
    "*.abc": "html"
  }
}
```

### Option B: Add VS Code Language Support to Prettier

For a proper fix, the language identifier needs to be added to Prettier or the relevant plugin.

**How to contribute:**

1. Find the language definition file in Prettier or the plugin
2. Add your VS Code language identifier to `vscodeLanguageIds`
3. Submit a pull request

**Example from the XML plugin:**

```javascript
{
  name: "XML",
  parsers: ["xml"],
  extensions: [".xml", ".svg", ".xsd"],
  vscodeLanguageIds: ["xml", "svg"]  // Add new identifiers here
}
```

**Where to submit PRs:**

| Language                     | Repository                                                    |
| ---------------------------- | ------------------------------------------------------------- |
| CSS, SCSS, Less              | [prettier/prettier](https://github.com/prettier/prettier)     |
| JavaScript, TypeScript, JSON | [prettier/prettier](https://github.com/prettier/prettier)     |
| HTML, Vue, Angular           | [prettier/prettier](https://github.com/prettier/prettier)     |
| Markdown, YAML               | [prettier/prettier](https://github.com/prettier/prettier)     |
| XML                          | [prettier/plugin-xml](https://github.com/prettier/plugin-xml) |
| Other plugins                | Check the specific plugin repository                          |

---

## Troubleshooting

### Prettier Won't Format My Custom Extension

1. **Check the language identifier:**
   - Open the file in VS Code
   - Look at the language indicator in the bottom-right status bar
   - Note what language VS Code thinks the file is

2. **Verify Prettier supports the language:**
   - Click "Prettier" in the status bar
   - Check if the language is listed in the supported languages

3. **Check your configuration:**
   - Ensure `files.associations` maps to a supported language
   - Ensure your Prettier config has an override for the file pattern

### Common Issues

| Issue                          | Solution                                                     |
| ------------------------------ | ------------------------------------------------------------ |
| "No formatter installed"       | Add `files.associations` for the extension                   |
| Formatting doesn't match CLI   | Ensure VS Code language matches Prettier parser              |
| Plugin language not recognized | Use `prettier.documentSelectors` or contribute to the plugin |
