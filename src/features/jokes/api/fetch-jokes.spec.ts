import { describe, expect, it, vi } from "vitest";

import { createRandomJokeResponse } from "@/test/factories";
import { delay, http, HttpResponse, RANDOM_JOKE_URL, server } from "@/test/mocks";

import { fetchJoke, fetchJokes } from "./fetch-jokes";

const newSignal = () => new AbortController().signal;

describe("fetchJoke", () => {
  it("maps the API response to a joke with only id and text", async () => {
    server.use(
      http.get(RANDOM_JOKE_URL, () =>
        HttpResponse.json(createRandomJokeResponse({ id: "abc", value: "Funny." })),
      ),
    );

    await expect(fetchJoke(newSignal())).resolves.toStrictEqual({ id: "abc", text: "Funny." });
  });

  it("throws with the status code when the API responds with an error", async () => {
    server.use(http.get(RANDOM_JOKE_URL, () => new HttpResponse(null, { status: 503 })));

    await expect(fetchJoke(newSignal())).rejects.toThrow("status 503");
  });

  it.each([
    { name: "an unrelated object", body: { nope: true } },
    { name: "a missing value", body: { id: "abc" } },
    { name: "a non-string id", body: { id: 1, value: "Funny." } },
    { name: "null", body: null },
  ])("rejects a response with $name", async ({ body }) => {
    server.use(http.get(RANDOM_JOKE_URL, () => HttpResponse.json(body)));

    await expect(fetchJoke(newSignal())).rejects.toThrow("unexpected shape");
  });

  it("rejects when the request is aborted", async () => {
    server.use(
      http.get(RANDOM_JOKE_URL, async () => {
        await delay(50);
        return HttpResponse.json(createRandomJokeResponse());
      }),
    );
    const controller = new AbortController();

    const pending = fetchJoke(controller.signal);
    controller.abort();

    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
  });
});

describe("fetchJokes", () => {
  it("requests one random joke per count and returns them all", async () => {
    let requests = 0;
    server.use(
      http.get(RANDOM_JOKE_URL, () => {
        requests += 1;
        return HttpResponse.json(createRandomJokeResponse());
      }),
    );

    const jokes = await fetchJokes(4, newSignal());

    expect(requests).toBe(4);
    expect(jokes).toHaveLength(4);
    expect(new Set(jokes.map((joke) => joke.id)).size).toBe(4);
  });

  it("drops duplicate jokes because the API can repeat itself", async () => {
    server.use(
      http.get(RANDOM_JOKE_URL, () =>
        HttpResponse.json(createRandomJokeResponse({ id: "same", value: "Again." })),
      ),
    );

    await expect(fetchJokes(5, newSignal())).resolves.toStrictEqual([
      { id: "same", text: "Again." },
    ]);
  });

  it("keeps the jokes that loaded when some requests fail", async () => {
    let requests = 0;
    server.use(
      http.get(RANDOM_JOKE_URL, () => {
        requests += 1;
        return requests % 2 === 0
          ? new HttpResponse(null, { status: 500 })
          : HttpResponse.json(createRandomJokeResponse());
      }),
    );

    await expect(fetchJokes(6, newSignal())).resolves.toHaveLength(3);
  });

  it("throws when no joke could be loaded", async () => {
    server.use(http.get(RANDOM_JOKE_URL, () => HttpResponse.error()));

    await expect(fetchJokes(3, newSignal())).rejects.toThrow("Could not load any jokes");
  });

  it("rejects with the abort reason instead of returning the jokes that already arrived", async () => {
    let requests = 0;
    server.use(
      http.get(RANDOM_JOKE_URL, async () => {
        requests += 1;
        // Two jokes arrive immediately, the third is still on its way when we abort.
        if (requests > 2) {
          await delay(200);
        }
        return HttpResponse.json(createRandomJokeResponse());
      }),
    );
    const controller = new AbortController();

    const pending = fetchJokes(3, controller.signal);
    await vi.waitFor(() => {
      expect(requests).toBe(3);
    });
    await new Promise((resolve) => setTimeout(resolve, 20));
    controller.abort();

    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
  });
});
