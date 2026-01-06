import * as vscode from "vscode";

const EXTENSION_ID = "esbenp.prettier-vscode";
const DEFAULT_ACTIVATION_TIMEOUT = 10000; // 10 seconds

/**
 * Ensures the Prettier extension is activated and formatters are ready.
 * Throws an error if the extension fails to activate within the timeout.
 *
 * @param timeout Maximum time to wait for activation in milliseconds (default: 10000)
 * @throws Error if extension is not found or fails to activate within timeout
 */
export async function ensureExtensionActivated(
  timeout = DEFAULT_ACTIVATION_TIMEOUT,
): Promise<void> {
  const extension = vscode.extensions.getExtension(EXTENSION_ID);

  if (!extension) {
    throw new Error(`Extension ${EXTENSION_ID} not found`);
  }

  if (extension.isActive) {
    return;
  }

  // Create a promise that rejects after timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(
        new Error(
          `Extension ${EXTENSION_ID} failed to activate within ${timeout}ms`,
        ),
      );
    }, timeout);
  });

  // Race between activation and timeout
  // The activate() function now properly awaits all async initialization
  // including formatter registration, so no additional delay is needed
  await Promise.race([extension.activate(), timeoutPromise]);
}
