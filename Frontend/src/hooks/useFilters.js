// useFilters.js
import { useState } from "react";

// STRATEGY 1: AND logic (all filters work together)
export function useAndFilters(initialState = {}) {
  const [filters, setFilters] = useState({
    partner: "",
    area: "",
    status: "",
    ...initialState,
  });

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      partner: "",
      area: "",
      status: "",
    });
  };

  const applyFilters = (data) => {
    let result = data;

    if (filters.partner) {
      result = result.filter((row) => row.partner_name === filters.partner);
    }
    if (filters.area) {
      result = result.filter((row) => row.area === filters.area);
    }
    if (filters.status) {
      result = result.filter((row) => row.status === filters.status);
    }

    return result;
  };

  return { filters, updateFilter, clearFilters, applyFilters };
}

// STRATEGY 2: Single filter (priority: partner > area > status)
export function useSingleFilter(initialState = {}) {
  const [filters, setFilters] = useState({
    partner: "",
    area: "",
    status: "",
    ...initialState,
  });

  const updateFilter = (key, value) => {
    // Clear all filters first, then set the selected one
    setFilters({
      partner: key === "partner" ? value : "",
      area: key === "area" ? value : "",
      status: key === "status" ? value : "",
    });
  };

  const clearFilters = () => {
    setFilters({
      partner: "",
      area: "",
      status: "",
    });
  };

  const applyFilters = (data) => {
    if (filters.partner) {
      return data.filter((row) => row.partner_name === filters.partner);
    }
    if (filters.area) {
      return data.filter((row) => row.area === filters.area);
    }
    if (filters.status) {
      return data.filter((row) => row.status === filters.status);
    }
    return data;
  };

  return { filters, updateFilter, clearFilters, applyFilters };
}
