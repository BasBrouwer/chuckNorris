import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";

import { QuoteCard } from "./QuoteCard";
import { createQuoteCardProps } from "./QuoteCard.factory";

// QuoteCard renders an <li>, so it always needs a list parent.
function renderInList(ui: ReactElement) {
  return render(<ul>{ui}</ul>);
}

describe("QuoteCard", () => {
  it("renders the quote as a list item", () => {
    renderInList(<QuoteCard {...createQuoteCardProps({ text: "A very good joke." })} />);

    expect(screen.getByRole("listitem")).toHaveTextContent("A very good joke.");
  });

  it("exposes the favorite state through aria-pressed, not through the name", () => {
    const { rerender } = renderInList(
      <QuoteCard {...createQuoteCardProps({ isFavorite: false })} />,
    );
    expect(screen.getByRole("button", { name: "Favorite", pressed: false })).toBeEnabled();

    rerender(
      <ul>
        <QuoteCard {...createQuoteCardProps({ isFavorite: true })} />
      </ul>,
    );

    expect(screen.getByRole("button", { name: "Favorite", pressed: true })).toBeEnabled();
  });

  it("describes the button with the joke so identical buttons can be told apart", () => {
    renderInList(<QuoteCard {...createQuoteCardProps({ text: "A very good joke." })} />);

    expect(screen.getByRole("button", { name: "Favorite" })).toHaveAccessibleDescription(
      "A very good joke.",
    );
  });

  it("calls onToggleFavorite when the heart is clicked", async () => {
    const props = createQuoteCardProps();
    renderInList(<QuoteCard {...props} />);

    await userEvent.setup().click(screen.getByRole("button", { name: "Favorite" }));

    expect(props.onToggleFavorite).toHaveBeenCalledOnce();
  });

  it("blocks adding a favorite while favoriting is disabled", async () => {
    const props = createQuoteCardProps({ isFavorite: false, isFavoriteDisabled: true });
    renderInList(<QuoteCard {...props} />);

    const button = screen.getByRole("button", { name: "Favorite" });
    await userEvent.setup().click(button);

    expect(button).toBeDisabled();
    expect(props.onToggleFavorite).not.toHaveBeenCalled();
  });

  it("still allows removing a favorite while favoriting is disabled", async () => {
    const props = createQuoteCardProps({ isFavorite: true, isFavoriteDisabled: true });
    renderInList(<QuoteCard {...props} />);

    await userEvent.setup().click(screen.getByRole("button", { name: "Favorite", pressed: true }));

    expect(props.onToggleFavorite).toHaveBeenCalledOnce();
  });

  describe("new highlight", () => {
    it("has no badge or highlight by default", () => {
      renderInList(<QuoteCard {...createQuoteCardProps()} />);

      expect(screen.queryByText("New")).not.toBeInTheDocument();
      expect(screen.getByRole("listitem")).not.toHaveClass("quote-card--new");
    });

    it("shows a New badge and the highlight when isNew", () => {
      renderInList(<QuoteCard {...createQuoteCardProps({ isNew: true })} />);

      expect(screen.getByText("New")).toBeVisible();
      expect(screen.getByRole("listitem")).toHaveClass("quote-card--new");
    });

    it("drops the badge and highlight when isNew turns false", () => {
      const { rerender } = renderInList(<QuoteCard {...createQuoteCardProps({ isNew: true })} />);

      rerender(
        <ul>
          <QuoteCard {...createQuoteCardProps({ isNew: false })} />
        </ul>,
      );

      expect(screen.queryByText("New")).not.toBeInTheDocument();
      expect(screen.getByRole("listitem")).not.toHaveClass("quote-card--new");
    });
  });

  it("forwards its ref to the list item", () => {
    const ref = createRef<HTMLLIElement>();

    renderInList(<QuoteCard {...createQuoteCardProps()} ref={ref} />);

    expect(ref.current).toBe(screen.getByRole("listitem"));
  });
});
