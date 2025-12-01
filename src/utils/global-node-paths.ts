/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * COPIED FROM: https://github.com/microsoft/vscode-languageserver-node/blob/master/server/src/files.ts
 * Modified to use async execution
 * ------------------------------------------------------------------------------------------ */

import * as path from "path";
import { execAsync } from "./exec.js";

function isWindows(): boolean {
  return process.platform === "win32";
}

/** Default timeout for shell commands (5 seconds) */
const SHELL_TIMEOUT = 5000;

/**
 * Resolve the global npm package path asynchronously.
 * @param tracer the tracer to use
 */
export async function resolveGlobalNodePath(
  tracer?: (message: string) => void,
): Promise<string | undefined> {
  const npmCommand = isWindows() ? "npm.cmd" : "npm";

  try {
    const prefix = await execAsync(npmCommand, ["config", "get", "prefix"], {
      timeout: SHELL_TIMEOUT,
    });

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
  } catch (error) {
    if (tracer) {
      tracer(`'npm config get prefix' failed: ${error}`);
    }
    return undefined;
  }
}

interface YarnJsonFormat {
  type: string;
  data: string;
}

/**
 * Resolve the global yarn package path asynchronously.
 * @param tracer the tracer to use
 */
export async function resolveGlobalYarnPath(
  tracer?: (message: string) => void,
): Promise<string | undefined> {
  const yarnCommand = isWindows() ? "yarn.cmd" : "yarn";

  try {
    const stdout = await execAsync(yarnCommand, ["global", "dir", "--json"], {
      timeout: SHELL_TIMEOUT,
    });

    const lines = stdout.trim().split(/\r?\n/);
    for (const line of lines) {
      try {
        const yarn: YarnJsonFormat = JSON.parse(line);
        if (yarn.type === "log") {
          return path.join(yarn.data, "node_modules");
        }
      } catch {
        // Do nothing. Ignore the line
      }
    }
    return undefined;
  } catch (error) {
    if (tracer) {
      tracer(`'yarn global dir' failed: ${error}`);
    }
    return undefined;
  }
}

/**
 * Resolve the global pnpm package path asynchronously.
 * @param tracer the tracer to use
 */
export async function resolveGlobalPnpmPath(
  tracer?: (message: string) => void,
): Promise<string | undefined> {
  const pnpmCommand = isWindows() ? "pnpm.cmd" : "pnpm";

  try {
    const pnpmPath = await execAsync(pnpmCommand, ["root", "-g"], {
      timeout: SHELL_TIMEOUT,
    });

    if (tracer) {
      tracer(`'pnpm root -g' value is: ${pnpmPath}`);
    }

    return pnpmPath;
  } catch (error) {
    if (tracer) {
      tracer(`'pnpm root -g' failed: ${error}`);
    }
    return undefined;
  }
}
