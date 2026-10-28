import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

import { ContentSection } from "@/components/layout/ContentSection";
import { HeartIcon } from "@/components/ui/HeartIcon";
import { QuoteCard } from "@/components/ui/QuoteCard";
import { QuoteGrid } from "@/components/ui/QuoteGrid";
import { useFlip } from "@/hooks/useFlip";

import { useFavorites } from "../../hooks/useFavorites";
import "./SavedJokes.css";

interface SavedJokesProps {
  /** Shown under the empty-state text, e.g. a link back to the jokes. */
  emptyAction?: ReactNode;
}

export function SavedJokes({ emptyAction }: SavedJokesProps) {
  const { favorites, count, max, removeFavorite } = useFavorites();
  const listRef = useRef<HTMLDivElement>(null);
  const emptyTitleRef = useRef<HTMLHeadingElement>(null);
  const indexToFocus = useRef<number | null>(null);
  // Remaining cards slide into the gap when one is removed.
  const flipRef = useFlip(favorites.map((joke) => joke.id));

  // Removing a card unmounts the focused button; hand focus to the card that took its
  // place (or the one before it), and to the empty-state heading after the last removal.
  useEffect(() => {
    const index = indexToFocus.current;
    if (index === null) {
      return;
    }
    indexToFocus.current = null;

    const buttons = listRef.current?.querySelectorAll("button") ?? [];
    const target = buttons[Math.min(index, buttons.length - 1)] ?? emptyTitleRef.current;
    target?.focus();
  }, [favorites]);

  return (
    <ContentSection
      title="Saved jokes"
      metaAccent={`${count} / ${max} saved`}
      metaNote="Saved in this browser"
    >
      {count === 0 ? (
        <div className="saved-jokes__empty">
          <span className="saved-jokes__empty-icon">
            <HeartIcon />
          </span>
          <h3 ref={emptyTitleRef} tabIndex={-1} className="saved-jokes__empty-title">
            No keepers yet
          </h3>
          <p className="saved-jokes__empty-text">Save a joke and it will show up here.</p>
          {emptyAction === undefined ? null : (
            <div className="saved-jokes__empty-action">{emptyAction}</div>
          )}
        </div>
      ) : (
        <div ref={listRef}>
          <QuoteGrid>
            {favorites.map((joke, index) => (
              <QuoteCard
                key={joke.id}
                ref={flipRef(joke.id)}
                text={joke.text}
                isFavorite
                onToggleFavorite={() => {
                  // Only a persisted removal moves focus: a rejected one must not leave a
                  // stale index for a later change (e.g. from another tab) to act on.
                  if (removeFavorite(joke.id)) {
                    indexToFocus.current = index;
                  }
                }}
              />
            ))}
          </QuoteGrid>
        </div>
      )}
    </ContentSection>
  );
}
