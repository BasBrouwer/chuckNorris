import { useSyncExternalStore } from "react";

import {
  MAX_FAVORITES,
  getFavorites,
  removeFavorite,
  subscribe,
  toggleFavorite,
} from "../store/favoritesStore";

export function useFavorites() {
  const favorites = useSyncExternalStore(subscribe, getFavorites);

  return {
    favorites,
    count: favorites.length,
    max: MAX_FAVORITES,
    isFull: favorites.length >= MAX_FAVORITES,
    isFavorite: (id: string) => favorites.some((joke) => joke.id === id),
    toggleFavorite,
    removeFavorite,
  };
}
