import esbuild from "esbuild";
import fs from "fs";
import path from "path";

const production = process.argv.includes("--production");
const watch = process.argv.includes("--watch");

// Clean dist directory (skip in watch mode)
if (!watch) {
  if (fs.existsSync("dist")) {
    fs.rmSync("dist", { recursive: true, force: true });
  }
}

const extensionPackage = JSON.parse(
  fs.readFileSync(new URL("./package.json", import.meta.url), "utf-8"),
);

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
  name: "esbuild-problem-matcher",
  setup(build) {
    build.onStart(() => {
      console.log("[watch] build started");
    });
    build.onEnd((result) => {
      result.errors.forEach(({ text, location }) => {
        console.error(`✘ [ERROR] ${text}`);
        if (location) {
          console.error(
            `    ${location.file}:${location.line}:${location.column}:`,
          );
        }
      });
      console.log("[watch] build finished");
    });
  },
};

/**
 * @type {import('esbuild').Plugin}
 */
const browserAliasPlugin = {
  name: "browser-alias",
  setup(build) {
    // Replace ModuleResolverNode imports with ModuleResolverWeb for browser build
    // Match both ./ModuleResolverNode and ./ModuleResolverNode.js patterns
    build.onResolve({ filter: /\.\/ModuleResolverNode(\.js)?$/ }, (args) => {
      return {
        path: path.join(args.resolveDir, "ModuleResolverWeb.ts"),
      };
    });
  },
};

/**
 * Node extension configuration
 * Uses ESM format for native ES module support, following the pattern from
 * https://github.com/microsoft/vscode-github-issue-notebooks
 * @type {import('esbuild').BuildOptions}
 */
const nodeConfig = {
  entryPoints: ["src/extension.ts"],
  bundle: true,
  format: "esm",
  minify: production,
  sourcemap: true,
  platform: "neutral",
  target: ["node22"],
  outfile: "dist/extension.js",
  // Keep vscode external - provided by the VS Code extension host
  // Keep prettier external - loaded dynamically at runtime
  // Keep Node.js built-ins external - available in the extension host runtime
  external: [
    "vscode",
    "prettier",
    "fs",
    "fs/promises",
    "path",
    "os",
    "url",
    "util",
    "module",
    "child_process",
  ],
  define: {
    "process.env.EXTENSION_NAME": JSON.stringify(
      `${extensionPackage.publisher}.${extensionPackage.name}`,
    ),
    "process.env.EXTENSION_VERSION": JSON.stringify(extensionPackage.version),
  },
  logLevel: "silent",
  plugins: [esbuildProblemMatcherPlugin],
};

/**
 * @type {import('esbuild').Plugin}
 */
const browserShimsPlugin = {
  name: "browser-shims",
  setup(build) {
    // Provide empty shims for Node.js built-ins not available in browser
    build.onResolve({ filter: /^os$/ }, () => {
      return { path: "os", namespace: "browser-shim" };
    });
    build.onResolve({ filter: /^fs$/ }, () => {
      return { path: "fs", namespace: "browser-shim" };
    });
    build.onResolve({ filter: /^url$/ }, () => {
      return { path: "url", namespace: "browser-shim" };
    });
    build.onResolve({ filter: /^module$/ }, () => {
      return { path: "module", namespace: "browser-shim" };
    });
    build.onLoad({ filter: /.*/, namespace: "browser-shim" }, (args) => {
      if (args.path === "os") {
        return {
          contents: `export function homedir() { return ""; }`,
          loader: "js",
        };
      }
      if (args.path === "fs") {
        // Provide a minimal fs shim - these functions won't be called in browser
        // but need to exist to satisfy imports
        return {
          contents: `
            export const promises = {
              access: async () => { throw new Error("Not available in browser"); },
              lstat: async () => { throw new Error("Not available in browser"); },
              readdir: async () => [],
              readFile: async () => { throw new Error("Not available in browser"); },
            };
            export default { promises };
          `,
          loader: "js",
        };
      }
      if (args.path === "url") {
        // Provide a minimal url shim for browser
        return {
          contents: `
            export function pathToFileURL(path) {
              return new URL("file://" + path);
            }
          `,
          loader: "js",
        };
      }
      if (args.path === "module") {
        // Provide a minimal module shim - createRequire won't be called in browser
        return {
          contents: `
            export function createRequire() {
              return { resolve: () => { throw new Error("Not available in browser"); } };
            }
          `,
          loader: "js",
        };
      }
    });
  },
};

