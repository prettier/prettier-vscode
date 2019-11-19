//@ts-check

"use strict";

const webpack = require("webpack");
const path = require("path");
// @ts-ignore
const extensionPackage = require("./package.json");

/**@type {import('webpack').Configuration}*/
const config = {
  target: "node",
  entry: "./src/extension.ts",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "extension.js",
    libraryTarget: "commonjs2",
    /* cspell: disable-next-line */
    devtoolModuleFilenameTemplate: "../[resource-path]"
  },
  plugins: [
    new webpack.EnvironmentPlugin({
      EXTENSION_NAME: JSON.stringify(extensionPackage.name),
      EXTENSION_VERSION: JSON.stringify(extensionPackage.version)
    })
  ],
  /* cspell: disable-next-line */
  devtool: "source-map",
  externals: {
    vscode: "commonjs vscode",
    prettier: "commonjs prettier",
    /* cspell: disable-next-line */
    "spdx-exceptions": "spdx-exceptions",
    /* cspell: disable-next-line */
    "spdx-license-ids": "spdx-license-ids",
    /* cspell: disable-next-line */
    "spdx-license-ids/deprecated": "spdx-license-ids/deprecated",
    "applicationinsights-native-metrics": "applicationinsights-native-metrics" // This isn't actually used, it is just to disable a webpack error we don't care about.
  },
  resolve: {
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
