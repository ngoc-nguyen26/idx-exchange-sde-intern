import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
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

const MIN_SCALE = 0.94;
const MAX_SCALE = 1.04;

export default function PropertyCard({
  property,
  openHouseTime,
  openHouseStatus,
  onClick,
  isFavorite,
  onToggleFavorite,
}) {
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    let ticking = false;

    function updateScale() {
      const node = cardRef.current;
      ticking = false;

      if (!node) return;

      const rect = node.getBoundingClientRect();
      const viewportHeight =
        window.innerHeight || document.documentElement.clientHeight;

      const cardCenter = rect.top + rect.height / 2;
      const viewportCenter = viewportHeight / 2;
      const maxDistance = viewportHeight / 2 + rect.height / 2;
      const distance = Math.abs(cardCenter - viewportCenter);
      const proximity = 1 - Math.min(distance / maxDistance, 1);

      const nextScale = MIN_SCALE + proximity * (MAX_SCALE - MIN_SCALE);
      setScale(nextScale);
    }

    function onScrollOrResize() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateScale);
      }
    }

    updateScale();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);

    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, []);

  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }

    const targetId = property.L_DisplayId || property.L_ListingID || property.id;
    navigate(`/property/${targetId}`);
  };

  const handleFavoriteClick = (event) => {
    event.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(property);
    }
  };

  return (
    <article
      ref={cardRef}
      className="property-card"
      onClick={handleClick}
      style={{
        cursor: "pointer",
        position: "relative",
        transform: `scale(${scale})`,
      }}
    >
      <PropertyImageCarousel
        photos={property.L_Photos}
        alt={property.L_Address || "Property"}
      />

      {onToggleFavorite && (
        <button
          type="button"
          className={`favorite-button${
            isFavorite ? " favorite-button--active" : ""
          }`}
          onClick={handleFavoriteClick}
          aria-label={
            isFavorite ? "Remove from favorites" : "Add to favorites"
          }
        >
          {isFavorite ? "♥" : "♡"}
        </button>
      )}

      {openHouseStatus && (
        <span
          className={`oh-card-badge oh-card-badge--${openHouseStatus}`}
        >
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
    L_DisplayId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    L_ListingID: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),

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

  openHouseStatus: PropTypes.oneOf(["expired", "upcoming"]),

  onClick: PropTypes.func,

  isFavorite: PropTypes.bool,
  onToggleFavorite: PropTypes.func,
};