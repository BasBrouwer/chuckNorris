import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { createJokes, createRandomJokeResponse } from "@/test/factories";
import { http, HttpResponse, RANDOM_JOKE_URL, server } from "@/test/mocks";
import { readStoredFavorites, seedFavorites } from "@/test/utils";

import { HomePage } from "./home-page";

async function renderLoadedHome() {
  render(<HomePage />);
  await screen.findAllByRole("listitem");
}

function serveSingleJoke(id: string, value: string) {
  server.use(
    http.get(RANDOM_JOKE_URL, () => HttpResponse.json(createRandomJokeResponse({ id, value }))),
  );
}

describe("HomePage", () => {
  it("shows the hero above the latest jokes", async () => {
    await renderLoadedHome();

    expect(screen.getByRole("main")).toBeVisible();
    expect(
      screen.getByRole("heading", { level: 1, name: "Chuck Norris never refreshes." }),
    ).toBeVisible();
    expect(screen.getByRole("region", { name: "Latest jokes" })).toBeVisible();
  });

  it("saves a favorited joke so the favorites feature can see it", async () => {
    serveSingleJoke("keeper", "Keep this one.");
    await renderLoadedHome();

    await userEvent.setup().click(screen.getByRole("button", { name: "Favorite", pressed: false }));

    expect(screen.getByRole("button", { name: "Favorite", pressed: true })).toBeVisible();
    expect(readStoredFavorites()).toEqual([{ id: "keeper", text: "Keep this one." }]);
  });

  it("removes a joke from the saved favorites when it is un-favorited", async () => {
    serveSingleJoke("known", "Known joke.");
    seedFavorites([{ id: "known", text: "Known joke." }]);
    await renderLoadedHome();

    await userEvent.setup().click(screen.getByRole("button", { name: "Favorite", pressed: true }));

    expect(readStoredFavorites()).toEqual([]);
  });

  it("shows jokes that are already favorites as favorited", async () => {
    serveSingleJoke("known", "Known joke.");
    seedFavorites([{ id: "known", text: "Known joke." }]);

    await renderLoadedHome();

    expect(screen.getByRole("button", { name: "Favorite", pressed: true })).toBeVisible();
  });

  it("blocks new favorites and explains why once ten are saved", async () => {
    seedFavorites(createJokes(10));

    await renderLoadedHome();

    expect(screen.getByRole("status")).toHaveTextContent(
      "Favorites are full (10 of 10). Remove one to save another.",
    );
    for (const heart of screen.getAllByRole("button", { name: "Favorite", pressed: false })) {
      expect(heart).toBeDisabled();
    }
  });

  it("does not show the full-list notice below the limit", async () => {
    seedFavorites(createJokes(9));

    await renderLoadedHome();

    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    expect(screen.getAllByRole("button", { name: "Favorite", pressed: false })[0]).toBeEnabled();
  });
});
