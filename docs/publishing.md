# Publishing Guide

This document explains how to publish new versions of the Prettier VS Code extension.

## Overview

Publishing is automated via GitHub Actions. When you push a tag starting with `v`, the workflow will:

1. Run lint and tests
2. Build and package the extension
3. Create a GitHub Release
4. Publish to the VS Code Marketplace

## Prerequisites

- Write access to the repository
- `MARKETPLACE_TOKEN` secret configured in GitHub (for automated publishing)

## Release Commands

All releases are handled through the `npm run release` command:

```bash
# Patch release (bug fixes): 11.0.0 → 11.0.1
npm run release patch

# Minor release (new features): 11.0.0 → 11.1.0
npm run release minor

# Major release (breaking changes): 11.0.0 → 12.0.0
npm run release major

# Preview release: 11.0.0 → 11.1.0-preview.1
npm run release preview
```

## Version Types

| Type    | Command                   | Example                       |
| ------- | ------------------------- | ----------------------------- |
| Major   | `npm run release major`   | `11.0.0` → `12.0.0`           |
| Minor   | `npm run release minor`   | `11.0.0` → `11.1.0`           |
| Patch   | `npm run release patch`   | `11.0.0` → `11.0.1`           |
| Preview | `npm run release preview` | `11.0.0` → `11.1.0-preview.1` |

## Publishing a Stable Release

### 1. Update the Changelog

Add your changes under the `[Unreleased]` section in `CHANGELOG.md` as you make changes:

```markdown
## [Unreleased]

- Added new feature X
- Fixed bug Y
```

### 2. Run the Release Command

```bash
npm run release patch   # or minor, major
```

This automatically:

1. Calculates the new version number
2. Updates `version` in `package.json`
3. Updates `CHANGELOG.md` (converts `[Unreleased]` to the new version)
4. Creates a git commit with message `v<version>`
5. Creates a git tag `v<version>`
6. Pushes the commit and tag to origin

The GitHub Actions workflow will then automatically:

- Build the extension
- Create a GitHub Release with auto-generated notes
- Publish to the VS Code Marketplace

## Publishing a Preview Release

Preview releases allow testing new features before a stable release. VS Code users can opt-in to receive preview versions.

### Creating a Preview

```bash
# First preview (from stable): 11.0.0 → 11.1.0-preview.1
npm run release preview

# Subsequent previews: 11.1.0-preview.1 → 11.1.0-preview.2
npm run release preview
```

The workflow detects preview tags and:

- Packages with `vsce package --pre-release`
- Creates a GitHub Release marked as prerelease
- Publishes to Marketplace with `vsce publish --pre-release`

### Promoting to Stable

When ready to release the stable version:

```bash
# From preview to stable: 11.1.0-preview.3 → 11.1.0
npm run release minor
```

This will update the changelog (moving all `[Unreleased]` entries to the new stable version) and push automatically.

## Manual Publishing (Emergency)

If automated publishing fails, you can publish manually:

```bash
# Install vsce
npm install -g @vscode/vsce

# Package the extension
npm install
npx @vscode/vsce package

# Publish (requires personal access token)
npx @vscode/vsce publish -p <YOUR_TOKEN>

# Or for prerelease
npx @vscode/vsce publish --pre-release -p <YOUR_TOKEN>
```

## Troubleshooting

### Release workflow didn't trigger

- Ensure the tag starts with `v` (e.g., `v12.0.0`)
- Check that the tag was pushed: `git ls-remote --tags origin`

### Marketplace publish failed

- Verify `MARKETPLACE_TOKEN` secret is valid and not expired
- Check the [VS Code Marketplace Publisher Dashboard](https://marketplace.visualstudio.com/manage)

### Version mismatch

If `package.json` version doesn't match the tag:

```bash
# Delete the incorrect tag locally and remotely
git tag -d v12.0.0
git push origin :refs/tags/v12.0.0

# Re-run the release
npm run release minor  # or appropriate type
```
