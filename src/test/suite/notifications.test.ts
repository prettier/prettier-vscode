import * as assert from "assert";
// tslint:disable-next-line: no-implicit-dependencies
import * as sinon from "sinon";
// tslint:disable-next-line: no-implicit-dependencies
import { window } from "vscode";
import { format } from "./format.test";

suite("Test notifications", function() {
  this.timeout(10000);
  test("shows error for outdated prettier instance", async () => {
    const showInputBox = sinon.stub(window, "showErrorMessage");
    await format("outdated", "ugly.js");
    assert(showInputBox.calledOnce);
    showInputBox.restore();
  });
  test("does not show error for valid prettier instance", async () => {
    const showInputBox = sinon.stub(window, "showErrorMessage");
    await format("plugins", "index.php");
    assert(showInputBox.notCalled);
    showInputBox.restore();
  });
});
