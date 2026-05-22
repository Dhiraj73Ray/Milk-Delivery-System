import { useState, useMemo, useCallback } from "react";

export function usePagination(data = [], itemsPerPage = 50) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = useMemo(() => {
    return Math.ceil(data.length / itemsPerPage);
  }, [data.length, itemsPerPage]);

  const startIndex = useMemo(() => {
    return (currentPage - 1) * itemsPerPage;
  }, [currentPage, itemsPerPage]);

  const endIndex = useMemo(() => {
    return startIndex + itemsPerPage;
  }, [startIndex, itemsPerPage]);

  const currentItems = useMemo(() => {
    return data.slice(startIndex, endIndex);
  }, [data, startIndex, endIndex]);

  // ✅ Stable references with useCallback
  const goToPage = useCallback((page) => {
    setCurrentPage(prev => {
      const validPage = Math.max(1, Math.min(page, Math.ceil(data.length / itemsPerPage)));
      return validPage;
    });
  }, [data.length, itemsPerPage]);

  const nextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(prev + 1, Math.ceil(data.length / itemsPerPage)));
  }, [data.length, itemsPerPage]);

  const prevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  }, []);

  const firstPage = useCallback(() => setCurrentPage(1), []);
  const lastPage = useCallback(() => {
    setCurrentPage(Math.ceil(data.length / itemsPerPage));
  }, [data.length, itemsPerPage]);

  const resetPage = useCallback(() => setCurrentPage(1), []); // ✅ stable forever

  return {
    currentPage,
    totalPages,
    currentItems,
    startIndex,
    endIndex,
    totalItems: data.length,
    itemsPerPage,
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    resetPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    isFirstPage: currentPage === 1,
    isLastPage: currentPage === totalPages,
  };
}