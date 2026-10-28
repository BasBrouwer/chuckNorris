import { Link } from "@tanstack/react-router";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { renderWithRouter } from "./renderWithRouter";

describe("renderWithRouter", () => {
  it("renders the UI inside a router, ready to use immediately", async () => {
    await renderWithRouter(<Link to="/favorites">Go</Link>);

    expect(screen.getByRole("link", { name: "Go" })).toHaveAttribute("href", "/favorites");
  });

  it("starts at the requested path", async () => {
    const { router } = await renderWithRouter(<p>ui</p>, { path: "/favorites" });

    expect(router.state.location.pathname).toBe("/favorites");
  });

  it("navigates between the app's paths", async () => {
    const { router } = await renderWithRouter(<Link to="/favorites">Go</Link>);

    await userEvent.setup().click(screen.getByRole("link", { name: "Go" }));

    expect(router.state.location.pathname).toBe("/favorites");
  });
});
