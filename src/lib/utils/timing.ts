/**
 * This function ensures that a given asynchronous function is executed with a minimum load time.
 * @param fn - The asynchronous function to execute.
 * @param minMs - The minimum load time in milliseconds.
 * @returns The result of the asynchronous function.
 */
export async function withMinLoadTime<T>(
  fn: () => Promise<T>,
  minMs: number = 300,
): Promise<T> {
  const start = Date.now();
  const result = await fn();
  const elapsed = Date.now() - start;

  if (elapsed < minMs) {
    await new Promise((resolve) => setTimeout(resolve, minMs - elapsed));
  }

  return result;
}

export function createTimedBuffer<T>(
  fn: (key: string, data: T) => Promise<void>,
  intervalMs = 5000,
) {
  const cache = new Map<string, T>();
  const timers = new Map<string, NodeJS.Timeout>();

  return (key: string, data: T) => {
    cache.set(key, data);

    if (timers.has(key)) return;

    timers.set(
      key,
      setTimeout(async () => {
        const latest = cache.get(key);
        if (latest) {
          await fn(key, latest);
          cache.delete(key);
        }
        timers.delete(key);
      }, intervalMs),
    );
  };
}
