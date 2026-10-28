import type { ComponentProps } from "react";
import { vi } from "vitest";

import { createFactory } from "@/test/factories";

import type { LatestJokes } from "./LatestJokes";

export const createLatestJokesProps = createFactory<ComponentProps<typeof LatestJokes>>(() => ({
  isFavorite: vi.fn(() => false),
  onToggleFavorite: vi.fn(),
}));
