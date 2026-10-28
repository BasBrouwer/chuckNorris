import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { renderWithRouter } from "@/test/utils";

import { AccentLink } from "./accent-link";

describe("AccentLink", () => {
  it("is a real link to the given route", async () => {
    await renderWithRouter(<AccentLink to="/favorites">See favorites</AccentLink>);

    expect(screen.getByRole("link", { name: "See favorites" })).toHaveAttribute(
      "href",
      "/favorites",
    );
  });

  it("navigates client-side when clicked", async () => {
    const { router } = await renderWithRouter(
      <AccentLink to="/favorites">See favorites</AccentLink>,
    );

    await userEvent.setup().click(screen.getByRole("link", { name: "See favorites" }));

    expect(router.state.location.pathname).toBe("/favorites");
  });
});
