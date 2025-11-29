/**
 * Creates a promise that rejects after a specified timeout
 * @param ms Timeout in milliseconds
 * @returns A promise that rejects with a timeout error
 */
function createTimeoutPromise(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(
        new Error(
          `Prettier formatting timed out after ${ms}ms. This may indicate an issue with Prettier or a plugin.`,
        ),
      );
    }, ms);
  });
}

/**
 * Wraps a promise with a timeout
 * @param promise The promise to wrap
 * @param ms Timeout in milliseconds (0 or negative means no timeout)
 * @returns The promise result or timeout error
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
): Promise<T> {
  if (ms <= 0) {
    // No timeout
    return promise;
  }

  return Promise.race([promise, createTimeoutPromise(ms)]);
}
