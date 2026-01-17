# Troubleshooting Guide

This guide covers common issues with the Prettier VS Code extension and how to resolve them.

## Table of Contents

- [Prettier Not Formatting](#prettier-not-formatting)
- [Wrong Formatting / Unexpected Results](#wrong-formatting--unexpected-results)
- [Performance Issues](#performance-issues)
- [Plugin Issues](#plugin-issues)
- [Configuration Issues](#configuration-issues)
- [Getting Debug Logs](#getting-debug-logs)

---

## Prettier Not Formatting

### Check that Prettier is the Default Formatter

1. Open a file you want to format
2. Open Command Palette (`Cmd/Ctrl + Shift + P`)
3. Run "Format Document With..."
4. Select "Configure Default Formatter..."
5. Choose "Prettier - Code formatter"

Or add to your `settings.json`:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

### Combined Language Settings Not Working

**Note:** VS Code does **NOT** support combined language settings for `editor.defaultFormatter`. While VS Code 1.63+ supports combining multiple languages for some settings using syntax like `[javascript][typescript]`, this feature does not work for the `editor.defaultFormatter` setting.

❌ **This will NOT work:**

```json
{
  "[markdown][yaml]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

✅ **Instead, use separate language blocks:**

```json
{
  "[markdown]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[yaml]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

This is a VS Code core limitation, not an issue with the Prettier extension. The combined syntax works for other editor settings (like `editor.wordWrap`, `editor.tabSize`, etc.) but not for `editor.defaultFormatter`.

### Check for Errors in the Output Panel

1. Click "Prettier" in the VS Code status bar (bottom right)
2. Check for any error messages in the output panel

### Ensure Prettier is Installed

If you see "Using bundled Prettier", the extension is working but using its built-in Prettier version. For project-specific formatting:

```bash
npm install --save-dev --save-exact prettier
```

### Check `.prettierignore`

Your file might be ignored. Check if:

- The file is in `.prettierignore`
- The file is in `node_modules` (ignored by default)
- The file matches a pattern in your ignore file

### Check `prettier.requireConfig`

If `prettier.requireConfig` is `true`, Prettier won't format files unless a config file exists:

```json
{
  "prettier.requireConfig": true
}
```

Either set this to `false` or create a `.prettierrc` file.

---

## Wrong Formatting / Unexpected Results

### This is Usually a Prettier Core Issue

If you don't like how Prettier formats your code, this is **not a VS Code extension issue**. The extension just runs Prettier - it doesn't control formatting rules.

**To verify:**

```bash
npx prettier --write yourfile.js
```

If the CLI produces the same result, report the issue to [prettier/prettier](https://github.com/prettier/prettier/issues).

### Check Which Prettier Version is Being Used

1. Click "Prettier" in the status bar
2. Look for "Prettier version: X.X.X"

Your project's local version takes precedence over the bundled version.

### Check Your Configuration

Prettier reads configuration from multiple sources:

1. `.prettierrc`, `.prettierrc.json`, `.prettierrc.js`, etc.
2. `prettier` key in `package.json`
3. `.editorconfig` (if `prettier.useEditorConfig` is true)
4. VS Code settings (only if no config file exists)

To see which config is being used:

```bash
npx prettier --find-config-path yourfile.js
```

---

## Performance Issues

### Large Files

Prettier can be slow on very large files. Consider:

- Breaking large files into smaller modules
- Adding specific files to `.prettierignore`

### Many Plugins

Each plugin adds processing time. If you have many plugins, formatting will be slower.

### Enable Debug Logs

Add to your VS Code settings:

```json
{
  "prettier.enableDebugLogs": true
}
```

Then check the Prettier output panel for timing information.

### Test with CLI

Compare extension performance with CLI:

```bash
time npx prettier --write yourfile.js
```

If the CLI is also slow, the issue is with Prettier, not the extension.

---

## Plugin Issues

### Plugin Not Working

1. Ensure the plugin is installed locally:

   ```bash
   npm install --save-dev prettier-plugin-xyz
   ```

2. Check that Prettier is also installed locally (plugins require local Prettier)

3. Some plugins need explicit configuration in `.prettierrc`:
   ```json
   {
     "plugins": ["prettier-plugin-xyz"]
   }
   ```

### Plugin Conflicts

If you have multiple plugins, they might conflict. Try disabling plugins one at a time to identify the conflict.

### Workspace Trust

Plugins only work in trusted workspaces. If you see "This workspace is not trusted", click the trust button in VS Code.

---

## Configuration Issues

### VS Code Settings Not Applied

VS Code settings for Prettier are **only used when no configuration file exists**. If you have a `.prettierrc`, those settings override VS Code settings.

### Config File Not Found

Check config file location:

```bash
npx prettier --find-config-path yourfile.js
```

### Multiple Config Files

Prettier uses the nearest config file to the file being formatted. This can cause different files to use different configs.

### EditorConfig Conflicts

If you have an `.editorconfig` file, it might override your Prettier settings. Either:

- Update `.editorconfig` to match your Prettier config
- Disable EditorConfig: `"prettier.useEditorConfig": false`

---

## Getting Debug Logs

When reporting issues, always include debug logs:

1. Add to VS Code settings:

   ```json
   {
     "prettier.enableDebugLogs": true
   }
   ```

2. Reload VS Code

3. Try to format the problematic file

4. Click "Prettier" in the status bar

5. Copy **all** the output

### Information to Include in Bug Reports

- Prettier extension version
- VS Code version
- Operating system
- Prettier version (`npx prettier --version`)
- Contents of your Prettier config file
- Full Prettier output log
- A link to a repository that reproduces the issue

---

## Still Having Issues?

1. Search [existing issues](https://github.com/prettier/prettier-vscode/issues)
2. Check if it's a [Prettier core issue](https://github.com/prettier/prettier/issues)
3. Open a [new issue](https://github.com/prettier/prettier-vscode/issues/new/choose) with:
   - A reproduction repository
   - Debug logs
   - All the information listed above
