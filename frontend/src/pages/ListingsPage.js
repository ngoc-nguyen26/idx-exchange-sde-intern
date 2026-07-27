import { useEffect, useRef, useState } from "react";
import { fetchProperties } from "../api/client";
import PropertyCard from "../components/PropertyCard";
import PropertyFilters from "../components/PropertyFilters";
import "./ListingsPage.css";

export default function ListingsPage() {
  const [data, setData] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    results: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const latestRequestId = useRef(0);

  async function loadProperties(filters = {}) {
    const requestId = ++latestRequestId.current;

    try {
      setLoading(true);
      setError("");

      const propertiesData = await fetchProperties({
        limit: 20,
        offset: 0,
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
    loadProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSearch(filters) {

    loadProperties(filters);
  }

  function handleClear() {
    loadProperties();
  }

  return (
    <main className="listings-page">
      <header className="listings-header">
        <div>
          <h1>IDX Exchange Properties</h1>
          <p>Browse real property listings from the local MySQL database.</p>
        </div>
      </header>

      <PropertyFilters onSearch={handleSearch} onClear={handleClear} />

      {loading && <p className="status-message">Loading properties...</p>}

      {!loading && error && (
        <div className="error-box">
          <p>{error}</p>
          <button onClick={() => loadProperties()}>Try again</button>
        </div>
      )}

      {!loading && !error && (
        <>
          <p className="property-count">
            Showing {data.results.length} of {data.total} properties
          </p>

          {data.results.length === 0 ? (
            <p className="status-message">
              No properties found matching your filters. Try adjusting or
              clearing them to see more results.
            </p>
          ) : (
            <section className="property-grid">
              {data.results.map((property) => (
                <PropertyCard key={property.L_ListingID} property={property} />
              ))}
            </section>
          )}
        </>
      )}
    </main>
  );
}