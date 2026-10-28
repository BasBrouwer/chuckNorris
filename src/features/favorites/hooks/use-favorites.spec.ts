import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { createJoke, createJokes } from "@/test/factories";
import { readStoredFavorites, seedFavorites } from "@/test/utils";

import { MAX_FAVORITES } from "../store/favorites-store";
import { useFavorites } from "./use-favorites";

describe("useFavorites", () => {
  it("is empty with the limit exposed when nothing is saved", () => {
    const { result } = renderHook(() => useFavorites());

    expect(result.current).toMatchObject({
      favorites: [],
      count: 0,
      max: MAX_FAVORITES,
      isFull: false,
    });
  });

  it("starts from favorites persisted earlier", () => {
    const saved = createJokes(3);
    seedFavorites(saved);

    const { result } = renderHook(() => useFavorites());

    expect(result.current.favorites).toEqual(saved);
    expect(result.current.count).toBe(3);
  });

  it("re-renders when a joke is favorited, and persists it", () => {
    const joke = createJoke();
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.toggleFavorite(joke);
    });

    expect(result.current.isFavorite(joke.id)).toBe(true);
    expect(result.current.isFavorite("other")).toBe(false);
    expect(readStoredFavorites()).toEqual([joke]);
  });

  it("re-renders when a favorite is removed", () => {
    const joke = createJoke();
    seedFavorites([joke]);
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.removeFavorite(joke.id);
    });

    expect(result.current.count).toBe(0);
    expect(result.current.isFavorite(joke.id)).toBe(false);
  });

  it("reports isFull at the limit and refuses more", () => {
    seedFavorites(createJokes(MAX_FAVORITES));
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.toggleFavorite(createJoke());
    });

    expect(result.current.isFull).toBe(true);
    expect(result.current.count).toBe(MAX_FAVORITES);
  });

  it("stays in sync between two components using the hook", () => {
    const first = renderHook(() => useFavorites());
    const second = renderHook(() => useFavorites());
    const joke = createJoke();

    act(() => {
      first.result.current.toggleFavorite(joke);
    });

    expect(second.result.current.isFavorite(joke.id)).toBe(true);
  });

  it("picks up changes made in another browser tab", () => {
    const { result } = renderHook(() => useFavorites());
    const joke = createJoke();

    act(() => {
      seedFavorites([joke]);
      window.dispatchEvent(new StorageEvent("storage", { key: "chuckles:favorites" }));
    });

    expect(result.current.favorites).toEqual([joke]);
  });
});
