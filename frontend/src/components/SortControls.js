import { useEffect, useRef, useState } from "react";
import "./SortControls.css";

const SORT_FIELDS = [
  {
    key: "price",
    label: "PRICE",
    options: [
      { value: "price-asc", label: "Low to High" },
      { value: "price-desc", label: "High to Low" },
    ],
  },
  {
    key: "dateListed",
    label: "DATE LISTED",
    options: [
      { value: "dateListed-desc", label: "Newest" },
      { value: "dateListed-asc", label: "Oldest" },
    ],
  },
  {
    key: "sqft",
    label: "SQUARE FOOTAGE",
    options: [
      { value: "sqft-desc", label: "High to Low" },
      { value: "sqft-asc", label: "Low to High" },
    ],
  },
  {
    key: "beds",
    label: "BEDS",
    options: [
      { value: "beds-desc", label: "Most to Fewest" },
      { value: "beds-asc", label: "Fewest to Most" },
    ],
  },
  {
    key: "baths",
    label: "BATHS",
    options: [
      { value: "baths-desc", label: "Most to Fewest" },
      { value: "baths-asc", label: "Fewest to Most" },
    ],
  },
];

// sortCriteria: ordered array of { sortBy, sortOrder }, e.g.
// [{ sortBy: "price", sortOrder: "asc" }, { sortBy: "beds", sortOrder: "desc" }]
// Array position = priority (index 0 sorts first, ties broken by index 1, etc).
export default function SortControls({ sortCriteria, onSortChange }) {
  const [isOpen, setIsOpen] = useState(true);
  const [openField, setOpenField] = useState(null);
  const [pendingCriteria, setPendingCriteria] = useState(sortCriteria || []);

  const containerRef = useRef(null);

  useEffect(() => {
    setPendingCriteria(sortCriteria || []);
  }, [sortCriteria]);

  // Outside clicks ONLY close individual open select dropdowns.
  // They will NOT close the main Sort By panel anymore.
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpenField(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function findEntry(fieldKey) {
    return pendingCriteria.find((entry) => entry.sortBy === fieldKey);
  }

  function handleSelect(fieldKey, value) {
    const [, direction] = value.split("-");

    setPendingCriteria((current) => {
      const existingIndex = current.findIndex(
        (entry) => entry.sortBy === fieldKey
      );

      if (existingIndex !== -1) {
        const next = [...current];
        next[existingIndex] = { sortBy: fieldKey, sortOrder: direction };
        return next;
      }

      return [...current, { sortBy: fieldKey, sortOrder: direction }];
    });

    setOpenField(null);
  }

  function handleRemoveField(fieldKey) {
    setPendingCriteria((current) =>
      current.filter((entry) => entry.sortBy !== fieldKey)
    );
    setOpenField(null);
  }

  function handleApply() {
    onSortChange(pendingCriteria);
    setOpenField(null);
  }

  function handleClear() {
    setPendingCriteria([]);
    onSortChange([]);
    setOpenField(null);
  }

  function getSelectedLabel(field) {
    const entry = findEntry(field.key);
    if (!entry) return "Any";

    const currentValue = `${entry.sortBy}-${entry.sortOrder}`;
    const selectedOption = field.options.find(
      (option) => option.value === currentValue
    );
    return selectedOption?.label || "Any";
  }

  function toggleField(fieldKey) {
    setOpenField((current) => (current === fieldKey ? null : fieldKey));
  }

  const activeCount = pendingCriteria.length;

  return (
    <div className="sort-controls" ref={containerRef}>
      <button
        type="button"
        className="sort-header"
        onClick={() => {
          setIsOpen((current) => !current);
          setOpenField(null);
        }}
        aria-expanded={isOpen}
      >
        <span>Sort By{activeCount > 0 ? ` (${activeCount})` : ""}</span>
      </button>

      <div className={`sort-menu ${isOpen ? "" : "collapsed"}`}>
        <div className="sort-fields">
          {SORT_FIELDS.map((field) => {
            const isFieldOpen = openField === field.key;
            const entry = findEntry(field.key);
            const priorityIndex = entry
              ? pendingCriteria.indexOf(entry)
              : -1;
            const currentValue = entry
              ? `${entry.sortBy}-${entry.sortOrder}`
              : "";

            return (
              <div className="sort-field" key={field.key}>
                <label>
                  {field.label}
                  {priorityIndex !== -1 && (
                    <span
                      className="sort-priority-badge"
                      title={`Priority ${priorityIndex + 1}`}
                    >
                      {priorityIndex + 1}
                    </span>
                  )}
                </label>

                <div className="sort-select-row">
                  <div className="sort-select-wrapper">
                    <button
                      type="button"
                      className={`sort-select ${
                        isFieldOpen ? "focused" : ""
                      }`}
                      onClick={() => toggleField(field.key)}
                      aria-expanded={isFieldOpen}
                      aria-haspopup="listbox"
                    >
                      <span>{getSelectedLabel(field)}</span>
                    </button>

                    {isFieldOpen && (
                      <div className="sort-dropdown" role="listbox">
                        {field.options.map((option) => {
                          const isSelected = option.value === currentValue;

                          return (
                            <button
                              key={option.value}
                              type="button"
                              role="option"
                              aria-selected={isSelected}
                              className={`sort-dropdown-option ${
                                isSelected ? "active" : ""
                              }`}
                              onClick={() =>
                                handleSelect(field.key, option.value)
                              }
                            >
                              <span>{option.label}</span>

                              {isSelected && (
                                <span
                                  className="sort-check"
                                  aria-hidden="true"
                                >
                                  ✓
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {entry && (
                    <button
                      type="button"
                      className="sort-field-clear"
                      onClick={() => handleRemoveField(field.key)}
                      aria-label={`Clear ${field.label} sort`}
                      title={`Clear ${field.label} sort`}
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="sort-actions">
          <button type="button" className="sort-apply" onClick={handleApply}>
            Apply Sort
          </button>

          <button type="button" className="sort-clear" onClick={handleClear}>
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}