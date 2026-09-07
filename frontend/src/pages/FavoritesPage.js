import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import PropertyCard from "../components/PropertyCard";
import PropertyFilters, { EMPTY_FILTERS } from "../components/PropertyFilters";
import SortControls from "../components/SortControls";
import "./ListingsPage.css";


function getZip(property) {
  return property.L_Zip ?? property.L_Address_Zip ?? property.L_ZipCode ?? "";
}

function getListedDate(property) {
  const raw = property.L_Input_Date ?? property.L_SystemDate;
  return raw ? new Date(raw).getTime() : null;
}

function toNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function matchesFilters(property, filters) {
  const city = (filters.city || "").trim().toLowerCase();
  const state = (filters.state || "").trim().toLowerCase();
  const zipcode = (filters.zipcode || "").trim();
  const minPrice = toNumber(filters.minPrice);
  const maxPrice = toNumber(filters.maxPrice);
  const minBeds = toNumber(filters.beds);
  const minBaths = toNumber(filters.baths);

  if (city && !(property.L_City || "").toLowerCase().includes(city)) {
    return false;
  }

  if (state && !(property.L_State || "").toLowerCase().includes(state)) {
    return false;
  }

  if (zipcode && !String(getZip(property)).includes(zipcode)) {
    return false;
  }

  const price = toNumber(property.L_SystemPrice);
  if (minPrice !== null && (price === null || price < minPrice)) {
    return false;
  }
  if (maxPrice !== null && (price === null || price > maxPrice)) {
    return false;
  }

  const beds = toNumber(property.L_Keyword2);
  if (minBeds !== null && (beds === null || beds < minBeds)) {
    return false;
  }

  const baths = toNumber(property.LM_Dec_3);
  if (minBaths !== null && (baths === null || baths < minBaths)) {
    return false;
  }

  return true;
}

function getSortValue(property, sortBy) {
  switch (sortBy) {
    case "price":
      return toNumber(property.L_SystemPrice);
    case "sqft":
      return toNumber(property.LM_Int2_3);
    case "beds":
      return toNumber(property.L_Keyword2);
    case "baths":
      return toNumber(property.LM_Dec_3);
    case "dateListed":
      return getListedDate(property);
    default:
      return null;
  }
}

// sortCriteria: ordered array of { sortBy, sortOrder }. Index 0 sorts
// first; ties are broken by index 1, then index 2, and so on — up to
// all 5 fields can be active at once.
function sortProperties(list, sortCriteria) {
  if (!sortCriteria || sortCriteria.length === 0) {
    return list;
  }

  return [...list].sort((a, b) => {
    for (const { sortBy, sortOrder } of sortCriteria) {
      const direction = sortOrder === "asc" ? 1 : -1;
      const aVal = getSortValue(a, sortBy);
      const bVal = getSortValue(b, sortBy);

      if (aVal === null && bVal === null) continue;
      if (aVal === null) return 1;
      if (bVal === null) return -1;

      if (aVal < bVal) return -1 * direction;
      if (aVal > bVal) return 1 * direction;
      // Tied on this key — fall through to the next priority key.
    }
    return 0;
  });
}

export default function FavoritesPage() {
  const { favorites, isFavorite, toggleFavorite } = useOutletContext();

  const [activeFilters, setActiveFilters] = useState(EMPTY_FILTERS);
  const [sortCriteria, setSortCriteria] = useState([]);

  const visibleFavorites = useMemo(() => {
    const filtered = favorites.filter((property) =>
      matchesFilters(property, activeFilters)
    );
    return sortProperties(filtered, sortCriteria);
  }, [favorites, activeFilters, sortCriteria]);

  function handleSearch(filters) {
    setActiveFilters(filters);
  }

  function handleClear() {
    setActiveFilters(EMPTY_FILTERS);
    setSortCriteria([]);
  }

  function handleSortChange(newSortCriteria) {
    setSortCriteria(newSortCriteria);
  }

  return (
    <main className="listings-page">
      <div className="listings-controls">
        <PropertyFilters onSearch={handleSearch} onClear={handleClear} />
        <SortControls
          sortCriteria={sortCriteria}
          onSortChange={handleSortChange}
        />
      </div>

      <p className="property-count">
        {visibleFavorites.length}{" "}
        {visibleFavorites.length === 1
          ? "favorite property"
          : "favorite properties"}
      </p>

      {favorites.length === 0 ? (
        <p className="status-message">
          You haven't favorited any properties yet. Click the ❤️ on a
          listing to save it here.
        </p>
      ) : visibleFavorites.length === 0 ? (
        <p className="status-message">
          No favorited properties match your filters. Try adjusting or
          clearing them to see more results.
        </p>
      ) : (
        <section className="property-grid">
          {visibleFavorites.map((property) => (
            <PropertyCard
              key={property.L_ListingID}
              property={property}
              isFavorite={isFavorite(property.L_ListingID)}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </section>
      )}
    </main>
  );
}