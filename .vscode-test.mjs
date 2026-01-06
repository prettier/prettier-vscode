import { defineConfig } from "@vscode/test-cli";

export default defineConfig({
  files: "out/test/suite/**/*.test.cjs",
  mocha: {
    ui: "bdd",
    timeout: 10000,
  },
  launchArgs: [
    "./test-fixtures/test.code-workspace",
    "--skip-welcome",
    "--disable-extensions",
    "--skip-release-notes",
    "--enable-proposed-api",
  ],
  settings: {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "prettier.enableDebugLogs": true,
    "security.workspace.trust.enabled": false,
  },
});
