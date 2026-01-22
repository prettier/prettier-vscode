import * as assert from "assert";
import { PrettierDynamicInstance } from "../../PrettierDynamicInstance.js";

describe("WebAssembly.instantiateStreaming polyfill", () => {
  let originalInstantiateStreaming: any;

  before(() => {
    // Save the original instantiateStreaming if it exists
    originalInstantiateStreaming = (globalThis as any).WebAssembly
      ?.instantiateStreaming;
  });

  after(() => {
    // Restore the original instantiateStreaming
    if (originalInstantiateStreaming !== undefined) {
      (globalThis as any).WebAssembly.instantiateStreaming =
        originalInstantiateStreaming;
    } else if ((globalThis as any).WebAssembly) {
      delete (globalThis as any).WebAssembly.instantiateStreaming;
    }
  });

  it("should add WebAssembly.instantiateStreaming when missing", async () => {
    // Remove instantiateStreaming to simulate the missing API
    const wasm = (globalThis as any).WebAssembly;
    if (wasm && wasm.instantiateStreaming) {
      delete wasm.instantiateStreaming;
    }

    // Verify it's missing
    assert.strictEqual(wasm?.instantiateStreaming, undefined);

    // Create an instance which should apply the polyfill
    const instance = new (PrettierDynamicInstance as any)("/fake/path");

    // Trigger the polyfill by trying to import (this will fail but that's ok)
    try {
      await instance.import();
    } catch {
      // Expected to fail since the path is fake
    }

    // Verify the polyfill was applied
    assert.notStrictEqual(wasm?.instantiateStreaming, undefined);
    assert.strictEqual(typeof wasm?.instantiateStreaming, "function");
  });

  it("should not override existing WebAssembly.instantiateStreaming", async () => {
    const mockInstantiateStreaming = async () => ({ instance: {}, module: {} });
    const wasm = (globalThis as any).WebAssembly;

    if (wasm) {
      wasm.instantiateStreaming = mockInstantiateStreaming;
    }

    // Create an instance which should apply the polyfill
    const instance = new (PrettierDynamicInstance as any)("/fake/path");

    // Trigger the polyfill by trying to import (this will fail but that's ok)
    try {
      await instance.import();
    } catch {
      // Expected to fail since the path is fake
    }

    // Verify the original function was not replaced
    assert.strictEqual(wasm?.instantiateStreaming, mockInstantiateStreaming);
  });

  it("polyfilled function should use WebAssembly.instantiate with arrayBuffer", async () => {
    // Remove instantiateStreaming to simulate the missing API
    const wasm = (globalThis as any).WebAssembly;
    if (wasm && wasm.instantiateStreaming) {
      delete wasm.instantiateStreaming;
    }

    // Create an instance which should apply the polyfill
    const instance = new (PrettierDynamicInstance as any)("/fake/path");

    // Trigger the polyfill by trying to import (this will fail but that's ok)
    try {
      await instance.import();
    } catch {
      // Expected to fail since the path is fake
    }

    // Create a mock Response with arrayBuffer
    const mockBytes = new Uint8Array([0, 97, 115, 109]); // WASM magic number
    const mockResponse = {
      arrayBuffer: async () => mockBytes.buffer,
    };

    // Track if WebAssembly.instantiate was called
    let instantiateCalled = false;
    const originalInstantiate = wasm.instantiate;
    wasm.instantiate = async (...args: any[]) => {
      instantiateCalled = true;
      assert.strictEqual(args[0], mockBytes.buffer);
      // Return a minimal valid result
      return { instance: {} as any, module: {} as any };
    };

    try {
      // Call the polyfilled function
      await wasm.instantiateStreaming(mockResponse);

      // Verify that WebAssembly.instantiate was called
      assert.strictEqual(instantiateCalled, true);
    } finally {
      // Restore
      wasm.instantiate = originalInstantiate;
    }
  });
});
