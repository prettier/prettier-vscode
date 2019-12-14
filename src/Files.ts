/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * COPIED FROM: https://github.com/microsoft/vscode-languageserver-node/blob/master/server/src/files.ts
 * ------------------------------------------------------------------------------------------ */
"use strict";

import {
  ChildProcess,
  fork,
  spawnSync,
  SpawnSyncOptionsWithStringEncoding
} from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as url from "url";

/**
 * @deprecated Use the `vscode-uri` npm module which provides a more
 * complete implementation of handling VS Code URIs.
 */
export function uriToFilePath(uri: string): string | undefined {
  const parsed = url.parse(uri);
  if (parsed.protocol !== "file:" || !parsed.path) {
    return undefined;
  }
  const segments = parsed.path.split("/");
  for (let i = 0, len = segments.length; i < len; i++) {
    segments[i] = decodeURIComponent(segments[i]);
  }
  if (process.platform === "win32" && segments.length > 1) {
    const first = segments[0];
    const second = segments[1];
    // Do we have a drive letter and we started with a / which is the
    // case if the first segment is empty (see split above)
    if (first.length === 0 && second.length > 1 && second[1] === ":") {
      // Remove first slash
      segments.shift();
    }
  }
  return path.normalize(segments.join("/"));
}

function isWindows(): boolean {
  return process.platform === "win32";
}

export function resolve(
  moduleName: string,
  nodePath: string | undefined,
  cwd: string | undefined,
  tracer: (message: string, verbose?: string) => void
): Promise<string> {
  interface Message {
    c: string;
    s?: boolean;
    a?: any;
    r?: any;
  }

  const nodePathKey: string = "NODE_PATH";

  const app: string = [
    "var p = process;",
    "p.on('message',function(m){",
    "if(m.c==='e'){",
    "p.exit(0);",
    "}",
    "else if(m.c==='rs'){",
    "try{",
    "var r=require.resolve(m.a);",
    "p.send({c:'r',s:true,r:r});",
    "}",
    "catch(err){",
    "p.send({c:'r',s:false});",
    "}",
    "}",
    "});"
  ].join("");

  // tslint:disable-next-line: no-shadowed-variable
  return new Promise<any>((resolve, reject) => {
    const env = process.env;
    const newEnv = Object.create(null);
    Object.keys(env).forEach(key => (newEnv[key] = env[key]));

    if (nodePath && fs.existsSync(nodePath) /* see issue 545 */) {
      // tslint:disable-next-line: prefer-conditional-expression
      if (newEnv[nodePathKey]) {
        newEnv[nodePathKey] = nodePath + path.delimiter + newEnv[nodePathKey];
      } else {
        newEnv[nodePathKey] = nodePath;
      }
      if (tracer) {
        tracer(`NODE_PATH value is: ${newEnv[nodePathKey]}`);
      }
    }
    newEnv.ELECTRON_RUN_AS_NODE = "1";
    try {
      const cp: ChildProcess = fork("", [], {
        cwd,
        env: newEnv,
        execArgv: ["-e", app]
      } as any);
      if (cp.pid === void 0) {
        reject(
          new Error(
            `Starting process to resolve node module  ${moduleName} failed`
          )
        );
        return;
      }
      cp.on("error", (error: any) => {
        reject(error);
      });
      // tslint:disable-next-line: no-shadowed-variable
      cp.on("message", (message: Message) => {
        if (message.c === "r") {
          cp.send({ c: "e" });
          if (message.s) {
            resolve(message.r);
          } else {
            reject(new Error(`Failed to resolve module: ${moduleName}`));
          }
        }
      });
      const message: Message = {
        c: "rs",
        // tslint:disable-next-line: object-literal-sort-keys
        a: moduleName
      };
      cp.send(message);
    } catch (error) {
      reject(error);
    }
  });
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
    encoding: "utf8"
  };
  if (isWindows()) {
    npmCommand = "npm.cmd";
    options.shell = true;
  }

  // tslint:disable-next-line: no-empty
  const handler = () => {};
  try {
    process.on("SIGPIPE", handler);
    const stdout = spawnSync(npmCommand, ["config", "get", "prefix"], options)
      .stdout;

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
    encoding: "utf8"
  };

  if (isWindows()) {
    yarnCommand = "yarn.cmd";
    options.shell = true;
  }

  // tslint:disable-next-line: no-empty
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

// tslint:disable-next-line: no-namespace
export namespace FileSystem {
  // tslint:disable-next-line: variable-name
  let _isCaseSensitive: boolean | undefined;
  export function isCaseSensitive(): boolean {
    if (_isCaseSensitive !== void 0) {
      return _isCaseSensitive;
    }
    if (process.platform === "win32") {
      _isCaseSensitive = false;
    } else {
      // convert current file name to upper case / lower case and check if file exists
      // (guards against cases when name is already all uppercase or lowercase)
      _isCaseSensitive =
        !fs.existsSync(__filename.toUpperCase()) ||
        !fs.existsSync(__filename.toLowerCase());
    }
    return _isCaseSensitive;
  }

  export function isParent(parent: string, child: string): boolean {
    if (isCaseSensitive()) {
      return path.normalize(child).indexOf(path.normalize(parent)) === 0;
    } else {
      return (
        path
          .normalize(child)
          .toLowerCase()
          .indexOf(path.normalize(parent).toLowerCase()) === 0
      );
    }
  }
}

export function resolveModulePath(
  workspaceRoot: string,
  moduleName: string,
  nodePath: string,
  tracer: (message: string, verbose?: string) => void
): Promise<string> {
  if (nodePath) {
    if (!path.isAbsolute(nodePath)) {
      nodePath = path.join(workspaceRoot, nodePath);
    }

    return (
      resolve(moduleName, nodePath, nodePath, tracer)
        .then(value => {
          if (FileSystem.isParent(nodePath, value)) {
            return value;
          } else {
            return Promise.reject<string>(
              new Error(`Failed to load ${moduleName} from node path location.`)
            );
          }
        })
        // tslint:disable-next-line: variable-name
        .then<string, string>(undefined, (_error: any) => {
          return resolve(
            moduleName,
            resolveGlobalNodePath(tracer),
            workspaceRoot,
            tracer
          );
        })
    );
  } else {
    return resolve(
      moduleName,
      resolveGlobalNodePath(tracer),
      workspaceRoot,
      tracer
    );
  }
}
