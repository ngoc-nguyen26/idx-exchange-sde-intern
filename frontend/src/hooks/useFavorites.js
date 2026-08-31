import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "idx-favorites";

// Saves favorited properties to localStorage so they persist after page refreshes.
// Stores the full property data instead of just the ID, allowing the Favorites view
// to display property cards without fetching the data again. */
export default function useFavorites() {
  const [favorites, setFavorites] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const isFavorite = useCallback(
    (listingId) => favorites.some((p) => p.L_ListingID === listingId),
    [favorites]
  );

  const toggleFavorite = useCallback((property) => {
    setFavorites((current) =>
      current.some((p) => p.L_ListingID === property.L_ListingID)
        ? current.filter((p) => p.L_ListingID !== property.L_ListingID)
        : [...current, property]
    );
  }, []);

  return { favorites, isFavorite, toggleFavorite };
}