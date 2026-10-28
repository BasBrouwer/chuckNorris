import { describe, expect, it } from "vitest";

import { delay, http, HttpResponse, RANDOM_JOKE_URL, server } from "./index";

describe("mock server", () => {
  it("answers the jokes endpoint with a realistic default response", async () => {
    const response = await fetch(RANDOM_JOKE_URL);

    expect(response.ok).toBe(true);
    expect(await response.json()).toMatchObject({
      id: expect.any(String) as string,
      value: expect.any(String) as string,
      url: expect.stringContaining("https://api.chucknorris.io/jokes/") as string,
    });
  });

  it("lets a test override the response, and use() wins over the defaults", async () => {
    server.use(http.get(RANDOM_JOKE_URL, () => HttpResponse.json({ id: "x", value: "Override." })));

    expect(await (await fetch(RANDOM_JOKE_URL)).json()).toEqual({ id: "x", value: "Override." });
  });

  it("restores the defaults on resetHandlers", async () => {
    server.use(http.get(RANDOM_JOKE_URL, () => HttpResponse.json({ id: "x", value: "Override." })));

    server.resetHandlers();

    expect(await (await fetch(RANDOM_JOKE_URL)).json()).not.toEqual({
      id: "x",
      value: "Override.",
    });
  });

  it("supports error statuses", async () => {
    server.use(http.get(RANDOM_JOKE_URL, () => new HttpResponse(null, { status: 500 })));

    const response = await fetch(RANDOM_JOKE_URL);

    expect(response.status).toBe(500);
    expect(response.ok).toBe(false);
  });

  it("fails like a real network error for HttpResponse.error()", async () => {
    server.use(http.get(RANDOM_JOKE_URL, () => HttpResponse.error()));

    await expect(fetch(RANDOM_JOKE_URL)).rejects.toBeInstanceOf(TypeError);
  });

  it("rejects with the abort reason when a slow request is aborted", async () => {
    server.use(
      http.get(RANDOM_JOKE_URL, async () => {
        await delay(100);
        return HttpResponse.json({});
      }),
    );
    const controller = new AbortController();

    const pending = fetch(RANDOM_JOKE_URL, { signal: controller.signal });
    controller.abort();

    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
  });

  it("honours the signal of a Request passed as the input", async () => {
    server.use(
      http.get(RANDOM_JOKE_URL, async () => {
        await delay(100);
        return HttpResponse.json({});
      }),
    );
    const controller = new AbortController();

    const pending = fetch(new Request(RANDOM_JOKE_URL, { signal: controller.signal }));
    controller.abort();

    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
  });

  it("rejects immediately when the signal is already aborted", async () => {
    await expect(fetch(RANDOM_JOKE_URL, { signal: AbortSignal.abort() })).rejects.toMatchObject({
      name: "AbortError",
    });
  });

  it("rejects unmocked requests and records them so the test fails even if the app swallows the error", async () => {
    await expect(fetch("https://example.test/not-mocked")).rejects.toThrow("no mock handler");

    expect(() => {
      server.assertNoUnhandledRequests();
    }).toThrow("GET https://example.test/not-mocked");
    // Reported once: the next check starts clean.
    expect(() => {
      server.assertNoUnhandledRequests();
    }).not.toThrow();
  });
});
