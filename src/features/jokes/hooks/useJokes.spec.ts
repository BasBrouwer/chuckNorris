import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createRandomJokeResponse } from "@/test/factories";
import { delay, http, HttpResponse, RANDOM_JOKE_URL, server } from "@/test/mocks";
import { captureInterval } from "@/test/utils";

import { AUTO_REFRESH_INTERVAL_MS, FRESH_DURATION_MS, MAX_JOKES, useJokes } from "./useJokes";

afterEach(() => {
  vi.useRealTimers();
});

async function renderLoadedJokes(autoRefresh = false) {
  const hook = renderHook(({ autoRefresh: on }) => useJokes({ autoRefresh: on }), {
    initialProps: { autoRefresh },
  });
  await waitFor(() => {
    expect(hook.result.current.status).toBe("success");
  });
  return hook;
}

function failEveryRequest() {
  server.use(http.get(RANDOM_JOKE_URL, () => new HttpResponse(null, { status: 500 })));
}

function serveJoke(id: string) {
  server.use(http.get(RANDOM_JOKE_URL, () => HttpResponse.json(createRandomJokeResponse({ id }))));
}

describe("useJokes initial load", () => {
  it("starts out loading with no jokes", () => {
    const { result } = renderHook(() => useJokes({ autoRefresh: false }));

    expect(result.current).toMatchObject({ status: "loading", jokes: [] });
  });

  it("loads one batch of MAX_JOKES unique jokes", async () => {
    const { result } = await renderLoadedJokes();

    expect(result.current.jokes).toHaveLength(MAX_JOKES);
    expect(new Set(result.current.jokes.map((joke) => joke.id)).size).toBe(MAX_JOKES);
  });

  it("orders the batch newest first, spread over the refresh interval and ending now", async () => {
    const before = Date.now();
    const { result } = await renderLoadedJokes();

    const times = result.current.jokes.map((joke) => joke.receivedAt);
    expect(times[0]).toBeGreaterThanOrEqual(before);
    for (let index = 1; index < times.length; index += 1) {
      expect((times[index - 1] ?? 0) - (times[index] ?? 0)).toBe(AUTO_REFRESH_INTERVAL_MS);
    }
  });

  it("collapses a batch of repeated jokes into one", async () => {
    server.use(
      http.get(RANDOM_JOKE_URL, () => HttpResponse.json(createRandomJokeResponse({ id: "same" }))),
    );

    const { result } = await renderLoadedJokes();

    expect(result.current.jokes.map((joke) => joke.id)).toEqual(["same"]);
  });

  it("does not fetch another batch when auto-refresh is switched on and off", async () => {
    const { rerender } = await renderLoadedJokes();
    const interval = captureInterval(AUTO_REFRESH_INTERVAL_MS);
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    rerender({ autoRefresh: true });
    rerender({ autoRefresh: false });

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(interval.isRunning()).toBe(false);
  });
});

describe("useJokes failure and retry", () => {
  it("reports an error and logs it when no joke can be loaded", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    failEveryRequest();

    const { result } = renderHook(() => useJokes({ autoRefresh: false }));

    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });
    expect(result.current.jokes).toEqual([]);
    expect(consoleError).toHaveBeenCalledOnce();
  });

  it("retry goes back to loading and recovers once the API works again", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    failEveryRequest();
    const { result } = renderHook(() => useJokes({ autoRefresh: false }));
    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });

    server.resetHandlers();
    act(() => {
      result.current.retry();
    });
    expect(result.current.status).toBe("loading");

    await waitFor(() => {
      expect(result.current.status).toBe("success");
    });
    expect(result.current.jokes).toHaveLength(MAX_JOKES);
  });

  it("does not report an error for a request cancelled by unmounting", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { unmount } = renderHook(() => useJokes({ autoRefresh: false }));

    unmount();
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(consoleError).not.toHaveBeenCalled();
  });
});

