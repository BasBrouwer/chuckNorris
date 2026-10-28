import { describe, expect, it } from "vitest";

import { createRandomJokeResponse } from "./api";

// Captured from a live `GET https://api.chucknorris.io/jokes/random`.
const LIVE_SAMPLE = {
  categories: [],
  created_at: "2020-01-05 13:42:26.766831",
  icon_url: "https://api.chucknorris.io/img/avatar/chuck-norris.png",
  id: "7jQI7x4dQVOTQFKyNvgpOg",
  updated_at: "2020-01-05 13:42:26.766831",
  url: "https://api.chucknorris.io/jokes/7jQI7x4dQVOTQFKyNvgpOg",
  value:
    "If Chuck Norris ate at your restaurant and had only $5 for his $50 meal, you would still owe him change.",
};

describe("createRandomJokeResponse", () => {
  it("has exactly the fields and value types of a live API response", () => {
    const response = createRandomJokeResponse();

    expect(Object.keys(response).toSorted()).toEqual(Object.keys(LIVE_SAMPLE).toSorted());
    expect(typeof response.value).toBe(typeof LIVE_SAMPLE.value);
    expect(Array.isArray(response.categories)).toBe(true);
    expect(response.icon_url).toBe(LIVE_SAMPLE.icon_url);
  });

  it("formats ids and timestamps like the live API", () => {
    const { id, created_at: createdAt } = createRandomJokeResponse();

    expect(id).toMatch(/^[A-Za-z0-9_-]{22}$/);
    expect(createdAt).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{6}$/);
    expect(LIVE_SAMPLE.id).toMatch(/^[A-Za-z0-9_-]{22}$/);
  });

  it("derives url from id and keeps updated_at equal to created_at, as the API does", () => {
    const response = createRandomJokeResponse();

    expect(response.url).toBe(`https://api.chucknorris.io/jokes/${response.id}`);
    expect(response.updated_at).toBe(response.created_at);
  });

  it("generates a unique id, timestamp and text on every call", () => {
    const responses = Array.from({ length: 50 }, () => createRandomJokeResponse());

    expect(new Set(responses.map((response) => response.id)).size).toBe(50);
    expect(new Set(responses.map((response) => response.created_at)).size).toBe(50);
    expect(new Set(responses.map((response) => response.value)).size).toBe(50);
  });

  it("keeps url consistent when only the id is overridden", () => {
    const response = createRandomJokeResponse({ id: "custom-id" });

    expect(response.url).toBe("https://api.chucknorris.io/jokes/custom-id");
  });

  it("respects explicit overrides, including categories and url", () => {
    const response = createRandomJokeResponse({
      categories: ["dev"],
      url: "https://example.test/joke",
      value: "Custom.",
    });

    expect(response).toMatchObject({
      categories: ["dev"],
      url: "https://example.test/joke",
      value: "Custom.",
    });
  });
});
