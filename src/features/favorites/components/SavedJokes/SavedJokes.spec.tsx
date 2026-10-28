import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { createJokes } from "@/test/factories";
import { readStoredFavorites, seedFavorites } from "@/test/utils";

import { SavedJokes } from "./SavedJokes";

function favoriteButtonFor(text: string) {
  return screen.getByRole("button", { name: "Favorite", description: text });
}

function seedThree() {
  const jokes = createJokes(3);
  seedFavorites(jokes);
  return jokes;
}

describe("SavedJokes", () => {
  describe("with no favorites", () => {
    it("shows the empty state and the action it was given", () => {
      render(<SavedJokes emptyAction={<a href="/">Find some jokes</a>} />);

      expect(screen.getByRole("heading", { name: "No keepers yet" })).toBeVisible();
      expect(screen.getByText("Save a joke and it will show up here.")).toBeVisible();
      expect(screen.getByRole("link", { name: "Find some jokes" })).toBeVisible();
      expect(screen.queryByRole("list")).not.toBeInTheDocument();
    });

    it("shows the empty state without an action when none is given", () => {
      render(<SavedJokes />);

      expect(screen.getByRole("heading", { name: "No keepers yet" })).toBeVisible();
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });

    it("shows 0 / 10 saved", () => {
      render(<SavedJokes />);

      expect(screen.getByRole("region", { name: "Saved jokes" })).toHaveTextContent("0 / 10 saved");
    });
  });

  describe("with favorites", () => {
    it("lists every saved joke, newest first as stored, with the count and storage hint", () => {
      const saved = createJokes(3);
      seedFavorites(saved);

      render(<SavedJokes />);

      const items = within(screen.getByRole("list")).getAllByRole("listitem");
      expect(items).toHaveLength(3);
      saved.forEach((joke, index) => {
        expect(items[index]).toHaveTextContent(joke.text);
      });
      const region = screen.getByRole("region", { name: "Saved jokes" });
      expect(region).toHaveTextContent("3 / 10 saved");
      expect(region).toHaveTextContent("Saved in this browser");
      expect(screen.queryByText("No keepers yet")).not.toBeInTheDocument();
    });

    it("does not show the empty-state action while there are favorites", () => {
      seedFavorites(createJokes(1));

      render(<SavedJokes emptyAction={<a href="/">Find some jokes</a>} />);

      expect(screen.queryByRole("link", { name: "Find some jokes" })).not.toBeInTheDocument();
    });

    it("shows every saved joke as a favorite", () => {
      seedFavorites(createJokes(2));

      render(<SavedJokes />);

      expect(screen.getAllByRole("button", { name: "Favorite", pressed: true })).toHaveLength(2);
    });

    it("removes a joke, persists it, and updates the count when its heart is clicked", async () => {
      const [first, second] = createJokes(2);
      if (!first || !second) {
        throw new Error("factory returned fewer jokes than requested");
      }
      seedFavorites([first, second]);
      render(<SavedJokes />);

      await userEvent.setup().click(favoriteButtonFor(first.text));

      expect(screen.queryByText(first.text)).not.toBeInTheDocument();
      expect(screen.getByText(second.text)).toBeVisible();
      expect(screen.getByRole("region", { name: "Saved jokes" })).toHaveTextContent("1 / 10 saved");
      expect(readStoredFavorites()).toEqual([second]);
    });

    it("falls back to the empty state after the last favorite is removed", async () => {
      seedFavorites(createJokes(1));
      render(<SavedJokes />);

      await userEvent.setup().click(screen.getByRole("button", { name: "Favorite" }));

      expect(screen.getByRole("heading", { name: "No keepers yet" })).toBeVisible();
    });
  });

  describe("keyboard focus after removing a joke", () => {
    it("moves to the card that took the removed card's place", async () => {
      const [, middle, last] = seedThree();
      render(<SavedJokes />);

      await userEvent.setup().click(favoriteButtonFor(middle?.text ?? ""));

      expect(favoriteButtonFor(last?.text ?? "")).toHaveFocus();
    });

    it("moves to the previous card when the last one is removed", async () => {
      const [, middle, last] = seedThree();
      render(<SavedJokes />);

      await userEvent.setup().click(favoriteButtonFor(last?.text ?? ""));

      expect(favoriteButtonFor(middle?.text ?? "")).toHaveFocus();
    });

    it("moves to the empty-state heading when the only card is removed", async () => {
      seedFavorites(createJokes(1));
      render(<SavedJokes />);

      await userEvent.setup().click(screen.getByRole("button", { name: "Favorite" }));

      expect(screen.getByRole("heading", { name: "No keepers yet" })).toHaveFocus();
    });

    it("does not move focus on a later change from another tab after a removal storage rejected", async () => {
      vi.spyOn(console, "error").mockImplementation(() => undefined);
      const [first, middle, last] = seedThree();
      if (!first || !middle || !last) {
        throw new Error("factory returned fewer jokes than requested");
      }
      render(<SavedJokes />);
      const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("quota exceeded");
      });

      await userEvent.setup().click(favoriteButtonFor(middle.text));
      setItem.mockRestore();

      // The rejected removal changed nothing, so the card keeps focus.
      expect(favoriteButtonFor(middle.text)).toHaveFocus();

      // Another tab removes the first joke: the list changes without a removal here.
      act(() => {
        seedFavorites([middle, last]);
        window.dispatchEvent(new StorageEvent("storage", { key: "chuckles:favorites" }));
      });

      expect(screen.queryByText(first.text)).not.toBeInTheDocument();
      expect(favoriteButtonFor(middle.text)).toHaveFocus();
    });
  });
});
