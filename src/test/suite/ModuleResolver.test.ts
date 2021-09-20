import * as assert from "assert";
import * as path from "path";
import * as prettier from "prettier";
import * as sinon from "sinon";

import { getWorkspaceFolderUri } from "./format.test";
import { ModuleResolver, PrettierNodeModule } from "../../ModuleResolver";
import { LoggingService } from "../../LoggingService";
import {
  OUTDATED_PRETTIER_VERSION_MESSAGE,
  USING_BUNDLED_PRETTIER,
} from "../../message";

suite("Test ModuleResolver", function () {
  let moduleResolver: ModuleResolver;
  let logErrorSpy: sinon.SinonSpy;
  let logDebugSpy: sinon.SinonSpy;

  this.beforeEach(() => {
    const loggingService = new LoggingService();
    logErrorSpy = sinon.spy(loggingService, "logError");
    logDebugSpy = sinon.spy(loggingService, "logDebug");
    moduleResolver = new ModuleResolver(loggingService);
  });

  suite("getPrettierInstance", () => {
    test("it returns the bundled version of Prettier if local isn't found", async () => {
      const fileName = path.join(
        getWorkspaceFolderUri("no-dep").fsPath,
        "index.js"
      );
      const prettierInstance = await moduleResolver.getPrettierInstance(
        fileName
      );

      assert.strictEqual(prettierInstance, prettier);
      assert(logDebugSpy.calledWith(USING_BUNDLED_PRETTIER));
    });

    test("it returns the bundled version of Prettier if local is outdated", async () => {
      const fileName = path.join(
        getWorkspaceFolderUri("outdated").fsPath,
        "ugly.js"
      );
      const prettierInstance = await moduleResolver.getPrettierInstance(
        fileName
      );

      assert.strictEqual(prettierInstance, undefined);
      assert(logErrorSpy.calledWith(OUTDATED_PRETTIER_VERSION_MESSAGE));
    });

    test("it returns prettier version from package.json", async () => {
      const fileName = path.join(
        getWorkspaceFolderUri("specific-version").fsPath,
        "ugly.js"
      );
      const prettierInstance = (await moduleResolver.getPrettierInstance(
        fileName
      )) as PrettierNodeModule;

      if (!prettierInstance) {
        assert.fail("Prettier is undefined.");
      }
      assert.notStrictEqual(prettierInstance, prettier);
      assert.strictEqual(prettierInstance.version, "2.0.2");
    });

    test("it returns prettier version from module dep", async () => {
      const fileName = path.join(
        getWorkspaceFolderUri("module").fsPath,
        "index.js"
      );
      const prettierInstance = await moduleResolver.getPrettierInstance(
        fileName
      );

      if (!prettierInstance) {
        assert.fail("Prettier is undefined.");
      }
      assert.notStrictEqual(prettierInstance, prettier);
      assert.strictEqual(prettierInstance.version, "2.0.2");
    });

    test("it uses explicit dep if found instead fo a closer implicit module dep", async () => {
      const fileName = path.join(
        getWorkspaceFolderUri("explicit-dep").fsPath,
        "implicit-dep",
        "index.js"
      );
      const prettierInstance = await moduleResolver.getPrettierInstance(
        fileName
      );
      if (!prettierInstance) {
        assert.fail("Prettier is undefined.");
      }
      assert.notStrictEqual(prettierInstance, prettier);
      assert.strictEqual(prettierInstance.version, "2.0.2");
    });
  });
});
