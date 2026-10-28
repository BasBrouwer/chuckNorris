import { describe, expect, it } from "vitest";

import { createJoke, createJokes } from "./joke";

describe("createJoke", () => {
  it("creates a joke with an id and text", () => {
    const joke = createJoke();

    expect(joke).toEqual({ id: expect.any(String) as string, text: expect.any(String) as string });
  });

  it("generates a unique id each time", () => {
    expect(createJoke().id).not.toBe(createJoke().id);
  });

  it("applies overrides", () => {
    expect(createJoke({ id: "custom", text: "Custom." })).toEqual({
      id: "custom",
      text: "Custom.",
    });
  });
});

describe("createJokes", () => {
  it("creates the requested number of distinct jokes", () => {
    const jokes = createJokes(5);

    expect(jokes).toHaveLength(5);
    expect(new Set(jokes.map((joke) => joke.id)).size).toBe(5);
  });
});
