import type { ComponentProps } from "react";
import { vi } from "vitest";

import { createFactory } from "@/test/factories";

import type { QuoteCard } from "./QuoteCard";

export const createQuoteCardProps = createFactory<ComponentProps<typeof QuoteCard>>(() => ({
  text: "Chuck Norris can divide by zero.",
  isFavorite: false,
  onToggleFavorite: vi.fn(),
}));
