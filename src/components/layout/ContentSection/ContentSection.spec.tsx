import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ContentSection } from "./ContentSection";
import { createContentSectionProps } from "./ContentSection.factory";

describe("ContentSection", () => {
  it("is a region labelled by its heading", () => {
    render(<ContentSection {...createContentSectionProps({ title: "Latest jokes" })} />);

    const region = screen.getByRole("region", { name: "Latest jokes" });
    expect(region).toContainElement(
      screen.getByRole("heading", { level: 2, name: "Latest jokes" }),
    );
  });

  it("renders the accent figure, the note, the aside and the children", () => {
    render(
      <ContentSection
        {...createContentSectionProps({
          metaAccent: "3 / 10 saved",
          metaNote: "Saved in this browser",
          aside: <button type="button">Refresh</button>,
          children: <p>Body copy</p>,
        })}
      />,
    );

    expect(screen.getByText("3 / 10 saved")).toBeVisible();
    expect(screen.getByText("Saved in this browser")).toBeVisible();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeVisible();
    expect(screen.getByText("Body copy")).toBeVisible();
  });

  it("renders only the note when there is no figure", () => {
    render(<ContentSection {...createContentSectionProps({ metaNote: "Newest first" })} />);

    expect(screen.getByText("Newest first")).toBeVisible();
  });

  it("keeps an inert, hidden meta placeholder so the header height does not jump", () => {
    const { container } = render(<ContentSection {...createContentSectionProps()} />);

    expect(container.querySelector(".content-section__meta")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("exposes the meta to assistive technology once there is some", () => {
    const { container } = render(
      <ContentSection {...createContentSectionProps({ metaAccent: "10 latest" })} />,
    );

    expect(container.querySelector(".content-section__meta")).toHaveAttribute(
      "aria-hidden",
      "false",
    );
  });
});
