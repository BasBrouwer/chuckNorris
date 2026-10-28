import { Hero } from "@/components/layout/hero";
import { AccentLink } from "@/components/ui/accent-link";
import { SavedJokes } from "@/features/favorites";

export function FavoritesPage() {
  return (
    <main>
      <Hero
        eyebrow="Your collection"
        title="The keepers."
        description="Your favorite Chuck Norris jokes. Saved for your next laugh."
      />
      <SavedJokes emptyAction={<AccentLink to="/">Find some jokes</AccentLink>} />
    </main>
  );
}
