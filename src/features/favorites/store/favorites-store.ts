import type { Joke } from "@/types/joke";

export const MAX_FAVORITES = 10;

const STORAGE_KEY = "chuckles:favorites";

const EMPTY: readonly Joke[] = [];

const listeners = new Set<() => void>();

// getSnapshot must return a referentially stable value while storage is unchanged.
let cachedRaw: string | null = null;
let cachedFavorites: readonly Joke[] = EMPTY;

function isJoke(value: unknown): value is Joke {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    "text" in value &&
    typeof value.text === "string"
  );
}

function parse(raw: string | null): readonly Joke[] {
  if (raw === null) {
    return EMPTY;
  }
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) {
      return EMPTY;
    }
    return data
      .filter(isJoke)
      .slice(0, MAX_FAVORITES)
      .map(({ id, text }) => ({ id, text }));
  } catch {
    return EMPTY;
  }
}

function readRaw(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

export function getFavorites(): readonly Joke[] {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedFavorites = parse(raw);
  }
  return cachedFavorites;
}

/** Persists and notifies. Returns false when storage rejected the write (list unchanged). */
function save(next: readonly Joke[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (error) {
    // Storage unavailable or full: favorites cannot persist, keep the previous list.
    console.error(error);
    return false;
  }
  emit();
  return true;
}

/**
 * Removes the joke with the given id. Returns true when the list changed and was
 * persisted; false when no joke has that id, or when storage rejected the write.
 */
export function removeFavorite(id: string): boolean {
  const current = getFavorites();
  if (!current.some((joke) => joke.id === id)) {
    return false;
  }
  return save(current.filter((joke) => joke.id !== id));
}

/**
 * Adds the joke (newest first), or removes it if already a favorite. Adding does
 * nothing when the list is full; a write that storage rejects leaves the list unchanged.
 */
export function toggleFavorite(joke: Joke): void {
  const current = getFavorites();

  if (current.some((favorite) => favorite.id === joke.id)) {
    save(current.filter((favorite) => favorite.id !== joke.id));
    return;
  }
  if (current.length >= MAX_FAVORITES) {
    return;
  }

  save([{ id: joke.id, text: joke.text }, ...current]);
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  // Fires for changes made in other tabs; same-tab writes go through emit().
  function onStorage(event: StorageEvent) {
    if (event.key === STORAGE_KEY || event.key === null) {
      listener();
    }
  }
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}
