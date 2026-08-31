import { useOutletContext } from "react-router-dom";
import PropertyCard from "../components/PropertyCard";
import "./ListingsPage.css";

export default function FavoritesPage() {
  const { favorites, isFavorite, toggleFavorite } = useOutletContext();

  return (
    <main className="listings-page">
      <p className="property-count">
        {favorites.length}{" "}
        {favorites.length === 1 ? "favorite property" : "favorite properties"}
      </p>

      {favorites.length === 0 ? (
        <p className="status-message">
          You haven't favorited any properties yet. Click the heart icon on a
          listing to save it here.
        </p>
      ) : (
        <section className="property-grid">
          {favorites.map((property) => (
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