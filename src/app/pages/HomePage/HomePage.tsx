import { Hero } from "@/components/layout/Hero";
import { useFavorites } from "@/features/favorites";
import { LatestJokes } from "@/features/jokes";

/** Composes the jokes feed with favorites state; features stay unaware of each other. */
export function HomePage() {
  const { isFavorite, isFull, max, toggleFavorite } = useFavorites();

  return (
    <main>
      <Hero
        eyebrow="Fresh from the internet"
        title="Chuck Norris never refreshes."
        description="The internet refreshes itself out of fear."
      />
      <LatestJokes
        isFavorite={isFavorite}
        isFavoriteDisabled={isFull}
        notice={
          isFull ? `Favorites are full (${max} of ${max}). Remove one to save another.` : undefined
        }
        onToggleFavorite={toggleFavorite}
      />
    </main>
  );
}
