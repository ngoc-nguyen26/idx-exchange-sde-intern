import { useMemo, useRef, useState } from "react";

// Once a filtered group is at or below this size, show the address list
// directly instead of another layer of grouping — this is the "20-50
// properties remain relevant" threshold from the design.
const DENSE_THRESHOLD = 30;
const ROW_HEIGHT = 34;
const LIST_HEIGHT = 320;

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function getTimeBucket(date) {
  const h = date.getHours();
  if (h < 12) return "morning";
  if (h < 16) return "afternoon";
  return "evening";
}

// Prefer a real city/neighborhood field from the API if present; otherwise
// fall back to parsing "123 Main St, Dallas, TX 75201" style addresses.
function getCity(event) {
  if (event.city) return event.city;
  const parts = (event.title || "").split(",");
  return parts.length >= 2 ? parts[1].trim() : "Other";
}

function getNeighborhood(event) {
  return event.neighborhood || null;
}

function groupCounts(items, keyFn) {
  const map = new Map();
  items.forEach((item) => {
    const key = keyFn(item) || "Other";
    map.set(key, (map.get(key) || 0) + 1);
  });
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

// Minimal windowed list: only renders the rows currently in (or near) the
// visible scroll area instead of creating a DOM node per property.
function VirtualizedAddressList({ items, onSelectProperty }) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);
  const overscan = 4;

  const totalHeight = items.length * ROW_HEIGHT;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - overscan);
  const visibleCount = Math.ceil(LIST_HEIGHT / ROW_HEIGHT) + overscan * 2;
  const endIndex = Math.min(items.length, startIndex + visibleCount);
  const visibleItems = items.slice(startIndex, endIndex);

  return (
    <div
      ref={containerRef}
      className="oh-panel-list"
      style={{ height: LIST_HEIGHT }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        {visibleItems.map((event, i) => {
          const idx = startIndex + i;
          return (
            <button
              key={event.listingId || idx}
              type="button"
              className="oh-panel-list-row"
              style={{ top: idx * ROW_HEIGHT }}
              onClick={() => onSelectProperty(event)}
            >
              <span className="oh-panel-list-time">{formatTime(event.start)}</span>
              <span className="oh-panel-list-address">{event.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function OpenHouseDayPanel({ date, events, isPassed, onClose, onSelectProperty }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [city, setCity] = useState(null);
  const [neighborhood, setNeighborhood] = useState(null);

  // Search + status + time are always-on facets, applied before any grouping.
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return events.filter((e) => {
      if (term && !e.title.toLowerCase().includes(term)) return false;
      if (statusFilter === "upcoming" && isPassed(e)) return false;
      if (statusFilter === "expired" && !isPassed(e)) return false;
      if (timeFilter !== "all" && getTimeBucket(e.start) !== timeFilter) return false;
      return true;
    });
  }, [events, search, statusFilter, timeFilter, isPassed]);

  const cityFiltered = useMemo(
    () => (city ? filtered.filter((e) => getCity(e) === city) : filtered),
    [filtered, city]
  );

  const hasNeighborhoodData = useMemo(
    () => cityFiltered.some((e) => getNeighborhood(e)),
    [cityFiltered]
  );

  const neighborhoodFiltered = useMemo(
    () =>
      neighborhood
        ? cityFiltered.filter((e) => (getNeighborhood(e) || "Other") === neighborhood)
        : cityFiltered,
    [cityFiltered, neighborhood]
  );

  // Decide what to render: keep drilling into groups until a group is
  // small enough that a plain address list is actually useful.
  const stage = useMemo(() => {
    if (neighborhood) return "list";
    if (city) {
      if (hasNeighborhoodData && cityFiltered.length > DENSE_THRESHOLD) return "neighborhood";
      return "list";
    }
    if (filtered.length > DENSE_THRESHOLD) return "city";
    return "list";
  }, [neighborhood, city, hasNeighborhoodData, cityFiltered.length, filtered.length]);

  const cityGroups = useMemo(() => groupCounts(filtered, getCity), [filtered]);
  const neighborhoodGroups = useMemo(
    () => groupCounts(cityFiltered, getNeighborhood),
    [cityFiltered]
  );

  const activeItems = neighborhood ? neighborhoodFiltered : city ? cityFiltered : filtered;
  const sortedActiveItems = useMemo(
    () => [...activeItems].sort((a, b) => a.start - b.start),
    [activeItems]
  );

  const breadcrumbs = ["All"];
  if (city) breadcrumbs.push(city);
  if (neighborhood) breadcrumbs.push(neighborhood);

  const goToCrumb = (index) => {
    if (index === 0) {
      setCity(null);
      setNeighborhood(null);
    } else if (index === 1) {
      setNeighborhood(null);
    }
  };

  return (
    <div className="oh-day-panel-backdrop" onClick={onClose}>
      <div
        className="oh-day-panel"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="oh-day-panel-header">
          <div>
            <div className="oh-day-panel-date">
              {date.toLocaleDateString(undefined, { month: "long", day: "numeric" })}
            </div>
            <div className="oh-day-panel-count">{filtered.length} Open Houses</div>
          </div>
          <button type="button" className="oh-day-panel-close" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        <input
          className="oh-panel-search"
          type="text"
          placeholder="Search address, city, ZIP"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="oh-panel-chip-row">
          {[
            ["all", "All"],
            ["upcoming", "Upcoming"],
            ["expired", "Expired"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`oh-panel-chip${statusFilter === key ? " active" : ""}`}
              onClick={() => setStatusFilter(key)}
            >
              {label}
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

        {(city || neighborhood) && (
          <div className="oh-panel-breadcrumb">
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb}>
                {i > 0 && <span className="oh-panel-breadcrumb-sep">&rsaquo;</span>}
                <button
                  type="button"
                  className="oh-panel-breadcrumb-btn"
                  onClick={() => goToCrumb(i)}
                >
                  {crumb}
                </button>
              </span>
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <p className="oh-panel-empty">No open houses match your filters.</p>
        )}

        {filtered.length > 0 && stage === "city" && (
          <div className="oh-panel-groups">
            <div className="oh-panel-group-label">Location</div>
            {cityGroups.map(([name, count]) => (
              <button
                key={name}
                type="button"
                className="oh-panel-group-row"
                onClick={() => setCity(name)}
              >
                <span>{name}</span>
                <span className="oh-panel-group-count">{count}</span>
              </button>
            ))}
          </div>
        )}

        {filtered.length > 0 && stage === "neighborhood" && (
          <div className="oh-panel-groups">
            <div className="oh-panel-group-label">Neighborhood</div>
            {neighborhoodGroups.map(([name, count]) => (
              <button
                key={name}
                type="button"
                className="oh-panel-group-row"
                onClick={() => setNeighborhood(name)}
              >
                <span>{name}</span>
                <span className="oh-panel-group-count">{count}</span>
              </button>
            ))}
          </div>
        )}

        {filtered.length > 0 && stage === "list" && (
          <VirtualizedAddressList items={sortedActiveItems} onSelectProperty={onSelectProperty} />
        )}
      </div>
    </div>
  );
}