import * as glob from "glob";
import * as Mocha from "mocha";
import * as path from "path";
import { MessageItem, MessageOptions, window } from "vscode";
import * as sinon from "sinon";
import {
  ConfirmationSelection,
  ConfirmMessageItem,
} from "../../ModuleResolver";

const showInformationMessage: sinon.SinonStub<
  [string, MessageOptions, ...MessageItem[]],
  Thenable<MessageItem | undefined>
> = sinon.stub(window, "showInformationMessage");

export function run(): Promise<void> {
  // Create the mocha test
  const mocha = new Mocha({
    ui: "tdd",
    color: true,
  });

  const testsRoot = path.resolve(__dirname, "..");

  return new Promise((c, e) => {
    glob("**/**.test.js", { cwd: testsRoot }, (err, files) => {
      if (err) {
        return e(err);
      }

      mocha.globalSetup(() => {
        showInformationMessage.returns(
          Promise.resolve({
            title: "Allow",
            value: ConfirmationSelection.allow,
          } as ConfirmMessageItem)
        );
      });
      mocha.globalTeardown(() => {
        showInformationMessage.reset();
      });

      // Add files to the test suite
      files.forEach((f) => mocha.addFile(path.resolve(testsRoot, f)));

      // To run only a single test, set this value
      // mocha.grep("<test name>");

      try {
        // Run the mocha test
        mocha.run((failures) => {
          if (failures > 0) {
            e(new Error(`${failures} tests failed.`));
          } else {
            c();
          }
        });
      } catch (error) {
        e(error);
      }
    });
  });
}
