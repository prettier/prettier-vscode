import * as assert from "assert";
import * as vscode from "vscode";
import { ensureExtensionActivated } from "./testUtils.js";

describe("Test format Document Ranges", () => {
  before(async () => {
    await ensureExtensionActivated();
  });

  it("it formats JavaScript ranges", async () => {
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

  it("it formats CSS ranges", async () => {
    const input = `\
.foo { color:red; }
.bar   {   background: blue;   }
.baz{margin:0;}`;
    const expected = `\
.foo {
  color: red;
}
.bar   {   background: blue;   }
.baz {
  margin: 0;
}`;

    const doc = await vscode.workspace.openTextDocument({
      content: input,
      language: "css",
    });

    const editor = await vscode.window.showTextDocument(doc);
    editor.selections = [
      new vscode.Selection(0, 0, 0, 19),
      new vscode.Selection(2, 0, 2, 15),
    ];

    await vscode.commands.executeCommand("editor.action.formatSelection");
    const output = doc.getText();

    assert.equal(output, expected);
  });

  it("it formats HTML ranges", async () => {
    const input = `\
<div><p>Format me</p></div>
<div>  <span>Leave me</span>  </div>
<section><h1>Format me too</h1></section>`;
    const expected = `\
<div>
  <p>Format me</p>
</div>
<div>  <span>Leave me</span>  </div>
<section>
  <h1>Format me too</h1>
</section>`;

    const doc = await vscode.workspace.openTextDocument({
      content: input,
      language: "html",
    });

    const editor = await vscode.window.showTextDocument(doc);
    editor.selections = [
      new vscode.Selection(0, 0, 0, 28),
      new vscode.Selection(2, 0, 2, 41),
    ];

    await vscode.commands.executeCommand("editor.action.formatSelection");
    const output = doc.getText();

    assert.equal(output, expected);
  });

  it("it formats Markdown ranges", async () => {
    const input = `\
# Title

Paragraph one    with extra spaces.

Paragraph two with normal spacing.

Paragraph three    also with    extra spaces.`;
    const expected = `\
# Title

Paragraph one with extra spaces.

Paragraph two with normal spacing.

Paragraph three also with extra spaces.`;

    const doc = await vscode.workspace.openTextDocument({
      content: input,
      language: "markdown",
    });

    const editor = await vscode.window.showTextDocument(doc);
    editor.selections = [
      new vscode.Selection(2, 0, 2, 39),
      new vscode.Selection(6, 0, 6, 46),
    ];

    await vscode.commands.executeCommand("editor.action.formatSelection");
    const output = doc.getText();

    assert.equal(output, expected);
  });
});
