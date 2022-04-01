import * as assert from "assert";
import * as vscode from "vscode";

suite("Test format Document Ranges", function () {
  this.timeout(10000);
  test("it formats JavaScript ranges", async () => {
    const input = `\
  let i    ="format me!"
  let  j  = "leave me alone"
  let     k  = 'format me too!'`;
    const expected = `\
  let i = "format me!";
  let  j  = "leave me alone"
  let k = "format me too!";`;

    const doc = await vscode.workspace.openTextDocument({
      content: input,
      language: "javascript",
    });

    const editor = await vscode.window.showTextDocument(doc);
    editor.selections = [
      new vscode.Selection(0, 1, 0, 6),
      new vscode.Selection(2, 1, 2, 7),
    ];
    await vscode.commands.executeCommand("editor.action.formatSelection");
    const output = doc.getText();

    assert.equal(output, expected);
  });
});
