import { useState } from "react";
import "./PropertyFilters.css";

const BEDS_OPTIONS = [1, 2, 3, 4, 5];
const BATHS_OPTIONS = [1, 2, 3, 4, 5];


export const EMPTY_FILTERS = {
  city: "",
  zipcode: "",
  minPrice: "",
  maxPrice: "",
  beds: "",
  baths: "",
};

export default function PropertyFilters({ onSearch, onClear }) {
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  function handleChange(e) {
    const { name, value } = e.target;
    // Spread the previous filters object and overwrite only the field
    // that changed, so every other filter value is preserved.
    setFilters((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSearch(filters);
  }

  function handleClear() {
    setFilters(EMPTY_FILTERS);
    onClear();
  }

  return (
    <form
      className="property-filters"
      onSubmit={handleSubmit}
      aria-label="Property filters"
    >
      <div className="filter-field">
        <label htmlFor="city">City</label>
        <input
          id="city"
          name="city"
          type="text"
          value={filters.city}
          onChange={handleChange}
          placeholder="e.g. Naperville"
        />
      </div>

      <div className="filter-field">
        <label htmlFor="zipcode">ZIP Code</label>
        <input
          id="zipcode"
          name="zipcode"
          type="text"
          value={filters.zipcode}
          onChange={handleChange}
          placeholder="e.g. 60540"
        />
      </div>

      <div className="filter-field">
        <label htmlFor="minPrice">Min Price</label>
        <input
          id="minPrice"
          name="minPrice"
          type="number"
          min="0"
          value={filters.minPrice}
          onChange={handleChange}
          placeholder="No min"
        />
      </div>

      <div className="filter-field">
        <label htmlFor="maxPrice">Max Price</label>
        <input
          id="maxPrice"
          name="maxPrice"
          type="number"
          min="0"
          value={filters.maxPrice}
          onChange={handleChange}
          placeholder="No max"
        />
      </div>

      <div className="filter-field">
        <label htmlFor="beds">Beds</label>
        <select
          id="beds"
          name="beds"
          value={filters.beds}
          onChange={handleChange}
        >
          <option value="">Any</option>
          {BEDS_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}+
            </option>
          ))}
        </select>
      </div>

      <div className="filter-field">
        <label htmlFor="baths">Baths</label>
        <select
          id="baths"
          name="baths"
          value={filters.baths}
          onChange={handleChange}
        >
          <option value="">Any</option>
          {BATHS_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}+
            </option>
          ))}
        </select>
      </div>

      <div className="filter-actions">
        <button type="submit" className="btn-search">
          Search
        </button>
        <button type="button" className="btn-clear" onClick={handleClear}>
          Clear Filters
        </button>
      </div>
    </form>
  );
}