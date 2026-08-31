import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
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

export default function PropertyCard({
  property,
  openHouseTime,
  openHouseStatus,
  onClick,
  isFavorite,
  onToggleFavorite,
}) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }

    navigate(`/property/${property.L_ListingID}`);
  };

  const handleFavoriteClick = (event) => {
    // Prevent the card's own onClick (navigation) from firing.
    event.stopPropagation();
    onToggleFavorite(property);
  };

  return (
    <article
      className="property-card"
      onClick={handleClick}
      style={{ cursor: "pointer", position: "relative" }}
    >
      <PropertyImageCarousel
        photos={property.L_Photos}
        alt={property.L_Address || "Property"}
      />

      {onToggleFavorite && (
        <button
          type="button"
          className={`favorite-button${isFavorite ? " favorite-button--active" : ""}`}
          onClick={handleFavoriteClick}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          {isFavorite ? "♥" : "♡"}
        </button>
      )}

      {openHouseStatus && (
        <span className={`oh-card-badge oh-card-badge--${openHouseStatus}`}>
          <span className="oh-card-dot" />
          {openHouseStatus === "expired" ? "Expired" : "Upcoming"}
        </span>
      )}

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

        {openHouseTime && <p className="oh-card-time">{openHouseTime}</p>}

        <div className="property-stats">
          <span>{property.L_Keyword2 ?? "—"} beds</span>
          <span>{property.LM_Dec_3 ?? "—"} baths</span>
          <span>{property.LM_Int2_3 ?? "—"} sqft</span>
        </div>
      </div>
    </article>
  );
}

PropertyCard.propTypes = {
  property: PropTypes.shape({
    L_ListingID: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]).isRequired,

    L_Photos: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.array,
      PropTypes.object,
    ]),

    L_Address: PropTypes.string,
    L_City: PropTypes.string,
    L_State: PropTypes.string,

    L_SystemPrice: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),

    L_Keyword2: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),

    LM_Dec_3: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),

    LM_Int2_3: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
  }).isRequired,

  openHouseTime: PropTypes.string,

  openHouseStatus: PropTypes.oneOf([
    "expired",
    "upcoming",
  ]),

  onClick: PropTypes.func,

  isFavorite: PropTypes.bool,
  onToggleFavorite: PropTypes.func,
};