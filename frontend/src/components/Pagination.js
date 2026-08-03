import "./Pagination.css";

export function getPageNumbers(currentPage, totalPages) {
  const MAX_WITHOUT_ELLIPSIS = 7;

  if (totalPages <= MAX_WITHOUT_ELLIPSIS) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = [1];

  if (currentPage <= 4) {
    // Near the start: 1 2 3 4 5 ... totalPages
    for (let i = 2; i <= 5; i++) {
      pages.push(i);
    }
    pages.push("ellipsis-end");
    pages.push(totalPages);
  } else if (currentPage >= totalPages - 3) {
    // the final `pages.push(totalPages)` below is the ONLY place the last
    // page number is added, fix for the duplicate-last-page bug.
    pages.push("ellipsis-start");
    for (let i = totalPages - 4; i <= totalPages - 1; i++) {
      pages.push(i);
    }
    pages.push(totalPages);
  } else {
    // Middle: 1 ... cur-1 cur cur+1 ... totalPages
    pages.push("ellipsis-start");
    for (let i = currentPage - 1; i <= currentPage + 1; i++) {
      pages.push(i);
    }
    pages.push("ellipsis-end");
    pages.push(totalPages);
  }

  return pages;
}

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (!totalPages || totalPages <= 1) {
    return null;
  }

  const pages = getPageNumbers(currentPage, totalPages);

  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        type="button"
        className="pagination-btn"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Previous
      </button>

      <ul className="pagination-list">
        {pages.map((page, index) =>
          typeof page === "number" ? (
            <li key={page}>
              <button
                type="button"
                className={
                  page === currentPage
                    ? "pagination-page active"
                    : "pagination-page"
                }
                aria-current={page === currentPage ? "page" : undefined}
                onClick={() => onPageChange(page)}
              >
                {page}
              </button>
            </li>
          ) : (
            <li key={`${page}-${index}`} className="pagination-ellipsis">
              &hellip;
            </li>
          )
        )}
      </ul>

      <button
        type="button"
        className="pagination-btn"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next
      </button>
    </nav>
  );
}