# On-Type Formatting

This extension now supports on-type formatting, which automatically formats your code as you type specific trigger characters.

## Trigger Characters

The following trigger characters will automatically format your code:

- `;` (semicolon) - Formats the document when you complete a statement
- `}` (closing brace) - Formats the document when you complete a block

## Enabling On-Type Formatting

On-type formatting is controlled by VS Code's built-in `editor.formatOnType` setting. To enable it:

1. Open VS Code settings (File > Preferences > Settings or `Ctrl+,`)
2. Search for "format on type"
3. Enable the `Editor: Format On Type` setting

Alternatively, add this to your `settings.json`:

```json
{
  "editor.formatOnType": true
}
```

## How It Works

When you type a trigger character (`;` or `}`), the extension will:

1. Check if the trigger character was typed at the end of a line
2. Format the entire document using Prettier
3. Apply minimal edits to update the document

The formatting respects all your Prettier configuration settings and `.prettierrc` files.

## Behavior

- **Smart triggering**: The formatter only triggers when you type the character at the end of meaningful content, not in the middle of editing
- **Respects ignore files**: Files listed in `.prettierignore` won't be formatted
- **Configuration aware**: Uses your project's Prettier configuration
- **Cancellable**: Long-running formatting operations can be cancelled by VS Code

## Performance

On-type formatting formats the entire document to ensure consistency. For very large files, you may want to:

- Use format-on-save instead (`editor.formatOnSave`)
- Disable on-type formatting for specific languages
- Use range formatting (select code and use Format Selection)

## Disabling On-Type Formatting

To disable on-type formatting while keeping other Prettier features:

```json
{
  "editor.formatOnType": false
}
```

This will keep format-on-save and manual formatting working while disabling automatic formatting as you type.
