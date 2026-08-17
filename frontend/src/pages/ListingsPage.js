import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchProperties } from "../api/client";
import PropertyCard from "../components/PropertyCard";
import PropertyFilters from "../components/PropertyFilters";
import Pagination from "../components/Pagination";
import "./ListingsPage.css";

export default function ListingsPage() {
  const [searchParams] = useSearchParams();
  const showFilters = searchParams.get("view") === "search";

  const [data, setData] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    results: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // The filters currently applied to the results. Kept separate from
  // whatever is typed in the form so that changing pages can re-fetch
  // with the SAME filters still applied.
  const [activeFilters, setActiveFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  const latestRequestId = useRef(0);
  const isFirstRender = useRef(true);

  async function loadProperties(filters = {}, page = 1) {
    const requestId = ++latestRequestId.current;
    const offset = (page - 1) * itemsPerPage;

    try {
      setLoading(true);
      setError("");

      const propertiesData = await fetchProperties({
        limit: itemsPerPage,
        offset,
        ...filters,
      });

      if (requestId !== latestRequestId.current) {
        return;
      }

      setData(propertiesData);
    } catch (err) {
      if (requestId !== latestRequestId.current) {
        return;
      }
      setError(err.message || "Unable to load properties");
    } finally {
      if (requestId === latestRequestId.current) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      loadProperties({}, 1);
      return;
    }

    if (!showFilters) {
      setActiveFilters({});
      setCurrentPage(1);
      loadProperties({}, 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showFilters]);

  // Requirement 35: changing filters must reset to page 1.
  function handleSearch(filters) {
    setActiveFilters(filters);
    setCurrentPage(1);
    loadProperties(filters, 1);
  }

  function handleClear() {
    setActiveFilters({});
    setCurrentPage(1);
    loadProperties({}, 1);
  }

  // Requirement 34: changing pages must scroll to top and preserve
  // the active filters (activeFilters is passed straight through).
  function handlePageChange(page) {
    if (page < 1 || page > totalPages || page === currentPage) {
      return;
    }
    setCurrentPage(page);
    loadProperties(activeFilters, page);
    window.scrollTo(0, 0);
  }

  const totalPages = Math.max(1, Math.ceil(data.total / itemsPerPage));
  const rangeStart = data.total === 0 ? 0 : data.offset + 1;
  const rangeEnd = data.offset + data.results.length;

  return (
    <main className="listings-page">
      {showFilters && (
        <PropertyFilters onSearch={handleSearch} onClear={handleClear} />
      )}

      {loading && <p className="status-message">Loading properties...</p>}

      {!loading && error && (
        <div className="error-box">
          <p>{error}</p>
          <button onClick={() => loadProperties(activeFilters, currentPage)}>
            Try again
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          <p className="property-count">
            Showing {rangeStart}-{rangeEnd} of {data.total} properties
          </p>

          {data.results.length === 0 ? (
            <p className="status-message">
              No properties found matching your filters. Try adjusting or
              clearing them to see more results.
            </p>
          ) : (
            <>
              <section className="property-grid">
                {data.results.map((property) => (
                  <PropertyCard
                    key={property.L_ListingID}
                    property={property}
                  />
                ))}
              </section>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </>
      )}
    </main>
  );
}