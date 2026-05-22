export function PaginationControls({
  currentPage,
  totalPages,
  goToPage,
  nextPage,
  prevPage,
  firstPage,
  lastPage,
  totalItems,
  itemsPerPage,
  showInfo = true,
}) {
  // Generate page numbers to show (with ellipsis)
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5; // Show max 5 page buttons

    if (totalPages <= maxVisible) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      // Show first, last, current, and neighbors
      if (currentPage <= 3) {
        // Near start: 1 2 3 4 ... last
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near end: 1 ... last-3 last-2 last-1 last
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        // Middle: 1 ... prev current next ... last
        pages.push(1);
        pages.push("...");
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  if (totalPages <= 1) return null; // Don't show pagination for 1 page

  return (
    <div className="pagination-container">
      {/* Info text */}
      {showInfo && (
        <div className="pagination-info">
          Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
          {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}{" "}
          items
        </div>
      )}

      {/* Navigation buttons */}
      <div className="pagination-buttons">
        <button
          onClick={firstPage}
          disabled={currentPage === 1}
          className="pagination-btn"
        >
          « First
        </button>

        <button
          onClick={prevPage}
          disabled={currentPage === 1}
          className="pagination-btn"
        >
          ‹ Previous
        </button>

        {getPageNumbers().map((page, idx) => (
          <button
            key={idx}
            onClick={() => typeof page === "number" && goToPage(page)}
            disabled={page === "..." || page === currentPage}
            className={`pagination-btn ${page === currentPage ? "active" : ""}`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={nextPage}
          disabled={currentPage === totalPages}
          className="pagination-btn"
        >
          Next ›
        </button>

        <button
          onClick={lastPage}
          disabled={currentPage === totalPages}
          className="pagination-btn"
        >
          Last »
        </button>
      </div>
    </div>
  );
}
