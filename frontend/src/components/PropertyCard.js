import { useNavigate } from "react-router-dom";
import PropertyImageCarousel from "./PropertyImageCarousel";
import "./PropertyCard.css";

function formatPrice(price) {
  if (price === null || price === undefined) {
    return "Price unavailable";
  }

  return Number(price).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export default function PropertyCard({ property }) {
  const navigate = useNavigate();

  return (
    <article
      className="property-card"
      onClick={() => navigate(`/property/${property.L_ListingID}`)}
      style={{ cursor: "pointer" }}
    >
      <PropertyImageCarousel
        photos={property.L_Photos}
        alt={property.L_Address || "Property"}
      />

      <div className="property-card-body">
        <h2 className="property-price">
          {formatPrice(property.L_SystemPrice)}
        </h2>

        <p className="property-address">
          {property.L_Address || "Address unavailable"}
        </p>

        <p className="property-location">
          {[property.L_City, property.L_State].filter(Boolean).join(", ")}
        </p>

        <div className="property-stats">
          <span>{property.L_Keyword2 ?? "—"} beds</span>
          <span>{property.LM_Dec_3 ?? "—"} baths</span>
          <span>{property.LM_Int2_3 ?? "—"} sqft</span>
        </div>
      </div>
    </article>
  );
}