/**
 * Browser/web extension configuration (CJS required for web extension host)
 * @type {import('esbuild').BuildOptions}
 */
const browserConfig = {
  entryPoints: ["src/extension.ts"],
  bundle: true,
  format: "cjs",
  minify: production,
  sourcemap: !production,
  sourcesContent: false,
  platform: "browser",
  target: "es2020",
  outfile: "dist/web-extension.cjs",
  external: ["vscode"],
  define: {
    "process.env.EXTENSION_NAME": JSON.stringify(
      `${extensionPackage.publisher}.${extensionPackage.name}`,
    ),
    "process.env.EXTENSION_VERSION": JSON.stringify(extensionPackage.version),
    "process.env.BROWSER_ENV": JSON.stringify("true"),
    global: "globalThis",
  },
  alias: {
    path: "path-browserify",
  },
  banner: {
    js: `var process = {env: {EXTENSION_NAME: "${extensionPackage.publisher}.${extensionPackage.name}", EXTENSION_VERSION: "${extensionPackage.version}", BROWSER_ENV: "true"}, platform: "browser", cwd: function() { return "/"; }, nextTick: function(cb) { setTimeout(cb, 0); }};`,
  },
  logLevel: "silent",
  plugins: [
    browserAliasPlugin,
    browserShimsPlugin,
    esbuildProblemMatcherPlugin,
  ],
};

/**
 * Desktop test bundle configuration
 * Uses CJS format with .cjs extension so tests work with "type": "module" in package.json
 * @type {import('esbuild').BuildOptions}
 */
const desktopTestConfig = {
  entryPoints: ["src/test/suite/*.test.ts"],
  bundle: true, // Bundle each test file separately
  format: "cjs",
  minify: false,
  sourcemap: true,
  platform: "node",
  target: "node20",
  outdir: "out/test/suite",
  outExtension: { ".js": ".cjs" },
  external: ["vscode", "mocha", "prettier"],
  logLevel: "silent",
  plugins: [esbuildProblemMatcherPlugin],
};

/**
 * Web test bundle configuration
 * Uses CJS format with .cjs extension since package.json has "type": "module"
 * @type {import('esbuild').BuildOptions}
 */
const webTestConfig = {
  entryPoints: ["src/test/web/suite/index.ts"],
  bundle: true,
  format: "cjs",
  minify: false,
  sourcemap: true,
  sourcesContent: false,
  platform: "browser",
  outfile: "dist/web/test/suite/index.cjs",
  external: ["vscode"],
  define: {
    "process.env.BROWSER_ENV": JSON.stringify("true"),
    "process.platform": JSON.stringify("browser"),
  },
  alias: {
    path: "path-browserify",
  },
  logLevel: "silent",
  plugins: [esbuildProblemMatcherPlugin],
};

async function main() {
  const nodeCtx = await esbuild.context(nodeConfig);
  const browserCtx = await esbuild.context(browserConfig);
  const desktopTestCtx = await esbuild.context(desktopTestConfig);
  const webTestCtx = await esbuild.context(webTestConfig);

  if (watch) {
    await Promise.all([
      nodeCtx.watch(),
      browserCtx.watch(),
      desktopTestCtx.watch(),
      webTestCtx.watch(),
    ]);
  } else {
    await Promise.all([
      nodeCtx.rebuild(),
      browserCtx.rebuild(),
      desktopTestCtx.rebuild(),
      webTestCtx.rebuild(),
    ]);
    await Promise.all([
      nodeCtx.dispose(),
      browserCtx.dispose(),
      desktopTestCtx.dispose(),
      webTestCtx.dispose(),
    ]);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
