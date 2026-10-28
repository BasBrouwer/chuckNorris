import type { ComponentProps } from "react";
import { vi } from "vitest";

import { createFactory } from "@/test/factories";

import type { Switch } from "./switch";

export const createSwitchProps = createFactory<ComponentProps<typeof Switch>>(() => ({
  checked: false,
  onCheckedChange: vi.fn(),
}));
