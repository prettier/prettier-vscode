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
    // Replace ModuleResolver imports with BrowserModuleResolver for browser build
    build.onResolve({ filter: /\.\/ModuleResolver$/ }, (args) => {
      return {
        path: path.join(args.resolveDir, "BrowserModuleResolver.ts"),
      };
    });
  },
};


/**
 * Node extension configuration
 * @type {import('esbuild').BuildOptions}
 */
const nodeConfig = {
  entryPoints: ["src/extension.ts"],
  bundle: true,
  format: "cjs",
  minify: production,
  sourcemap: !production,
  sourcesContent: false,
  platform: "node",
  outfile: "dist/extension.js",
  external: ["vscode", "prettier"],
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
    build.onLoad({ filter: /.*/, namespace: "browser-shim" }, (args) => {
      if (args.path === "os") {
        return {
          contents: `export function homedir() { return ""; }`,
          loader: "js",
        };
      }
    });
  },
};


/**
 * Browser/web extension configurationn
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
  outfile: "dist/web-extension.js",
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
 * Web test bundle configuration
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
  outfile: "dist/web/test/suite/index.js",
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

function copyWorkerFile() {
  // Copy to dist (for production/esbuild bundle)
  const distWorkerDir = "dist/worker";
  if (!fs.existsSync(distWorkerDir)) {
    fs.mkdirSync(distWorkerDir, { recursive: true });
  }
  fs.copyFileSync(
    "src/worker/prettier-instance-worker.js",
    "dist/worker/prettier-instance-worker.js",
  );

  // Copy to out (for tests/tsc output)
  const outWorkerDir = "out/worker";
  if (!fs.existsSync(outWorkerDir)) {
    fs.mkdirSync(outWorkerDir, { recursive: true });
  }
  fs.copyFileSync(
    "src/worker/prettier-instance-worker.js",
    "out/worker/prettier-instance-worker.js",
  );
}

async function main() {
  const nodeCtx = await esbuild.context(nodeConfig);
  const browserCtx = await esbuild.context(browserConfig);
  const webTestCtx = await esbuild.context(webTestConfig);

  // Copy worker file
  copyWorkerFile();

  if (watch) {
    // Watch the worker file for changes
    fs.watchFile("src/worker/prettier-instance-worker.js", () => {
      console.log("[watch] copying worker file");
      copyWorkerFile();
    });

    await Promise.all([
      nodeCtx.watch(),
      browserCtx.watch(),
      webTestCtx.watch(),
    ]);
  } else {
    await Promise.all([
      nodeCtx.rebuild(),
      browserCtx.rebuild(),
      webTestCtx.rebuild(),
    ]);
    await Promise.all([
      nodeCtx.dispose(),
      browserCtx.dispose(),
      webTestCtx.dispose(),
    ]);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
