import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { QuoteCardSkeleton } from "./quote-card-skeleton";

describe("QuoteCardSkeleton", () => {
  it("is hidden from assistive technology so placeholders are not read as list items", () => {
    render(
      <ul>
        <QuoteCardSkeleton />
        <QuoteCardSkeleton />
      </ul>,
    );

    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });
});
