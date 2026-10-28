import { createFileRoute } from "@tanstack/react-router";

import { FavoritesPage } from "@/app/pages/favorites-page";

export const Route = createFileRoute("/favorites")({
  component: FavoritesPage,
});
