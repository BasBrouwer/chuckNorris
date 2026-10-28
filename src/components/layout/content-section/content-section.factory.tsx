import type { ComponentProps } from "react";

import { createFactory } from "@/test/factories";

import type { ContentSection } from "./content-section";

export const createContentSectionProps = createFactory<ComponentProps<typeof ContentSection>>(
  () => ({
    title: "Saved jokes",
    children: <p>Section body</p>,
  }),
);
