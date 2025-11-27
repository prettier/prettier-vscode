# Writing a Good Issue

To help us diagnose your problem quickly, please follow these guidelines when opening an issue.

## Before You Open an Issue

### 1. Check if it's a Prettier Core Issue

This extension only **integrates** Prettier into VS Code—it doesn't control how code is formatted.

**Test with the CLI:**

```bash
npx prettier --write yourfile.js
```

If the CLI produces the same result you're seeing in VS Code, the issue is with Prettier itself. Please report it to [prettier/prettier](https://github.com/prettier/prettier/issues).

### 2. Search Existing Issues

Your issue may already be reported. Search [existing issues](https://github.com/prettier/prettier-vscode/issues) before opening a new one.

### 3. Check the Troubleshooting Guide

Many common problems are covered in our [Troubleshooting Guide](troubleshooting.md).

---

## Opening an Issue

### Choose the Right Template

We have different issue templates for different types of problems:

| Template              | Use When                          |
| --------------------- | --------------------------------- |
| **Bug Report**        | Something isn't working correctly |
| **Feature Request**   | You want new functionality        |
| **Performance Issue** | Formatting is slow                |

Click "New Issue" and select the appropriate template. **Do not open blank issues**—they will be closed automatically.

### Required Information

All bug reports require:

| Field                       | Why We Need It                                                                                               |
| --------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Reproduction Repository** | Most issues are configuration-specific. Without a repo we can clone, we usually cannot diagnose the problem. |
| **Steps to Reproduce**      | Clear steps help us see exactly what you're experiencing.                                                    |
| **Prettier Extension Logs** | The logs show us what the extension is doing and often reveal the problem immediately.                       |
| **Environment Info**        | VS Code version, extension version, OS, Prettier version                                                     |

### Creating a Reproduction Repository

A reproduction repository is **the most important thing** you can provide. Here's how to create one:

1. Create a new **public** GitHub repository
2. Add the **minimum files** needed to reproduce the issue:
   - The file(s) that won't format correctly
   - Your `.prettierrc` or other Prettier config
   - `package.json` with your Prettier version and any plugins
3. Include a `README.md` with steps to reproduce

**Tips:**

- Simpler is better—remove anything not needed to reproduce the issue
- Make sure the issue actually reproduces in your minimal repo
- Include the exact commands to run

### Getting Prettier Extension Logs

The extension logs are essential for diagnosing problems:

1. **Enable Debug Logs** (recommended for detailed info):
   - Open VS Code Settings
   - Search for "prettier debug"
   - Enable `Prettier: Enable Debug Logs`
   - Restart VS Code

2. **Reproduce the Issue:**
   - Open the file that has the problem
   - Run "Format Document" (Cmd/Ctrl + Shift + P → Format Document)

3. **Copy the Logs:**
   - Click "Prettier" in the VS Code status bar (bottom right)
   - Copy **all** the text from the Output panel
   - Paste into the issue (not a screenshot!)

---

## What Happens After You Submit

1. **Automated Triage** — Our bot checks your issue and may ask for missing information
2. **Duplicate Check** — We'll check if this is a known issue
3. **Review** — A maintainer will review your issue

### If We Ask for More Information

- Issues marked `need-more-info` require your response
- **Issues without the requested information will be closed after 7 days**
- You can always open a new issue once you have the required information

---

## Tips for Getting Help Faster

1. **Provide a reproduction repo** — Issues with repos get addressed much faster
2. **Be specific** — "It doesn't work" is hard to diagnose; "Formatting removes semicolons in .tsx files" is actionable
3. **Include logs** — Always include the Prettier output log
4. **One issue per report** — Don't combine multiple problems in one issue
5. **Be patient and respectful** — Maintainers are volunteers

---

## Issue Types We Cannot Help With

| Type                         | Where to Go                                                                  |
| ---------------------------- | ---------------------------------------------------------------------------- |
| Prettier formatting behavior | [prettier/prettier](https://github.com/prettier/prettier/issues)             |
| Configuration questions      | [Stack Overflow](https://stackoverflow.com/questions/tagged/prettier-vscode) |
| General VS Code issues       | [VS Code Issues](https://github.com/microsoft/vscode/issues)                 |
