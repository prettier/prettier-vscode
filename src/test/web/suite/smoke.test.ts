import * as vscode from "vscode";

// Simple assert function for browser
function ok(value: unknown, message?: string): void {
  if (!value) {
    throw new Error(message || "Assertion failed");
  }
}

suite("Web Extension Smoke Tests", function () {
  this.timeout(10000);

  test("Extension should be present", () => {
    const extension = vscode.extensions.getExtension("esbenp.prettier-vscode");
    ok(extension, "Extension should be installed");
  });

  test("Extension should activate", async () => {
    const extension = vscode.extensions.getExtension("esbenp.prettier-vscode");
    ok(extension, "Extension should be installed");

    // Activate the extension if not already active
    if (!extension!.isActive) {
      await extension!.activate();
    }
    ok(extension!.isActive, "Extension should be active");
  });

  test("Format command should be registered", async () => {
    const commands = await vscode.commands.getCommands(true);
    ok(
      commands.includes("prettier.forceFormatDocument"),
      "prettier.forceFormatDocument command should be registered",
    );
  });

  test("Should format JavaScript content", async () => {
    // Create an untitled document with ugly JavaScript
    const doc = await vscode.workspace.openTextDocument({
      language: "javascript",
      content: "const   x    =    1   ;   console.log(  x  )  ;",
    });

    const editor = await vscode.window.showTextDocument(doc);

    // Format the document
    const edits = await vscode.commands.executeCommand<vscode.TextEdit[]>(
      "vscode.executeFormatDocumentProvider",
      doc.uri,
      { tabSize: 2, insertSpaces: true },
    );

    if (edits && edits.length > 0) {
      const workspaceEdit = new vscode.WorkspaceEdit();
      workspaceEdit.set(doc.uri, edits);
      await vscode.workspace.applyEdit(workspaceEdit);
    }

    // The bundled Prettier should format the code
    const formattedText = editor.document.getText();
    ok(
      !formattedText.includes("    "), // Should not have extra spaces
      "Document should be formatted",
    );
  });
});
