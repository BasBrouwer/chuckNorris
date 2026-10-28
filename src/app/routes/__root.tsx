import { createRootRoute } from "@tanstack/react-router";

import { RootLayout } from "@/app/layouts/RootLayout";

export const Route = createRootRoute({
  component: RootLayout,
});
