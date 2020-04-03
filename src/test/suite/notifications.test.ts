import * as assert from "assert";
// tslint:disable-next-line: no-implicit-dependencies
import * as sinon from "sinon";
// tslint:disable-next-line: no-implicit-dependencies
import { MessageItem, MessageOptions, window } from "vscode";
import { OUTDATED_PRETTIER_VERSION_MESSAGE } from "../../message";
import { format } from "./format.test";

suite("Test notifications", function () {
  let showWarningMessage: sinon.SinonStub<
    [string, MessageOptions, ...MessageItem[]],
    Thenable<MessageItem | undefined>
  >;
  let showErrorMessage: sinon.SinonStub<
    [string, MessageOptions, ...MessageItem[]],
    Thenable<MessageItem | undefined>
  >;
  this.timeout(10000);
  this.beforeEach(() => {
    showWarningMessage = sinon.stub(window, "showWarningMessage");
    showErrorMessage = sinon.stub(window, "showErrorMessage");
  });
  this.afterEach(() => {
    showWarningMessage.restore();
    showErrorMessage.restore();
  });
  test("shows error for outdated prettier instance", async () => {
    await format("outdated", "ugly.js");
    assert(showErrorMessage.calledWith(OUTDATED_PRETTIER_VERSION_MESSAGE));
  });
  test("does not show error with valid project", async () => {
    await format("plugins", "index.php");
    assert(showWarningMessage.notCalled);
  });
});
