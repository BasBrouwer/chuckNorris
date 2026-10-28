import { getResponse, type RequestHandler } from "msw";
import { vi } from "vitest";

import { handlers as defaultHandlers } from "./handlers";

/**
 * In-process API mock. MSW request handlers (`http.get(...)`) resolve requests
 * made through a stubbed global `fetch`, without patching Node's sockets.
 *
 * Why not `setupServer()`: it intercepts at the socket level, and aborting an
 * in-flight request there (which the app does on unmount / interval change)
 * surfaces as unrelated uncaught TLS errors in later tests. Everything the app
 * calls goes through `fetch`, so stubbing `fetch` is enough and deterministic.
 */
let currentHandlers: RequestHandler[] = [...defaultHandlers];
let unhandled: string[] = [];

function rejectOnAbort<T>(work: Promise<T>, signal: AbortSignal | null | undefined): Promise<T> {
  if (!signal) {
    return work;
  }
  return new Promise<T>((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason);
      return;
    }
    signal.addEventListener("abort", () => reject(signal.reason), { once: true });
    work.then(resolve, reject);
  });
}

/**
 * Mirrors fetch's abort behaviour up to the point the response is returned: aborting
 * while the handler runs, or just before it returns, rejects with the abort reason.
 * (Aborting later, while reading the body, is not simulated; the app never does that.)
 */
async function mockFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const { signal: initSignal, ...rest } = init ?? {};
  const signal = initSignal ?? (input instanceof Request ? input.signal : undefined);
  const request = new Request(input, rest);

  const response = await rejectOnAbort(getResponse(currentHandlers, request), signal);
  signal?.throwIfAborted();

  if (response === undefined) {
    const description = `${request.method} ${request.url}`;
    unhandled.push(description);
    throw new TypeError(`Unhandled request (no mock handler): ${description}`);
  }
  if (response.type === "error") {
    // HttpResponse.error(): a network failure, which real fetch reports as a TypeError.
    throw new TypeError("Failed to fetch");
  }
  return response;
}

export const server = {
  /** Routes the app's `fetch` calls to the mock handlers. */
  listen() {
    vi.stubGlobal("fetch", mockFetch);
  },
  close() {
    vi.unstubAllGlobals();
  },
  /** Prepends handlers for the current test. */
  use(...handlers: RequestHandler[]) {
    currentHandlers = [...handlers, ...currentHandlers];
  },
  /** Restores the default handlers. */
  resetHandlers() {
    currentHandlers = [...defaultHandlers];
  },
  /** Fails the test that made a request no handler covered, even if the app swallowed the error. */
  assertNoUnhandledRequests() {
    const calls = unhandled;
    unhandled = [];
    if (calls.length > 0) {
      throw new Error(`Requests without a mock handler:\n${calls.join("\n")}`);
    }
  },
};
