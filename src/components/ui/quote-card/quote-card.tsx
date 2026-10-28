import { useId } from "react";
import type { Ref } from "react";

import { HeartIcon } from "../heart-icon";
import "./quote-card.css";

interface QuoteCardProps {
  text: string;
  isFavorite: boolean;
  /** Disables adding a favorite (e.g. list is full). Removing is always allowed. */
  isFavoriteDisabled?: boolean;
  onToggleFavorite: () => void;
  /** Highlights the card with a "New" badge, e.g. for a joke that just arrived. */
  isNew?: boolean;
  /** Root element ref, e.g. for list animations. */
  ref?: Ref<HTMLLIElement>;
}

export function QuoteCard({
  text,
  isFavorite,
  isFavoriteDisabled = false,
  onToggleFavorite,
  isNew = false,
  ref,
}: QuoteCardProps) {
  const textId = useId();
  const isBlocked = isFavoriteDisabled && !isFavorite;

  return (
    <li ref={ref} className={isNew ? "quote-card quote-card--new" : "quote-card"}>
      <span className="quote-card__quote" aria-hidden="true">
        &ldquo;
      </span>
      <p id={textId} className="quote-card__text">
        {text}
      </p>
      {/* The name stays "Favorite" and aria-pressed carries the state: a label that
          also flips with the state would be announced twice. The joke is the description. */}
      {isNew ? <span className="quote-card__badge">New</span> : null}
      <button
        type="button"
        className="quote-card__favorite"
        aria-label="Favorite"
        aria-pressed={isFavorite}
        aria-describedby={textId}
        disabled={isBlocked}
        onClick={onToggleFavorite}
      >
        <HeartIcon filled={isFavorite} />
      </button>
    </li>
  );
}
