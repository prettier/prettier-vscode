import * as assert from "node:assert";
import * as path from "node:path";
import * as prettier from "prettier";

import { getWorkspaceFolderUri } from "./format.test";
import { ModuleResolver, PrettierNodeModule } from "../../ModuleResolver";
import { LoggingService } from "../../LoggingService";
import {
  OUTDATED_PRETTIER_VERSION_MESSAGE,
  USING_BUNDLED_PRETTIER,
} from "../../message";

interface MockFn {
  (...args: unknown[]): void;
  calls: unknown[][];
}

function createMockFn(): MockFn {
  const calls: unknown[][] = [];
  const fn = (...args: unknown[]) => {
    calls.push(args);
  };
  fn.calls = calls;
  return fn;
}

describe("Test ModuleResolver", () => {
  let moduleResolver: ModuleResolver;
  let logErrorMock: MockFn;
  let logDebugMock: MockFn;

  beforeEach(() => {
    const loggingService = new LoggingService();
    logErrorMock = createMockFn();
    logDebugMock = createMockFn();
    loggingService.logError = logErrorMock;
    loggingService.logDebug = logDebugMock;
    moduleResolver = new ModuleResolver(loggingService);
  });

  describe("getPrettierInstance", () => {
    it("it returns the bundled version of Prettier if local isn't found", async () => {
      const fileName = path.join(
        getWorkspaceFolderUri("no-dep").fsPath,
        "index.js",
      );
      const prettierInstance =
        await moduleResolver.getPrettierInstance(fileName);

      assert.strictEqual(prettierInstance, prettier);
      assert.ok(
        logDebugMock.calls.some((args) => args[0] === USING_BUNDLED_PRETTIER),
      );
    });

    it("it returns the bundled version of Prettier if local is outdated", async () => {
      const fileName = path.join(
        getWorkspaceFolderUri("outdated").fsPath,
        "ugly.js",
      );
      const prettierInstance =
        await moduleResolver.getPrettierInstance(fileName);

      assert.strictEqual(prettierInstance, undefined);
      assert.ok(
        logErrorMock.calls.some(
          (args) => args[0] === OUTDATED_PRETTIER_VERSION_MESSAGE,
        ),
      );
    });

    it("it returns prettier version from package.json", async () => {
      const fileName = path.join(
        getWorkspaceFolderUri("specific-version").fsPath,
        "ugly.js",
      );
      const prettierInstance = (await moduleResolver.getPrettierInstance(
        fileName,
      )) as PrettierNodeModule;

      if (!prettierInstance) {
        assert.fail("Prettier is undefined.");
      }
      assert.notStrictEqual(prettierInstance, prettier);
      assert.strictEqual(prettierInstance.version, "2.0.2");
    });

    it("it returns prettier version from module dep", async () => {
      const fileName = path.join(
        getWorkspaceFolderUri("module").fsPath,
        "index.js",
      );
      const prettierInstance =
        await moduleResolver.getPrettierInstance(fileName);

      if (!prettierInstance) {
        assert.fail("Prettier is undefined.");
      }
      assert.notStrictEqual(prettierInstance, prettier);
      assert.strictEqual(prettierInstance.version, "2.0.2");
    });

    it("it uses explicit dep if found instead fo a closer implicit module dep", async () => {
      const fileName = path.join(
        getWorkspaceFolderUri("explicit-dep").fsPath,
        "implicit-dep",
        "index.js",
      );
      const prettierInstance =
        await moduleResolver.getPrettierInstance(fileName);
      if (!prettierInstance) {
        assert.fail("Prettier is undefined.");
      }
      assert.notStrictEqual(prettierInstance, prettier);
      assert.strictEqual(prettierInstance.version, "2.0.2");
    });
  });
});
