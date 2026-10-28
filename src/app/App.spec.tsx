import { createMemoryHistory } from "@tanstack/react-router";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { createJokes } from "@/test/factories";
import { seedFavorites } from "@/test/utils";

import { App } from "./App";
import { createAppRouter } from "./router";

// The devtools panel is dev-only chrome; it is not part of what these tests check.
vi.mock("@tanstack/react-router-devtools", () => ({ TanStackRouterDevtools: () => null }));

/** Every test gets its own router and in-memory history, so nothing leaks between tests. */
function renderApp(path: "/" | "/favorites" = "/") {
  const router = createAppRouter(createMemoryHistory({ initialEntries: [path] }));
  render(<App router={router} />);
  return router;
}

const HOME_TITLE = "Chuck Norris never refreshes.";

describe("App", () => {
  it("renders the site chrome around the home page", async () => {
    renderApp();

    expect(await screen.findByRole("heading", { level: 1, name: HOME_TITLE })).toBeVisible();
    expect(screen.getByRole("banner")).toBeVisible();
    expect(screen.getByRole("contentinfo")).toBeVisible();
    expect(await screen.findAllByRole("listitem")).not.toHaveLength(0);
  });

  it("opens the favorites page directly from its URL", async () => {
    renderApp("/favorites");

    expect(await screen.findByRole("heading", { level: 1, name: "The keepers." })).toBeVisible();
    expect(screen.getByRole("link", { name: /favorites/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("navigates to the favorites page from the header without a reload", async () => {
    const router = renderApp();
    await screen.findByRole("heading", { level: 1, name: HOME_TITLE });

    await userEvent.setup().click(
      within(screen.getByRole("navigation", { name: "Primary" })).getByRole("link", {
        name: /favorites/i,
      }),
    );

    expect(await screen.findByRole("heading", { level: 1, name: "The keepers." })).toBeVisible();
    expect(router.state.location.pathname).toBe("/favorites");
    expect(screen.getByRole("link", { name: /favorites/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("keeps showing the number of saved favorites in the header across pages", async () => {
    seedFavorites(createJokes(4));
    renderApp();
    const link = await screen.findByRole("link", { name: "Favorites, 4 saved" });
    expect(within(link).getByText("4")).toBeVisible();

    await userEvent.setup().click(link);

    await screen.findByRole("heading", { level: 1, name: "The keepers." });
    expect(screen.getByRole("link", { name: "Favorites, 4 saved" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("goes back to the jokes via the empty favorites state link", async () => {
    const router = renderApp("/favorites");

    await userEvent.setup().click(await screen.findByRole("link", { name: "Find some jokes" }));

    expect(await screen.findByRole("heading", { level: 1, name: HOME_TITLE })).toBeVisible();
    expect(router.state.location.pathname).toBe("/");
  });
});
