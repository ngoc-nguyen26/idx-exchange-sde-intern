import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  fetchPropertyDetail,
  fetchPropertyOpenHouses,
} from "../api/client";
import PropertyImageGallery from "../components/PropertyImageGallery";
import PropertyMap from "../components/PropertyMap";
import "./PropertyDetailPage.css";

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

function formatTime(value) {
  if (!value) return "";

  const [h, m] = value.split(":");
  const hour = Number(h);
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;

  return `${hour12}:${m} ${suffix}`;
}

function formatOpenHouseDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function isOpenHouseExpired(dateValue, endTimeValue) {
  if (!dateValue || !endTimeValue) return false;

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const [hours, minutes] = endTimeValue.split(":").map(Number);

  date.setHours(hours || 0, minutes || 0, 0, 0);

  return date < new Date();
}

function getRemarks(allDataRaw) {
  if (!allDataRaw) return null;

  try {
    const parsed =
      typeof allDataRaw === "string"
        ? JSON.parse(allDataRaw)
        : allDataRaw;

    return parsed.OpenHouseRemarks || null;
  } catch {
    return null;
  }
}

function buildPropertyDetailRows(property) {
  const garageLabel =
    property.AttachedGarageYN === true || property.AttachedGarageYN === "1"
      ? "Yes (Attached)"
      : property.GarageYN === true || property.GarageYN === "1"
      ? "Yes"
      : property.GarageYN === false || property.GarageYN === "0"
      ? "No"
      : null;

  const hoaValue =
    property.AssociationFee !== null &&
    property.AssociationFee !== undefined
      ? `$${Number(property.AssociationFee).toLocaleString()}${
          property.AssociationFeeFrequency
            ? ` / ${property.AssociationFeeFrequency.toLowerCase()}`
            : ""
        }`
      : null;

  const rows = [
    {
      label: "Property Type",
      value: property.L_Type_,
    },
    {
      label: "Year Built",
      value: property.YearBuilt,
    },
    {
      label: "Style",
      value: property.ArchitecturalStyle,
    },
    {
      label: "Stories",
      value: property.StoriesTotal,
    },
    {
      label: "Lot Size",
      value:
        property.LotSizeAcres !== null &&
        property.LotSizeAcres !== undefined
          ? `${Number(property.LotSizeAcres).toLocaleString()} Acres`
          : null,
    },
    {
      label: "Garage",
      value: garageLabel,
    },
    {
      label: "Heating / Cooling",
      value:
        [property.Heating, property.Cooling].filter(Boolean).join(" / ") ||
        null,
    },
    {
      label: "HOA Fee",
      value: hoaValue,
    },
    {
      label: "Days on Market",
      value: property.DaysOnMarket,
    },
    {
      label: "Neighborhood",
      value: property.SubdivisionName || property.CountyOrParish,
    },
    {
      label: "Listing ID",
      value: property.L_DisplayId,
    },
  ];

  return rows.filter(
    (row) =>
      row.value !== null &&
      row.value !== undefined &&
      row.value !== ""
  );
}

const BedIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="17"
    height="17"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 18v-6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v6" />
    <path d="M2 18v2" />
    <path d="M22 18v2" />
    <path d="M4 12V8a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2" />
    <path d="M13 12V9a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3" />
  </svg>
);

const BathIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="17"
    height="17"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3Z" />
    <path d="M6 12V6a2 2 0 0 1 3.6-1.2" />
    <path d="M4 19v2" />
    <path d="M18 19v2" />
  </svg>
);

const SqftIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="17"
    height="17"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h4" />
    <path d="M9 3v4" />
  </svg>
);

const CalendarIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="17"
    height="17"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4" />
    <path d="M8 2v4" />
    <path d="M3 10h18" />
  </svg>
);

const ClockIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

