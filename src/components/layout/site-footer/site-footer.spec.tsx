import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SiteFooter } from "./site-footer";

describe("SiteFooter", () => {
  it("is the page's contentinfo landmark with the attribution and storage notice", () => {
    render(<SiteFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(within(footer).getByText("Powered by the Chuck Norris API")).toBeVisible();
    expect(within(footer).getByText("Favorites are stored locally in your browser")).toBeVisible();
  });
});
