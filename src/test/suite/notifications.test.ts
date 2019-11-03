import * as assert from "assert";
// tslint:disable-next-line: no-implicit-dependencies
import * as sinon from "sinon";
// tslint:disable-next-line: no-implicit-dependencies
import { window } from "vscode";
import {
  LEGACY_VSCODE_PRETTIER_CONFIG_MESSAGE,
  OUTDATED_PRETTIER_VERSION_MESSAGE
} from "../../Consts";
import { format } from "./format.test";

suite("Test notifications", function() {
  let showInputBox: sinon.SinonStub;
  this.timeout(10000);
  this.beforeEach(() => {
    showInputBox = sinon.stub(window, "showErrorMessage");
  });
  this.afterEach(() => {
    showInputBox.restore();
  });
  test("shows error for outdated prettier instance", async () => {
    await format("outdated", "ugly.js");
    assert(showInputBox.calledWith(OUTDATED_PRETTIER_VERSION_MESSAGE));
  });
  test("shows error for legacy vscode config", async () => {
    await format("outdated", "ugly.js");
    assert(showInputBox.calledWith(LEGACY_VSCODE_PRETTIER_CONFIG_MESSAGE));
  });
  test("does not show error with valid project", async () => {
    await format("plugins", "index.php");
    assert(showInputBox.notCalled);
  });
});
