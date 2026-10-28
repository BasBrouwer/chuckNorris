import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { QuoteGrid } from "./QuoteGrid";

describe("QuoteGrid", () => {
  it("renders its children as the items of a list", () => {
    render(
      <QuoteGrid>
        <li>First</li>
        <li>Second</li>
      </QuoteGrid>,
    );

    const items = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(items.map((item) => item.textContent)).toEqual(["First", "Second"]);
  });
});
