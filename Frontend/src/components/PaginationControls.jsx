import React, { useState, useEffect } from 'react'

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
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Generate page numbers to show (with ellipsis)
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = isMobile ? 3 : 5; // Show fewer pages on mobile

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= (isMobile ? 3 : 4); i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - (isMobile ? 2 : 3); i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        if (isMobile) {
          pages.push(currentPage);
        } else {
          pages.push(currentPage - 1);
          pages.push(currentPage);
          pages.push(currentPage + 1);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  if (totalPages <= 1) return null;

  // Jump to page input (optional feature)
  const [jumpToPage, setJumpToPage] = useState('')
  const handleJumpToPage = (e) => {
    e.preventDefault()
    const pageNum = parseInt(jumpToPage)
    if (pageNum >= 1 && pageNum <= totalPages) {
      goToPage(pageNum)
      setJumpToPage('')
    }
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Info text */}
      {showInfo && (
        <div className="text-center text-xs sm:text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
          Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
          {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}{" "}
          items
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex flex-wrap justify-center items-center gap-1 sm:gap-1.5">
        {/* First Page - Hide on very small screens */}
        <button
          onClick={firstPage}
          disabled={currentPage === 1}
          className={`
            hidden sm:flex items-center justify-center
            min-w-[36px] sm:min-w-[40px] h-8 sm:h-10 px-2 sm:px-3 
            rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm
            transition-all duration-200 active:scale-95
            ${currentPage === 1 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
            }
          `}
          title="First Page"
        >
          «
        </button>

        {/* Previous Page */}
        <button
          onClick={prevPage}
          disabled={currentPage === 1}
          className={`
            flex items-center justify-center
            min-w-[36px] sm:min-w-[40px] h-8 sm:h-10 px-2 sm:px-3 
            rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm
            transition-all duration-200 active:scale-95
            ${currentPage === 1 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
            }
          `}
          title="Previous Page"
        >
          ‹
        </button>

        {/* Page Numbers */}
        {getPageNumbers().map((page, idx) => (
          <button
            key={idx}
            onClick={() => typeof page === "number" && goToPage(page)}
            disabled={page === "..." || page === currentPage}
            className={`
              flex items-center justify-center
              min-w-[36px] sm:min-w-[40px] h-8 sm:h-10 px-2 sm:px-3 
              rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm
              transition-all duration-200 active:scale-95
              ${page === currentPage 
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' 
                : page === "..."
                  ? 'bg-transparent text-gray-500 cursor-default'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
              }
            `}
          >
            {page}
          </button>
        ))}

        {/* Next Page */}
        <button
          onClick={nextPage}
          disabled={currentPage === totalPages}
          className={`
            flex items-center justify-center
            min-w-[36px] sm:min-w-[40px] h-8 sm:h-10 px-2 sm:px-3 
            rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm
            transition-all duration-200 active:scale-95
            ${currentPage === totalPages 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
            }
          `}
          title="Next Page"
        >
          ›
        </button>

        {/* Last Page - Hide on very small screens */}
        <button
          onClick={lastPage}
          disabled={currentPage === totalPages}
          className={`
            hidden sm:flex items-center justify-center
            min-w-[36px] sm:min-w-[40px] h-8 sm:h-10 px-2 sm:px-3 
            rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm
            transition-all duration-200 active:scale-95
            ${currentPage === totalPages 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
            }
          `}
          title="Last Page"
        >
          »
        </button>
      </div>

      {/* Jump to page - Optional feature */}
      <form onSubmit={handleJumpToPage} className="flex justify-center gap-2 mt-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 hidden sm:inline">Go to</span>
          <input
            type="number"
            min="1"
            max={totalPages}
            value={jumpToPage}
            onChange={(e) => setJumpToPage(e.target.value)}
            placeholder={isMobile ? "Page" : "Page #"}
            className="w-16 sm:w-20 px-2 sm:px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
          />
          <button
            type="submit"
            className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
          >
            Go
          </button>
        </div>
        <div className="text-xs text-gray-500 flex items-center">
          of {totalPages}
        </div>
      </form>
    </div>
  );
}