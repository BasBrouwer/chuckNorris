import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithRouter } from "@/test/utils";

import { SiteHeader } from "./SiteHeader";
import { createSiteHeaderProps } from "./SiteHeader.factory";

describe("SiteHeader", () => {
  it("links the brand to the home page", async () => {
    await renderWithRouter(<SiteHeader {...createSiteHeaderProps()} />);

    expect(screen.getByRole("link", { name: /chuckles/i })).toHaveAttribute("href", "/");
  });

  it("offers Jokes and Favorites in the primary navigation", async () => {
    await renderWithRouter(<SiteHeader {...createSiteHeaderProps()} />);

    const nav = screen.getByRole("navigation", { name: "Primary" });
    expect(within(nav).getByRole("link", { name: "Jokes" })).toHaveAttribute("href", "/");
    expect(within(nav).getByRole("link", { name: /favorites/i })).toHaveAttribute(
      "href",
      "/favorites",
    );
  });

  it("announces the favorites count as part of the link's name", async () => {
    await renderWithRouter(<SiteHeader {...createSiteHeaderProps({ favoritesCount: 7 })} />);

    expect(screen.getByRole("link", { name: "Favorites, 7 saved" })).toHaveAttribute(
      "href",
      "/favorites",
    );
  });

  it("shows the count in a badge that is hidden from assistive technology", async () => {
    await renderWithRouter(<SiteHeader {...createSiteHeaderProps({ favoritesCount: 7 })} />);

    const badge = within(screen.getByRole("link", { name: /favorites/i })).getByText("7");
    expect(badge).toHaveAttribute("aria-hidden", "true");
  });

  it("marks Jokes as the current page on the home route only", async () => {
    await renderWithRouter(<SiteHeader {...createSiteHeaderProps()} />, { path: "/" });

    expect(screen.getByRole("link", { name: "Jokes" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /favorites/i })).not.toHaveAttribute("aria-current");
  });

  it("marks Favorites as the current page on the favorites route", async () => {
    await renderWithRouter(<SiteHeader {...createSiteHeaderProps()} />, { path: "/favorites" });

    expect(screen.getByRole("link", { name: /favorites/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Jokes" })).not.toHaveAttribute("aria-current");
  });
});
