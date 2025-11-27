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

## Version Types

| Type       | Example             | When to Use                       |
| ---------- | ------------------- | --------------------------------- |
| Major      | `11.0.0` → `12.0.0` | Breaking changes                  |
| Minor      | `11.0.0` → `11.1.0` | New features, backward compatible |
| Patch      | `11.0.0` → `11.0.1` | Bug fixes                         |
| Prerelease | `12.0.0-preview.1`  | Testing before stable release     |

## Publishing a Stable Release

### 1. Update the Changelog

Add your changes under the `[unreleased]` section in `CHANGELOG.md` as you make changes:

```markdown
## [unreleased]

- Added new feature X
- Fixed bug Y
```

### 2. Bump the Version

Run one of these commands depending on the release type:

```bash
# Patch release (bug fixes): 11.0.0 → 11.0.1
npm version patch

# Minor release (new features): 11.0.0 → 11.1.0
npm version minor

# Major release (breaking changes): 11.0.0 → 12.0.0
npm version major
```

This automatically:

1. Updates `version` in `package.json`
2. Runs the `version` script which updates `CHANGELOG.md` (converts `[unreleased]` to the new version number)
3. Stages both `package.json` and `CHANGELOG.md`
4. Creates a git commit with message `v<version>`
5. Creates a git tag `v<version>`
6. Pushes the commit and tag to origin (via `postversion` script)

The GitHub Actions workflow will then automatically:

- Build the extension
- Create a GitHub Release with auto-generated notes
- Publish to the VS Code Marketplace

## Publishing a Prerelease

Prereleases allow testing new features before a stable release. VS Code users can opt-in to receive prerelease versions.

### 1. Bump to a Prerelease Version

```bash
# First prerelease for a new major version: 11.0.0 → 12.0.0-preview.0
npm version premajor

# First prerelease for a new minor version: 11.0.0 → 11.1.0-preview.0
npm version preminor

# First prerelease for a patch: 11.0.0 → 11.0.1-preview.0
npm version prepatch

# Increment existing prerelease: 12.0.0-preview.0 → 12.0.0-preview.1
npm version prerelease
```

> The `.npmrc` file configures `preview` as the default prerelease identifier.

> **Note:** The version script automatically skips changelog updates for prereleases. The `[unreleased]` section is preserved until the final stable release.

The commit and tag are automatically pushed. The workflow detects prerelease tags (containing `-preview`, `-beta`, `-alpha`, or `-rc`) and:

- Packages with `vsce package --pre-release`
- Creates a GitHub Release marked as prerelease
- Publishes to Marketplace with `vsce publish --pre-release`

### 2. Promote to Stable

When ready to release the stable version:

```bash
# Release the stable version: 12.0.0-preview.3 → 12.0.0
npm version major   # or minor/patch depending on what changed
```

This will update the changelog, moving all `[unreleased]` entries to the new stable version, and push automatically.

## Manual Publishing (Emergency)

If automated publishing fails, you can publish manually:

```bash
# Install vsce
npm install -g @vscode/vsce

# Package the extension
pnpm install
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

# Fix version and re-tag (will push automatically)
npm version 12.0.0
```
