import { Hero } from "@/components/layout/Hero";
import { AccentLink } from "@/components/ui/AccentLink";
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
