import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { createJokes } from "@/test/factories";
import { renderWithRouter, seedFavorites } from "@/test/utils";

import { FavoritesPage } from "./FavoritesPage";

describe("FavoritesPage", () => {
  it("shows the hero above the saved jokes", async () => {
    await renderWithRouter(<FavoritesPage />, { path: "/favorites" });

    expect(screen.getByRole("main")).toBeVisible();
    expect(screen.getByRole("heading", { level: 1, name: "The keepers." })).toBeVisible();
    expect(screen.getByRole("region", { name: "Saved jokes" })).toBeVisible();
  });

  it("starts with the empty state when nothing is saved", async () => {
    await renderWithRouter(<FavoritesPage />, { path: "/favorites" });

    expect(screen.getByRole("heading", { name: "No keepers yet" })).toBeVisible();
  });

  it("lists the jokes saved earlier", async () => {
    const saved = createJokes(2);
    seedFavorites(saved);

    await renderWithRouter(<FavoritesPage />, { path: "/favorites" });

    for (const joke of saved) {
      expect(screen.getByText(joke.text)).toBeVisible();
    }
    expect(screen.queryByText("No keepers yet")).not.toBeInTheDocument();
  });
});