export default function PropertyDetailPage() {
  const { id } = useParams();

  const [property, setProperty] = useState(null);
  const [openHouses, setOpenHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError("");

    Promise.all([
      fetchPropertyDetail(id),
      fetchPropertyOpenHouses(id),
    ])
      .then(([propertyData, openHouseData]) => {
        if (cancelled) return;

        setProperty(propertyData);
        setOpenHouses(openHouseData || []);
      })
      .catch((err) => {
        if (cancelled) return;

        setError(err.message || "Property not found");
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <p className="status-message">
        Loading property...
      </p>
    );
  }

  if (error || !property) {
    return (
      <div className="error-box">
        <p>{error || "Property not found."}</p>

        <Link to="/">
          ← Back to listings
        </Link>
      </div>
    );
  }

  const hasLocation =
    property.LMD_MP_Latitude !== null &&
    property.LMD_MP_Latitude !== undefined &&
    property.LMD_MP_Longitude !== null &&
    property.LMD_MP_Longitude !== undefined;

  const detailRows = buildPropertyDetailRows(property);

  return (
    <main className="property-detail">
      <Link to="/" className="back-link">
        ← Back to listings
      </Link>

      <div className="detail-gallery-card">
        <PropertyImageGallery
          photos={property.L_Photos}
          alt={property.L_Address}
        />
      </div>

      <section className="detail-summary-card">
        <h1 className="detail-price">
          {formatPrice(property.L_SystemPrice)}
        </h1>

        <p className="detail-address">
          {property.L_Address},{" "}
          {[
            property.L_City,
            property.L_State,
            property.L_Zip,
          ]
            .filter(Boolean)
            .join(", ")}
        </p>

        <div className="detail-stats">
          <span className="stat-pill">
            <BedIcon />
            {property.L_Keyword2 ?? "—"} beds
          </span>

          <span className="stat-pill">
            <BathIcon />
            {property.LM_Dec_3 ?? "—"} baths
          </span>

          <span className="stat-pill">
            <SqftIcon />
            {property.LM_Int2_3 ?? "—"} sqft
          </span>

          <span className="stat-pill">
            <CalendarIcon />
            Built {property.YearBuilt ?? "—"}
          </span>
        </div>
      </section>

      <div className="detail-two-column">
        {property.L_Remarks && (
          <section className="detail-card description-card">
            <h2>Description</h2>

            <p
              className={`detail-description-text${
                descriptionExpanded ? "" : " is-clamped"
              }`}
            >
              {property.L_Remarks}
            </p>

            <button
              type="button"
              className="description-toggle"
              onClick={() =>
                setDescriptionExpanded((prev) => !prev)
              }
            >
              {descriptionExpanded ? "Less" : "More"}
            </button>
          </section>
        )}

        {detailRows.length > 0 && (
          <section className="detail-card property-details-card">
            <h2>Property Details</h2>

            <div className="detail-rows">
              {detailRows.map((row) => (
                <div
                  className="detail-row"
                  key={row.label}
                >
                  <span className="detail-row-label">
                    {row.label}
                  </span>

                  <span className="detail-row-value">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {hasLocation && (
        <section className="detail-card location-card">
          <h2>Location</h2>

          <PropertyMap
            lat={property.LMD_MP_Latitude}
            lng={property.LMD_MP_Longitude}
          />
        </section>
      )}

      <section className="detail-card open-houses-section">
        <h2>Open Houses</h2>

        {openHouses.length === 0 ? (
          <p className="no-open-houses">
            No open houses scheduled
          </p>
        ) : (
          <div className="open-house-list">
            {openHouses.map((oh) => {
              const remarks = getRemarks(oh.all_data);

              const expired = isOpenHouseExpired(
                oh.OpenHouseDate,
                oh.OH_EndTime
              );

              return (
                <div
                  key={
                    oh.id ||
                    `${oh.OpenHouseDate}-${oh.OH_StartTime}`
                  }
                  className="open-house-entry"
                >
                  <div className="open-house-date-row">
                    <div className="open-house-date">
                      {formatOpenHouseDate(
                        oh.OpenHouseDate
                      )}
                    </div>

                    {expired && (
                      <span className="expired-badge">
                        Expired
                      </span>
                    )}
                  </div>

                  <div className="open-house-time">
                    <ClockIcon />

                    <span>
                      {formatTime(oh.OH_StartTime)}
                      {" – "}
                      {formatTime(oh.OH_EndTime)}
                    </span>
                  </div>

                  {remarks && (
                    <div className="open-house-remarks">
                      <span className="remarks-label">
                        Remarks
                      </span>

                      <p>{remarks}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}