import { describe, expect, it } from "vitest";

import { createJokes } from "@/test/factories";

import { readStoredFavorites, seedFavorites } from "./seedFavorites";

describe("seedFavorites / readStoredFavorites", () => {
  it("reads back what was seeded", () => {
    const jokes = createJokes(2);

    seedFavorites(jokes);

    expect(readStoredFavorites()).toEqual(jokes);
  });

  it("reads null when nothing is stored", () => {
    expect(readStoredFavorites()).toBeNull();
  });
});
