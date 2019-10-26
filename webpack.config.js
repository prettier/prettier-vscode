//@ts-check

"use strict";

const webpack = require("webpack");
const path = require("path");
// @ts-ignore
const extensionPackage = require("./package.json");

/**@type {import('webpack').Configuration}*/
const config = {
  target: "node", // vscode extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/

  entry: "./src/extension.ts", // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
  output: {
    // the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
    path: path.resolve(__dirname, "dist"),
    filename: "extension.js",
    libraryTarget: "commonjs2",
    devtoolModuleFilenameTemplate: "../[resource-path]"
  },
  plugins: [
    new webpack.DefinePlugin({
      EXTENSION_NAME: JSON.stringify(extensionPackage.name),
      EXTENSION_VERSION: JSON.stringify(extensionPackage.version)
    })
  ],
  devtool: "source-map",
  externals: {
    vscode: "commonjs vscode", // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
    prettier: "commonjs prettier",
    "spdx-exceptions": "spdx-exceptions",
    "spdx-license-ids": "spdx-license-ids",
    "spdx-license-ids/deprecated": "spdx-license-ids/deprecated",
    "applicationinsights-native-metrics": "applicationinsights-native-metrics" // This isn't actually used, it is just to disable a webpack error we don't care about.
  },
  resolve: {
    // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
    extensions: [".ts", ".js"]
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "ts-loader"
          }
        ]
      },
      {
        // vscode-nls-dev loader:
        // * rewrite nls-calls
        loader: "vscode-nls-dev/lib/webpack-loader",
        options: {
          base: path.join(__dirname, "src")
        }
      }
    ]
  }
};
module.exports = config;
