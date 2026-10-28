import { describe, expect, it, vi } from "vitest";

import { createJoke, createJokes } from "@/test/factories";
import { readStoredFavorites, seedFavorites } from "@/test/utils";

import {
  getFavorites,
  MAX_FAVORITES,
  removeFavorite,
  subscribe,
  toggleFavorite,
} from "./favoritesStore";

const STORAGE_KEY = "chuckles:favorites";

describe("favorites store", () => {
  describe("reading", () => {
    it("starts empty", () => {
      expect(getFavorites()).toEqual([]);
    });

    it("reads favorites persisted by an earlier session", () => {
      const saved = createJokes(3);
      seedFavorites(saved);

      expect(getFavorites()).toEqual(saved);
    });

    it("returns the same array until storage changes, so React can skip re-renders", () => {
      seedFavorites(createJokes(2));

      const first = getFavorites();

      expect(getFavorites()).toBe(first);
      toggleFavorite(createJoke());
      expect(getFavorites()).not.toBe(first);
    });

    it.each([
      { name: "malformed JSON", raw: "{not json" },
      { name: "a non-array value", raw: JSON.stringify({ id: "1", text: "x" }) },
      { name: "null", raw: "null" },
    ])("treats $name as an empty list", ({ raw }) => {
      localStorage.setItem(STORAGE_KEY, raw);

      expect(getFavorites()).toEqual([]);
    });

    it("drops stored entries that are not jokes and strips unknown fields", () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([
          { id: "a", text: "Good", extra: "ignored" },
          { id: 2, text: "Bad id" },
          { id: "c" },
          "nonsense",
          null,
        ]),
      );

      expect(getFavorites()).toStrictEqual([{ id: "a", text: "Good" }]);
    });

    it("truncates a stored list longer than the limit", () => {
      seedFavorites(createJokes(MAX_FAVORITES + 5));

      expect(getFavorites()).toHaveLength(MAX_FAVORITES);
    });

    it("treats unavailable storage as an empty list", () => {
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("storage disabled");
      });

      expect(getFavorites()).toEqual([]);
    });
  });

  describe("toggleFavorite", () => {
    it("adds a joke, newest first, and persists only its id and text", () => {
      const older = createJoke();
      const newer = { ...createJoke(), source: "extra field" };

      toggleFavorite(older);
      toggleFavorite(newer);

      expect(getFavorites().map((joke) => joke.id)).toEqual([newer.id, older.id]);
      expect(readStoredFavorites()).toStrictEqual([
        { id: newer.id, text: newer.text },
        { id: older.id, text: older.text },
      ]);
    });

    it("removes a joke that is already a favorite", () => {
      const joke = createJoke();
      toggleFavorite(joke);

      toggleFavorite(joke);

      expect(getFavorites()).toEqual([]);
      expect(readStoredFavorites()).toEqual([]);
    });

    it(`rejects the ${MAX_FAVORITES + 1}th favorite and leaves the list untouched`, () => {
      const full = createJokes(MAX_FAVORITES);
      seedFavorites(full);

      toggleFavorite(createJoke());

      expect(getFavorites()).toEqual(full);
      expect(readStoredFavorites()).toEqual(full);
    });

    it("still lets you remove a favorite when the list is full, then add another", () => {
      const full = createJokes(MAX_FAVORITES);
      seedFavorites(full);
      const [first] = full;

      toggleFavorite(first ?? createJoke());
      expect(getFavorites()).toHaveLength(MAX_FAVORITES - 1);
      toggleFavorite(createJoke());
      expect(getFavorites()).toHaveLength(MAX_FAVORITES);
    });

    it("keeps the previous list, logs, and does not notify when storage cannot be written", () => {
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
      const existing = createJokes(2);
      seedFavorites(existing);
      const listener = vi.fn();
      const unsubscribe = subscribe(listener);
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("quota exceeded");
      });

      toggleFavorite(createJoke());
      expect(getFavorites()).toEqual(existing);
      expect(consoleError).toHaveBeenCalledOnce();
      expect(listener).not.toHaveBeenCalled();
      unsubscribe();
    });
  });

  describe("removeFavorite", () => {
    it("removes the joke with the given id and reports the change", () => {
      const [keep, drop] = createJokes(2);
      seedFavorites([keep ?? createJoke(), drop ?? createJoke()]);

      expect(removeFavorite(drop?.id ?? "")).toBe(true);

      expect(getFavorites()).toEqual([keep]);
      expect(readStoredFavorites()).toEqual([keep]);
    });

    it("does nothing, reports no change, and notifies nobody, for an unknown id", () => {
      seedFavorites(createJokes(2));
      const listener = vi.fn();
      const unsubscribe = subscribe(listener);

      expect(removeFavorite("not-a-favorite")).toBe(false);

      expect(listener).not.toHaveBeenCalled();
      unsubscribe();
    });

    it("keeps the list, reports no change, and logs when storage rejects the write", () => {
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
      const existing = createJokes(2);
      seedFavorites(existing);
      const listener = vi.fn();
      const unsubscribe = subscribe(listener);
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("quota exceeded");
      });

      expect(removeFavorite(existing[0]?.id ?? "")).toBe(false);

      expect(getFavorites()).toEqual(existing);
      expect(consoleError).toHaveBeenCalledOnce();
      expect(listener).not.toHaveBeenCalled();
      unsubscribe();
    });
  });

  describe("subscribe", () => {
    it("notifies subscribers when favorites change in this tab", () => {
      const listener = vi.fn();
      const unsubscribe = subscribe(listener);
      const joke = createJoke();

      toggleFavorite(joke);
      removeFavorite(joke.id);

      expect(listener).toHaveBeenCalledTimes(2);
      unsubscribe();
    });

    it("stops notifying after unsubscribe", () => {
      const listener = vi.fn();
      subscribe(listener)();

      toggleFavorite(createJoke());

      expect(listener).not.toHaveBeenCalled();
    });

    it("notifies when another tab changes the favorites", () => {
      const listener = vi.fn();
      const unsubscribe = subscribe(listener);

      window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));

      expect(listener).toHaveBeenCalledOnce();
      unsubscribe();
    });

    it("notifies when another tab clears all storage", () => {
      const listener = vi.fn();
      const unsubscribe = subscribe(listener);

      window.dispatchEvent(new StorageEvent("storage", { key: null }));

      expect(listener).toHaveBeenCalledOnce();
      unsubscribe();
    });

    it("ignores storage changes to unrelated keys", () => {
      const listener = vi.fn();
      const unsubscribe = subscribe(listener);

      window.dispatchEvent(new StorageEvent("storage", { key: "something-else" }));

      expect(listener).not.toHaveBeenCalled();
      unsubscribe();
    });

    it("stops listening to storage events after unsubscribe", () => {
      const listener = vi.fn();
      subscribe(listener)();

      window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));

      expect(listener).not.toHaveBeenCalled();
    });
  });
});
