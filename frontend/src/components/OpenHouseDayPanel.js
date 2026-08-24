import { useEffect, useMemo, useState } from "react";
import PropertyCard from "./PropertyCard";
import Pagination from "./Pagination";

const PAGE_SIZE = 20;

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatTimeRange(event) {
  return `${formatTime(event.start)} – ${formatTime(event.end)}`;
}

function getTimeBucket(date) {
  const h = date.getHours();
  if (h < 12) return "morning";
  if (h < 16) return "afternoon";
  return "evening";
}

export default function OpenHouseDayPanel({ date, events, isPassed, onClose, onSelectProperty }) {
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Aggregate and sort locations by frequency (descending)
  const locationCounts = useMemo(() => {
    const counts = {};
    events.forEach((e) => {
      const city = e.city || "Unknown";
      counts[city] = (counts[city] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count || a.city.localeCompare(b.city));
  }, [events]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return events.filter((e) => {
      if (term && !e.title.toLowerCase().includes(term)) return false;
      if (locationFilter !== "all" && (e.city || "Unknown") !== locationFilter) return false;
      if (timeFilter !== "all" && getTimeBucket(e.start) !== timeFilter) return false;
      return true;
    });
  }, [events, search, locationFilter, timeFilter]);

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => a.start - b.start),
    [filtered]
  );

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    setCurrentPage(1);
  }, [search, locationFilter, timeFilter, date]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const pageStart = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(currentPage * PAGE_SIZE, total);

  const pageItems = useMemo(
    () => sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [sorted, currentPage]
  );

  return (
    <div className="oh-drawer" role="complementary" aria-label="Open houses for selected date">
      <div className="oh-drawer-header">
        <div>
          <div className="oh-drawer-title">
            Open Houses — {date.toLocaleDateString(undefined, { month: "long", day: "numeric" })}
          </div>
        </div>
        {onClose && (
          <button type="button" className="oh-drawer-close" onClick={onClose} aria-label="Close">
            &times;
          </button>
        )}
      </div>

      <input
        className="oh-panel-search"
        type="text"
        placeholder="Search address..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="oh-panel-chip-row">
        <button
          type="button"
          className={`oh-panel-chip${locationFilter === "all" ? " active" : ""}`}
          onClick={() => setLocationFilter("all")}
        >
          All Locations
        </button>
        {locationCounts.map(({ city, count }) => (
          <button
            key={city}
            type="button"
            className={`oh-panel-chip${locationFilter === city ? " active" : ""}`}
            onClick={() => setLocationFilter(city)}
          >
            {city} {count}
          </button>
        ))}
      </div>

      <div className="oh-panel-chip-row">
        {[
          ["all", "Any time"],
          ["morning", "Morning"],
          ["afternoon", "Afternoon"],
          ["evening", "Evening"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`oh-panel-chip${timeFilter === key ? " active" : ""}`}
            onClick={() => setTimeFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="oh-drawer-count">
        {total === 0 ? "No open houses match your filters" : `Showing ${pageStart}–${pageEnd} of ${total}`}
      </div>

      {total === 0 && <p className="oh-panel-empty">No open houses match your filters.</p>}

      {total > 0 && (
        <div className="oh-drawer-cards">
          {pageItems.map((event) => (
            <PropertyCard
              key={event.listingId}
              property={event.rawProperty}
              openHouseTime={formatTimeRange(event)}
              openHouseStatus={isPassed(event) ? "expired" : "upcoming"}
              onClick={() => onSelectProperty(event)}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}