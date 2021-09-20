/* eslint-disable @typescript-eslint/no-var-requires */
"use strict";

// eslint-disable-next-line no-undef
const webpack = require("webpack");
// eslint-disable-next-line no-undef
const path = require("path");
// eslint-disable-next-line no-undef
const extensionPackage = require("./package.json");

/**@type {import('webpack').Configuration}*/
const config = {
  target: "node",
  entry: "./src/extension.ts",
  output: {
    // eslint-disable-next-line no-undef
    path: path.resolve(__dirname, "dist"),
    filename: "extension.js",
    libraryTarget: "commonjs2",
    /* cspell: disable-next-line */
    devtoolModuleFilenameTemplate: "../[resource-path]",
  },
  plugins: [
    new webpack.EnvironmentPlugin({
      EXTENSION_NAME: `${extensionPackage.publisher}.${extensionPackage.name}`,
      EXTENSION_VERSION: extensionPackage.version,
    }),
  ],
  /* cspell: disable-next-line */
  devtool: "source-map",
  externals: {
    vscode: "commonjs vscode",
    prettier: "commonjs prettier",
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "ts-loader",
          },
        ],
      },
      {
        // vscode-nls-dev loader:
        // * rewrite nls-calls
        loader: "vscode-nls-dev/lib/webpack-loader",
        options: {
          // eslint-disable-next-line no-undef
          base: path.join(__dirname, "src"),
        },
      },
    ],
  },
};

const browserConfig = /** @type WebpackConfig */ {
  mode: "none",
  target: "webworker", // web extensions run in a webworker context
  entry: {
    "web-extension": "./src/extension.ts",
  },
  output: {
    filename: "[name].js",
    // eslint-disable-next-line no-undef
    path: path.join(__dirname, "./dist"),
    libraryTarget: "commonjs",
  },
  resolve: {
    mainFields: ["module", "main"],
    extensions: [".ts", ".js", ".mjs"], // support ts-files and js-files
    alias: {
      // replace the node based resolver with the browser version
      "./ModuleResolver": "./BrowserModuleResolver",
    },
    fallback: {
      // eslint-disable-next-line no-undef
      path: require.resolve("path-browserify"),
      // eslint-disable-next-line no-undef
      util: require.resolve("util/"),
      os: false,
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "ts-loader",
          },
        ],
      },
    ],
  },
  externals: {
    vscode: "commonjs vscode", // ignored because it doesn't exist
  },
  performance: {
    hints: false,
  },
  devtool: "source-map",
  plugins: [
    new webpack.ProvidePlugin({
      process: "process/browser",
      babel: "prettier/esm/parser-babel.mjs",
    }),
    new webpack.DefinePlugin({
      "process.env": JSON.stringify({}),
      "process.env.BROWSER_ENV": JSON.stringify("true"),
    }),
  ],
};

// eslint-disable-next-line no-undef
module.exports = [config, browserConfig];
