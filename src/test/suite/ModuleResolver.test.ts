import * as assert from "assert";
import * as path from "path";
import * as prettier from "prettier";
import * as sinon from "sinon";

import { getWorkspaceFolderUri } from "./format.test";
import { ModuleResolver } from "../../ModuleResolver";
import { LoggingService } from "../../LoggingService";
import { NotificationService } from "../../NotificationService";

suite("Test ModuleResolver", function () {
  let moduleResolver: ModuleResolver;
  let logErrorSpy: sinon.SinonSpy;
  let logInfoSpy: sinon.SinonSpy;

  this.beforeEach(() => {
    const loggingService = new LoggingService();
    logErrorSpy = sinon.spy(loggingService, "logError");
    logInfoSpy = sinon.spy(loggingService, "logInfo");
    const notificationService = new NotificationService(loggingService);

    moduleResolver = new ModuleResolver(loggingService, notificationService);
  });

  suite("getPrettierInstance", () => {
    test("it returns the bundled version of Prettier if local isn't found", () => {
      const fileName = path.join(
        getWorkspaceFolderUri("no-dep").fsPath,
        "index.js"
      );
      const prettierInstance = moduleResolver.getPrettierInstance(fileName, {
        showNotifications: true,
      });

      assert.equal(prettierInstance, prettier);
      assert(logInfoSpy.calledWith("Using bundled version of prettier."));
    });

    test("it returns the bundled version of Prettier if local is outdated", () => {
      const fileName = path.join(
        getWorkspaceFolderUri("outdated").fsPath,
        "ugly.js"
      );
      const prettierInstance = moduleResolver.getPrettierInstance(fileName);

      assert.equal(prettierInstance, prettier);
      assert(
        logErrorSpy.calledWith(
          "Outdated version of prettier installed. Falling back to bundled version of prettier."
        )
      );
    });

    test("it returns prettier version from package.json", async () => {
      const fileName = path.join(
        getWorkspaceFolderUri("specific-version").fsPath,
        "ugly.js"
      );
      const prettierInstance = await moduleResolver.getPrettierInstance(
        fileName
      );

      assert.notEqual(prettierInstance, prettier);
      assert.equal(prettierInstance.version, "2.0.2");
      assert(
        logInfoSpy.calledWith(
          sinon.match(
            /Loaded module 'prettier@2.0.2' from '.*[/\\]specific-version[/\\]node_modules[/\\]prettier[/\\]index.js'/
          )
        )
      );
    });

    test("it returns prettier version from module dep", async () => {
      const fileName = path.join(
        getWorkspaceFolderUri("module").fsPath,
        "index.js"
      );
      const prettierInstance = await moduleResolver.getPrettierInstance(
        fileName
      );

      assert.notEqual(prettierInstance, prettier);
      assert.equal(prettierInstance.version, "2.0.2");
      assert(
        logInfoSpy.calledWith(
          sinon.match(
            /Loaded module 'prettier@2\.0\.2' from '.*[/\\]module[/\\]node_modules[/\\]prettier[/\\]index\.js'/
          )
        )
      );
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

      assert.notEqual(prettierInstance, prettier);
      assert.equal(prettierInstance.version, "2.0.2");
      assert(
        logInfoSpy.calledWith(
          sinon.match(
            /Loaded module 'prettier@2\.0\.2' from '.*[/\\]explicit-dep[/\\]node_modules[/\\]prettier[/\\]index\.js'/
          )
        )
      );
    });
  });
});
