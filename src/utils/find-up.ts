import * as fs from "fs";
import * as path from "path";

/**
 * Symbol to stop the search early
 */
export const FIND_UP_STOP = Symbol("findUpStop");

export type FindUpMatcher = (
  dir: string,
) =>
  | Promise<string | typeof FIND_UP_STOP | undefined>
  | string
  | typeof FIND_UP_STOP
  | undefined;

export interface FindUpOptions {
  cwd: string;
  type?: "file" | "directory";
}

/**
 * Async implementation of find-up functionality.
 * Searches upward from the given directory until a match is found or root is reached.
 *
 * @param matcher Function that receives each directory and returns:
 *   - A string path if found
 *   - FIND_UP_STOP to stop searching
 *   - undefined to continue searching
 * @param options Search options
 * @returns The found path or undefined
 */
export async function findUp(
  matcher: FindUpMatcher,
  options: FindUpOptions,
): Promise<string | undefined> {
  let dir = path.resolve(options.cwd);
  const root = path.parse(dir).root;

  while (true) {
    const result = await matcher(dir);
    if (result === FIND_UP_STOP) {
      return undefined;
    }
    if (result !== undefined) {
      return options.type === "directory" ? dir : result;
    }
    if (dir === root) {
      return undefined;
    }
    dir = path.dirname(dir);
  }
}

/**
 * Check if a file/directory exists (async)
 */
export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.promises.access(filePath);
    return true;
  } catch {
    return false;
  }
}
