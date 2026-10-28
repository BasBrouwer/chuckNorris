import { Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { useFavorites } from "@/features/favorites";

/** Site chrome around every page; the header shows the live favorites count. */
export function RootLayout() {
  const { count } = useFavorites();

  return (
    <>
      <SiteHeader favoritesCount={count} />
      <Outlet />
      <SiteFooter />
      {import.meta.env.DEV ? <TanStackRouterDevtools position="bottom-right" /> : null}
    </>
  );
}
