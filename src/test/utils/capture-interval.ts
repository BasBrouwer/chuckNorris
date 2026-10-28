import { vi } from "vitest";

/**
 * Intercepts the one `setInterval` registered with `delay`, so tests can fire a
 * tick on demand instead of waiting in real time. Other intervals (e.g. the ones
 * Testing Library's `waitFor` uses) pass through untouched.
 */
export function captureInterval(delay: number) {
  const realSetInterval = globalThis.setInterval.bind(globalThis);
  const realClearInterval = globalThis.clearInterval.bind(globalThis);
  const handle = 987_654 as unknown as ReturnType<typeof setInterval>;
  let tick: (() => void) | undefined;

  const setIntervalSpy = vi.spyOn(globalThis, "setInterval").mockImplementation(((
    callback: () => void,
    ms?: number,
  ) => {
    if (ms === delay) {
      if (tick !== undefined) {
        throw new Error(
          `A ${String(delay)}ms interval is already registered; only one is expected`,
        );
      }
      tick = callback;
      return handle;
    }
    return realSetInterval(callback, ms);
  }) as unknown as typeof setInterval);

  const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval").mockImplementation(((
    id?: ReturnType<typeof setInterval>,
  ) => {
    if (id === handle) {
      tick = undefined;
      return;
    }
    realClearInterval(id);
  }) as typeof clearInterval);

  return {
    /** Runs the captured interval callback, as if `delay` ms had passed. */
    fire() {
      if (tick === undefined) {
        throw new Error(`No ${delay}ms interval is registered`);
      }
      tick();
    },
    isRunning: () => tick !== undefined,
    setIntervalSpy,
    clearIntervalSpy,
    handle,
  };
}