describe("useJokes auto-refresh", () => {
  it("does not start a timer while auto-refresh is off", async () => {
    const interval = captureInterval(AUTO_REFRESH_INTERVAL_MS);

    await renderLoadedJokes(false);

    expect(interval.isRunning()).toBe(false);
  });

  it("registers a timer at the refresh interval when switched on", async () => {
    const { rerender } = await renderLoadedJokes();
    const interval = captureInterval(AUTO_REFRESH_INTERVAL_MS);

    rerender({ autoRefresh: true });

    expect(interval.setIntervalSpy).toHaveBeenCalledWith(
      expect.any(Function),
      AUTO_REFRESH_INTERVAL_MS,
    );
    expect(interval.isRunning()).toBe(true);
  });

  it("adds each tick's joke on top and drops the oldest at the limit", async () => {
    const { result, rerender } = await renderLoadedJokes();
    const interval = captureInterval(AUTO_REFRESH_INTERVAL_MS);
    const before = result.current.jokes;
    server.use(
      http.get(RANDOM_JOKE_URL, () =>
        HttpResponse.json(createRandomJokeResponse({ id: "fresh", value: "Fresh joke." })),
      ),
    );
    rerender({ autoRefresh: true });

    act(() => {
      interval.fire();
    });

    await waitFor(() => {
      expect(result.current.jokes[0]?.id).toBe("fresh");
    });
    expect(result.current.jokes).toHaveLength(MAX_JOKES);
    expect(result.current.jokes.slice(1).map((joke) => joke.id)).toEqual(
      before.slice(0, MAX_JOKES - 1).map((joke) => joke.id),
    );
    expect(result.current.jokes.map((joke) => joke.id)).not.toContain(before.at(-1)?.id);
  });

  it("is newest first after several ticks", async () => {
    vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-01-01T12:00:00Z") });
    const { result, rerender } = await renderLoadedJokes();
    const interval = captureInterval(AUTO_REFRESH_INTERVAL_MS);
    rerender({ autoRefresh: true });

    for (const [index, id] of ["first", "second", "third"].entries()) {
      server.use(
        http.get(RANDOM_JOKE_URL, () => HttpResponse.json(createRandomJokeResponse({ id }))),
      );
      vi.setSystemTime(
        new Date("2026-01-01T12:01:00Z").getTime() + index * AUTO_REFRESH_INTERVAL_MS,
      );
      act(() => {
        interval.fire();
      });
      await waitFor(() => {
        expect(result.current.jokes[0]?.id).toBe(id);
      });
    }

    expect(result.current.jokes.slice(0, 3).map((joke) => joke.id)).toEqual([
      "third",
      "second",
      "first",
    ]);
  });

  it("ignores a tick that returns a joke already in the list", async () => {
    const { result, rerender } = await renderLoadedJokes();
    const interval = captureInterval(AUTO_REFRESH_INTERVAL_MS);
    const before = result.current.jokes.map((joke) => joke.id);
    const existing = before[3] ?? "";
    let served = false;
    server.use(
      http.get(RANDOM_JOKE_URL, () => {
        served = true;
        return HttpResponse.json(createRandomJokeResponse({ id: existing }));
      }),
    );
    rerender({ autoRefresh: true });

    act(() => {
      interval.fire();
    });
    await waitFor(() => {
      expect(served).toBe(true);
    });
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(result.current.jokes.map((joke) => joke.id)).toEqual(before);
  });

  it("keeps the list and only logs when a tick fails", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { result, rerender } = await renderLoadedJokes();
    const interval = captureInterval(AUTO_REFRESH_INTERVAL_MS);
    const before = result.current.jokes;
    failEveryRequest();
    rerender({ autoRefresh: true });

    act(() => {
      interval.fire();
    });
    await waitFor(() => {
      expect(consoleError).toHaveBeenCalled();
    });

    expect(result.current.jokes).toEqual(before);
    expect(result.current.status).toBe("success");
  });

  it("drops a tick that is still in flight when auto-refresh is switched off", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { result, rerender } = await renderLoadedJokes();
    const interval = captureInterval(AUTO_REFRESH_INTERVAL_MS);
    const before = result.current.jokes.map((joke) => joke.id);
    server.use(
      http.get(RANDOM_JOKE_URL, async () => {
        await delay(50);
        return HttpResponse.json(createRandomJokeResponse({ id: "too-late" }));
      }),
    );
    rerender({ autoRefresh: true });
    act(() => {
      interval.fire();
    });

    rerender({ autoRefresh: false });
    await new Promise((resolve) => setTimeout(resolve, 120));

    expect(result.current.jokes.map((joke) => joke.id)).toEqual(before);
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("stops the timer when switched off or unmounted", async () => {
    const { rerender, unmount } = await renderLoadedJokes();
    const interval = captureInterval(AUTO_REFRESH_INTERVAL_MS);

    rerender({ autoRefresh: true });
    expect(interval.isRunning()).toBe(true);
    rerender({ autoRefresh: false });
    expect(interval.isRunning()).toBe(false);

    rerender({ autoRefresh: true });
    expect(interval.isRunning()).toBe(true);
    unmount();
    expect(interval.isRunning()).toBe(false);
  });

  describe("fresh highlight", () => {
    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    it("does not mark any of the initial batch as fresh", async () => {
      const { result } = await renderLoadedJokes();

      expect(result.current.freshIds).toEqual([]);
    });

    it("marks a tick's joke as fresh, then clears it after the highlight window", async () => {
      const { result, rerender } = await renderLoadedJokes();
      const interval = captureInterval(AUTO_REFRESH_INTERVAL_MS);
      serveJoke("just-in");
      rerender({ autoRefresh: true });

      act(() => {
        interval.fire();
      });

      await waitFor(() => {
        expect(result.current.freshIds).toEqual(["just-in"]);
      });
      act(() => {
        vi.advanceTimersByTime(FRESH_DURATION_MS);
      });
      expect(result.current.freshIds).toEqual([]);
      expect(result.current.jokes[0]?.id).toBe("just-in");
    });

    it("tracks several fresh jokes at once and expires each", async () => {
      const { result, rerender } = await renderLoadedJokes();
      const interval = captureInterval(AUTO_REFRESH_INTERVAL_MS);
      rerender({ autoRefresh: true });

      for (const id of ["one", "two"]) {
        serveJoke(id);
        act(() => {
          interval.fire();
        });
        await waitFor(() => {
          expect(result.current.freshIds).toContain(id);
        });
      }

      expect(result.current.freshIds).toEqual(["one", "two"]);
      act(() => {
        vi.advanceTimersByTime(FRESH_DURATION_MS * 2);
      });
      expect(result.current.freshIds).toEqual([]);
    });

    it("does not highlight a tick joke that was already in the list", async () => {
      const { result, rerender } = await renderLoadedJokes();
      const interval = captureInterval(AUTO_REFRESH_INTERVAL_MS);
      const existing = result.current.jokes[2]?.id ?? "";
      let served = false;
      server.use(
        http.get(RANDOM_JOKE_URL, () => {
          served = true;
          return HttpResponse.json(createRandomJokeResponse({ id: existing }));
        }),
      );
      rerender({ autoRefresh: true });

      act(() => {
        interval.fire();
      });
      await waitFor(() => {
        expect(served).toBe(true);
      });
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(result.current.freshIds).toEqual([]);
    });
  });
});
