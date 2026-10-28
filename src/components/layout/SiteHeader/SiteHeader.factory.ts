import type { ComponentProps } from "react";

import { createFactory } from "@/test/factories";

import type { SiteHeader } from "./SiteHeader";

export const createSiteHeaderProps = createFactory<ComponentProps<typeof SiteHeader>>(() => ({
  favoritesCount: 0,
}));
