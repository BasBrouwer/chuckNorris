import type { ComponentProps } from "react";

import { createFactory } from "@/test/factories";

import type { Hero } from "./hero";

export const createHeroProps = createFactory<ComponentProps<typeof Hero>>(() => ({
  eyebrow: "Fresh from the internet",
  title: "Chuck Norris never refreshes.",
  description: "The internet refreshes itself out of fear.",
}));
