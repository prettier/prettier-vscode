---
applyTo: ".github/workflows/*.yaml"
---

# GitHub Actions Workflow Guidelines

## Package Manager

- Use `npm` as the package manager
- Use `actions/setup-node@v6` with `node-version-file: ".nvmrc"`

## Checkout and Setup Pattern

```yaml
- uses: actions/checkout@v6
- uses: actions/setup-node@v6
  with:
    node-version-file: ".nvmrc"
- run: npm ci
```

## Testing

- Linux tests require Xvfb for display: `/usr/bin/Xvfb :99 -screen 0 1024x768x24`
- Set `DISPLAY: ":99.0"` environment variable for tests on Linux
- Tests run via `npm test`
- Include `pnpm/action-setup@v4` in test jobs - some test fixtures use `packageManager: pnpm` to verify pnpm compatibility

## Permissions

- Use minimal required permissions for each job
- Common permissions: `issues: write`, `pull-requests: write`, `contents: read`

## Scripts in Workflows

- For `actions/github-script@v7`, only use built-in Node.js modules (fs, path, etc.)
- Do not use external npm packages like `js-yaml` in github-script (they are not available)
- Use JSON format for config files that need to be read in workflows
