import { useId, useState } from "react";

import { ContentSection } from "@/components/layout/ContentSection";
import { QuoteCard } from "@/components/ui/QuoteCard";
import { QuoteCardSkeleton } from "@/components/ui/QuoteCardSkeleton";
import { QuoteGrid } from "@/components/ui/QuoteGrid";
import { Spinner } from "@/components/ui/Spinner";
import { Switch } from "@/components/ui/Switch";
import { useFlip } from "@/hooks/useFlip";
import type { Joke } from "@/types/joke";

import { AUTO_REFRESH_INTERVAL_MS, useJokes } from "../../hooks/useJokes";
import "./LatestJokes.css";

const SKELETON_KEYS = Array.from({ length: 6 }, (_, index) => `skeleton-${index}`);

interface LatestJokesProps {
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (joke: Joke) => void;
  /** Disables favoriting jokes that are not favorites yet (e.g. the list is full). */
  isFavoriteDisabled?: boolean;
  /** Message shown above the list, e.g. why favoriting is disabled. */
  notice?: string | undefined;
}

export function LatestJokes({
  isFavorite,
  onToggleFavorite,
  isFavoriteDisabled = false,
  notice,
}: LatestJokesProps) {
  const [isAutoRefresh, setIsAutoRefresh] = useState(false);
  const { jokes, status, retry, freshIds } = useJokes({ autoRefresh: isAutoRefresh });
  // Cards slide to their new slots when a joke is inserted on top.
  const flipRef = useFlip(jokes.map((joke) => joke.id));
  const isInitialLoad = status === "loading" && jokes.length === 0;
  const switchId = useId();
  const hintId = useId();

  return (
    <ContentSection
      title="Latest jokes"
      metaAccent={jokes.length === 0 ? undefined : `${jokes.length} latest`}
      metaNote={jokes.length === 0 ? undefined : "Newest first"}
      aside={
        <div className="latest-jokes__refresh">
          <div className="latest-jokes__refresh-text">
            <label htmlFor={switchId} className="latest-jokes__refresh-label">
              Auto-refresh
            </label>
            <span id={hintId} className="latest-jokes__refresh-hint">
              Every {AUTO_REFRESH_INTERVAL_MS / 1000} seconds
            </span>
          </div>
          <Switch
            id={switchId}
            describedBy={hintId}
            checked={isAutoRefresh}
            onCheckedChange={setIsAutoRefresh}
          />
        </div>
      }
    >
      {/* Always mounted: screen readers only announce changes to a live region that
          already exists, so the notice text must change inside it, not mount with it. */}
      <p className="latest-jokes__notice" role="status">
        {notice}
      </p>

      {isInitialLoad ? (
        <div className="latest-jokes__loading" role="status">
          <Spinner />
          <div>
            <p className="latest-jokes__loading-title">Fetching fresh jokes</p>
            <p className="latest-jokes__loading-text">Chuck Norris is making the API hurry up.</p>
          </div>
        </div>
      ) : null}

      {status === "error" && jokes.length === 0 ? (
        <p className="latest-jokes__state" role="alert">
          Couldn&apos;t load jokes.{" "}
          <button type="button" className="latest-jokes__retry" onClick={retry}>
            Try again
          </button>
        </p>
      ) : null}

      <QuoteGrid>
        {isInitialLoad ? SKELETON_KEYS.map((key) => <QuoteCardSkeleton key={key} />) : null}
        {jokes.map((joke) => (
          <QuoteCard
            key={joke.id}
            ref={flipRef(joke.id)}
            isNew={freshIds.includes(joke.id)}
            text={joke.text}
            isFavorite={isFavorite(joke.id)}
            isFavoriteDisabled={isFavoriteDisabled}
            onToggleFavorite={() => {
              onToggleFavorite(joke);
            }}
          />
        ))}
      </QuoteGrid>
    </ContentSection>
  );
}
