/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * COPIED FROM: https://github.com/microsoft/vscode-languageserver-node/blob/master/server/src/files.ts
 * ------------------------------------------------------------------------------------------ */

import { spawnSync, SpawnSyncOptionsWithStringEncoding } from "child_process";
import * as path from "path";

function isWindows(): boolean {
  return process.platform === "win32";
}

/**
 * Resolve the global npm package path.
 * @deprecated Since this depends on the used package manager and their version the best is that servers
 * implement this themselves since they know best what kind of package managers to support.
 * @param tracer the tracer to use
 */
export function resolveGlobalNodePath(
  tracer?: (message: string) => void
): string | undefined {
  let npmCommand = "npm";
  const options: SpawnSyncOptionsWithStringEncoding = {
    encoding: "utf8",
  };
  if (isWindows()) {
    npmCommand = "npm.cmd";
    options.shell = true;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const handler = () => {};
  try {
    process.on("SIGPIPE", handler);
    const stdout = spawnSync(
      npmCommand,
      ["config", "get", "prefix"],
      options
    ).stdout;

    if (!stdout) {
      if (tracer) {
        tracer(`'npm config get prefix' didn't return a value.`);
      }
      return undefined;
    }
    const prefix = stdout.trim();
    if (tracer) {
      tracer(`'npm config get prefix' value is: ${prefix}`);
    }

    if (prefix.length > 0) {
      if (isWindows()) {
        return path.join(prefix, "node_modules");
      } else {
        return path.join(prefix, "lib", "node_modules");
      }
    }
    return undefined;
  } catch (err) {
    return undefined;
  } finally {
    process.removeListener("SIGPIPE", handler);
  }
}

interface YarnJsonFormat {
  type: string;
  data: string;
}

/*
 * Resolve the global yarn package path.
 * @deprecated Since this depends on the used package manager and their version the best is that servers
 * implement this themselves since they know best what kind of package managers to support.
 * @param tracer the tracer to use
 */
export function resolveGlobalYarnPath(
  tracer?: (message: string) => void
): string | undefined {
  let yarnCommand = "yarn";
  const options: SpawnSyncOptionsWithStringEncoding = {
    encoding: "utf8",
  };

  if (isWindows()) {
    yarnCommand = "yarn.cmd";
    options.shell = true;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const handler = () => {};
  try {
    process.on("SIGPIPE", handler);
    const results = spawnSync(
      yarnCommand,
      ["global", "dir", "--json"],
      options
    );

    const stdout = results.stdout;
    if (!stdout) {
      if (tracer) {
        tracer(`'yarn global dir' didn't return a value.`);
        if (results.stderr) {
          tracer(results.stderr);
        }
      }
      return undefined;
    }
    const lines = stdout.trim().split(/\r?\n/);
    for (const line of lines) {
      try {
        const yarn: YarnJsonFormat = JSON.parse(line);
        if (yarn.type === "log") {
          return path.join(yarn.data, "node_modules");
        }
      } catch (e) {
        // Do nothing. Ignore the line
      }
    }
    return undefined;
  } catch (err) {
    return undefined;
  } finally {
    process.removeListener("SIGPIPE", handler);
  }
}
