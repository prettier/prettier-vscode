import * as assert from "node:assert";
import { withTimeout } from "../../utils/timeout";

suite("Timeout Tests", () => {
  test("withTimeout resolves when promise completes before timeout", async () => {
    const promise = new Promise<string>((resolve) => {
      setTimeout(() => resolve("success"), 100);
    });

    const result = await withTimeout(promise, 500);
    assert.strictEqual(result, "success");
  });

  test("withTimeout rejects when promise exceeds timeout", async () => {
    const promise = new Promise<string>((resolve) => {
      setTimeout(() => resolve("success"), 500);
    });

    try {
      await withTimeout(promise, 100);
      assert.fail("Expected timeout error");
    } catch (error) {
      assert.ok(error instanceof Error);
      assert.ok(error.message.includes("timed out after 100ms"));
    }
  });

  test("withTimeout allows zero timeout (no timeout)", async () => {
    const promise = new Promise<string>((resolve) => {
      setTimeout(() => resolve("success"), 100);
    });

    const result = await withTimeout(promise, 0);
    assert.strictEqual(result, "success");
  });

  test("withTimeout allows negative timeout (no timeout)", async () => {
    const promise = new Promise<string>((resolve) => {
      setTimeout(() => resolve("success"), 100);
    });

    const result = await withTimeout(promise, -1);
    assert.strictEqual(result, "success");
  });

  test("withTimeout rejects when promise itself rejects", async () => {
    const promise = new Promise<string>((_, reject) => {
      setTimeout(() => reject(new Error("promise error")), 100);
    });

    try {
      await withTimeout(promise, 500);
      assert.fail("Expected promise error");
    } catch (error) {
      assert.ok(error instanceof Error);
      assert.strictEqual(error.message, "promise error");
    }
  });
});
