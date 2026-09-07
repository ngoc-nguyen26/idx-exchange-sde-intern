import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams, useOutletContext } from "react-router-dom";
import { fetchProperties } from "../api/client";
import PropertyCard from "../components/PropertyCard";
import PropertyFilters from "../components/PropertyFilters";
import SortControls from "../components/SortControls";
import Pagination from "../components/Pagination";
import "./ListingsPage.css";


const TYPING_TEXT = "Not what you\u2019re looking for? Start your ";
const TYPING_SPEED_MS = 65;

export default function ListingsPage() {
  const [searchParams] = useSearchParams();
  const showFilters = searchParams.get("view") === "search";
  const { isFavorite, toggleFavorite } = useOutletContext();

  const [data, setData] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    results: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeFilters, setActiveFilters] = useState({});

  const [sortCriteria, setSortCriteria] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  const latestRequestId = useRef(0);
  const isFirstRender = useRef(true);

  // Typing effect state for the home page banner.
  const [typedText, setTypedText] = useState("");
  const [isTypingDone, setIsTypingDone] = useState(false);

  function primarySort(criteria) {
    const first = criteria && criteria[0];
    return {
      sortBy: first ? first.sortBy : "",
      sortOrder: first ? first.sortOrder : "",
    };
  }

  async function loadProperties(filters = {}, page = 1, sort = {}) {
    const requestId = ++latestRequestId.current;
    const offset = (page - 1) * itemsPerPage;

    try {
      setLoading(true);
      setError("");

      const propertiesData = await fetchProperties({
        limit: itemsPerPage,
        offset,
        ...filters,
        ...sort,
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
      setSortCriteria([]);
      setCurrentPage(1);
      loadProperties({}, 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showFilters]);

  // Drive the typing effect only on the home page (not the search page,
  // which already shows the filter panel instead of this banner).
  useEffect(() => {
    if (showFilters) {
      return;
    }

    setTypedText("");
    setIsTypingDone(false);

    let charIndex = 0;
    const intervalId = setInterval(() => {
      charIndex += 1;
      setTypedText(TYPING_TEXT.slice(0, charIndex));

      if (charIndex >= TYPING_TEXT.length) {
        clearInterval(intervalId);
        setIsTypingDone(true);
      }
    }, TYPING_SPEED_MS);

    return () => clearInterval(intervalId);
  }, [showFilters]);


  function handleSearch(filters) {
    setActiveFilters(filters);
    setSortCriteria([]);
    setCurrentPage(1);
    loadProperties(filters, 1);
  }

  function handleClear() {
    setActiveFilters({});
    setSortCriteria([]);
    setCurrentPage(1);
    loadProperties({}, 1);
  }

  function handleSortChange(newSortCriteria) {
    setSortCriteria(newSortCriteria);
    setCurrentPage(1);
    loadProperties(activeFilters, 1, primarySort(newSortCriteria));
  }

  function handlePageChange(page) {
    if (page < 1 || page > totalPages || page === currentPage) {
      return;
    }
    setCurrentPage(page);
    loadProperties(activeFilters, page, primarySort(sortCriteria));
    window.scrollTo(0, 0);
  }

  const totalPages = Math.max(1, Math.ceil(data.total / itemsPerPage));
  const rangeStart = data.total === 0 ? 0 : data.offset + 1;
  const rangeEnd = data.offset + data.results.length;

  return (
    <main className="listings-page">
      {showFilters && (
        <div className="listings-controls">
          <PropertyFilters onSearch={handleSearch} onClear={handleClear} />
          <SortControls
            sortCriteria={sortCriteria}
            onSortChange={handleSortChange}
          />
        </div>
      )}

      {!showFilters && (
        <p className="home-typing-banner">
          {typedText.split("\n").map((line, index) => (
            <span key={index}>
              {index > 0 && <br />}
              {line}
            </span>
          ))}
          {isTypingDone && (
            <Link to="/?view=search" className="home-typing-link">
              Property Search
            </Link>
          )}
          {!isTypingDone && <span className="home-typing-cursor" aria-hidden="true" />}
        </p>
      )}

      {loading && <p className="status-message">Loading properties...</p>}

      {!loading && error && (
        <div className="error-box">
          <p>{error}</p>
          <button onClick={() => loadProperties(activeFilters, currentPage, primarySort(sortCriteria))}>
            Try again
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          {showFilters && (
            <p className="property-count">
              Showing {rangeStart}-{rangeEnd} of {data.total} properties
            </p>
          )}

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
                    isFavorite={isFavorite(property.L_ListingID)}
                    onToggleFavorite={toggleFavorite}
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