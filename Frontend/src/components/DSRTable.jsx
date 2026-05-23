import React, { useState, useEffect, useMemo, useRef } from 'react'
import api from '../api'
import { transformDSRData, getUniqueValues } from '../utils/dsrHelpers'
import { useAndFilters } from '../hooks/useFilters'
import FilterDropdown from '../components/FilterDropdown'
import useDebounce from '../hooks/useDebounce'
import { usePagination } from '../hooks/usePagination'
import { PaginationControls } from '../components/PaginationControls'
import DsrExcelExport from './DsrExcelExport'
import MultiSelectDropdown from './MultiSelectDropdown'
import DeliveryLogModal from './DeliveryLogModal'

function DSRTable() {
  const today = new Date()
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

  const [month, setMonth] = useState(currentMonth)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [monthError, setMonthError] = useState(null)
  const [searchMode, setSearchMode] = useState('partner')
  const [searchTerm, setSearchTerm] = useState('')
  const [multiSelectMode, setMultiSelectMode] = useState(false)
  const [selectedPartners, setSelectedPartners] = useState([])
  const [selectedAreas, setSelectedAreas] = useState([])
  const [selectedStatuses, setSelectedStatuses] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingLog, setEditingLog] = useState(null)
  const [modalMode, setModalMode] = useState('create')
  const [partnersList, setPartnersList] = useState([])
  const [customersList, setCustomersList] = useState([])
  const [userRole, setUserRole] = useState(null)

  const debouncedSearchTerm = useDebounce(searchTerm, 500)
  const { filters, updateFilter, clearFilters, applyFilters } = useAndFilters()

  useEffect(() => {
    const role = localStorage.getItem('role')
    setUserRole(role)
  }, [])

  useEffect(() => {
    api.get('/delivery-partners')
      .then(res => setPartnersList(res.data))
      .catch(err => console.error('Failed to fetch partners', err))

    api.get('/customers')
      .then(res => setCustomersList(res.data))
      .catch(err => console.error('Failed to fetch customers', err))
  }, [])

  function fetchDSR() {
    let monthToFetch = month

    if (!monthToFetch) {
      setMonthError("Month is required! Using current month as default.")
      monthToFetch = currentMonth
      setMonth(monthToFetch)
    } else if (monthToFetch > currentMonth) {
      setMonthError(`Cannot fetch future months. Using ${currentMonth} instead.`)
      monthToFetch = currentMonth
      setMonth(monthToFetch)
    } else {
      setMonthError(null)
    }

    setLoading(true)
    api.get(`/dsr/month/${monthToFetch}/structured`)
      .then(response => {
        setData(response.data)
        clearFilters()
        setSearchTerm('')
        setLoading(false)
      })
      .catch(err => {
        setError(err.response?.data?.detail || "Failed to fetch DSR data")
        setLoading(false)
      })
  }

  const handleAddLog = () => {
    setEditingLog(null)
    setModalMode('create')
    setModalOpen(true)
  }

  const handleEditLog = (log) => {
    if (log.log_id && log.log_id !== null && log.log_id !== undefined) {
      setEditingLog(log)
      setModalMode('edit')
    } else {
      setEditingLog(log)
      setModalMode('create_from_dsr')
    }
    setModalOpen(true)
  }

  const handleDeleteLog = async (logId) => {
    if (!window.confirm('Are you sure you want to delete this delivery log?')) return

    try {
      await api.delete(`/logs/${logId}`)
      fetchDSR()
    } catch (err) {
      setError(err.response?.data?.detail || 'Delete failed')
    }
  }

  const handleSaveLog = () => {
    fetchDSR()
  }

  const flatData = useMemo(() => {
    return data ? transformDSRData(data, month) : []
  }, [data, month])

  const filteredData = useMemo(() => {
    if (!flatData.length) return []

    let result = [...flatData]

    if (multiSelectMode) {
      if (selectedPartners.length > 0) {
        result = result.filter(row => selectedPartners.includes(row.partner_name))
      }
      if (selectedAreas.length > 0) {
        result = result.filter(row => selectedAreas.includes(row.area))
      }
      if (selectedStatuses.length > 0) {
        result = result.filter(row => selectedStatuses.includes(row.status))
      }
    } else {
      result = applyFilters(flatData)
    }

    if (debouncedSearchTerm) {
      result = result.filter(row => {
        if (searchMode === 'partner') {
          return row.partner_name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        } else {
          return row.customer?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        }
      })
    }

    return result
  }, [flatData, multiSelectMode, selectedPartners, selectedAreas, selectedStatuses, applyFilters, filters, debouncedSearchTerm, searchMode])

  const clearMultiSelectFilters = () => {
    setSelectedPartners([])
    setSelectedAreas([])
    setSelectedStatuses([])
  }

  const handleClearFilters = () => {
    if (multiSelectMode) {
      clearMultiSelectFilters()
    } else {
      clearFilters()
    }
    setSearchTerm('')
  }

  const {
    currentItems: paginatedData,
    currentPage,
    totalPages,
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    totalItems,
    resetPage
  } = usePagination(filteredData, 50)

  const prevFilteredLength = useRef(filteredData.length)
  useEffect(() => {
    if (prevFilteredLength.current !== filteredData.length) {
      resetPage()
      prevFilteredLength.current = filteredData.length
    }
  }, [filteredData.length, resetPage])

  const dropdownOptions = useMemo(() => {
    if (!flatData.length) return { partners: [], areas: [], statuses: [] }

    let filteredForPartnerOptions = flatData
    let filteredForAreaOptions = flatData
    let filteredForStatusOptions = flatData

    if (filters.area) {
      filteredForPartnerOptions = filteredForPartnerOptions.filter(row => row.area === filters.area)
    }
    if (filters.status) {
      filteredForPartnerOptions = filteredForPartnerOptions.filter(row => row.status === filters.status)
    }

    if (filters.partner) {
      filteredForAreaOptions = filteredForAreaOptions.filter(row => row.partner_name === filters.partner)
    }
    if (filters.status) {
      filteredForAreaOptions = filteredForAreaOptions.filter(row => row.status === filters.status)
    }

    if (filters.partner) {
      filteredForStatusOptions = filteredForStatusOptions.filter(row => row.partner_name === filters.partner)
    }
    if (filters.area) {
      filteredForStatusOptions = filteredForStatusOptions.filter(row => row.area === filters.area)
    }

    return {
      partners: getUniqueValues(filteredForPartnerOptions, 'partner_name'),
      areas: getUniqueValues(filteredForAreaOptions, 'area'),
      statuses: getUniqueValues(filteredForStatusOptions, 'status')
    }
  }, [flatData, filters])

  if (filters.partner && !dropdownOptions.partners.includes(filters.partner)) {
    updateFilter('partner', '')
  }
  if (filters.area && !dropdownOptions.areas.includes(filters.area)) {
    updateFilter('area', '')
  }
  if (filters.status && !dropdownOptions.statuses.includes(filters.status)) {
    updateFilter('status', '')
  }

  // Calculate summary stats
  const doneCount = filteredData.filter(row => row.status === 'done').length
  const pendingCount = filteredData.filter(row => row.status === 'pending').length
  const totalLiters = filteredData.reduce((sum, row) => sum + (parseFloat(row.liters) || 0), 0)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold">DSR Report</h2>
              <p className="text-sm text-purple-100 mt-0.5">Daily Sales Report & Delivery Logs</p>
            </div>
          </div>
          {userRole === 'admin' && (
            <button
              onClick={handleAddLog}
              className="px-4 py-2 bg-white/20 rounded-xl font-medium text-sm hover:bg-white/30 active:scale-95 transition-all duration-200 backdrop-blur flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Log
            </button>
          )}
        </div>
      </div>

      {/* Month Selection */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Month
            </label>
            <input
              type="month"
              value={month}
              max={currentMonth}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200"
            />
          </div>
          <div className="flex gap-2 items-end">
            <button
              onClick={fetchDSR}
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 active:scale-95 transition-all duration-200 shadow-md disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Loading...</span>
                </div>
              ) : (
                'Fetch DSR'
              )}
            </button>
            <DsrExcelExport
              month={month}
              currentMonth={currentMonth}
              flatData={flatData}
              filteredData={filteredData}
              paginatedData={paginatedData}
            />
          </div>
        </div>
        {monthError && (
          <div className="mt-3 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-2 rounded-xl text-sm">
            {monthError}
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-2xl p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-200 border-t-purple-600"></div>
          <p className="mt-3 text-gray-500">Loading DSR data...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Error: {error}</span>
        </div>
      )}

      {/* Data Display */}
      {data && (
        <div className="space-y-4">
          {/* Multi-Select Mode Toggle */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={multiSelectMode}
                onChange={(e) => {
                  setMultiSelectMode(e.target.checked)
                  setSelectedPartners([])
                  setSelectedAreas([])
                  setSelectedStatuses([])
                  clearFilters()
                }}
                className="w-5 h-5 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
              />
              <div>
                <span className="font-medium text-gray-800">Enable Multi-Select Mode</span>
                <p className="text-xs text-gray-500 mt-0.5">Select multiple partners, areas, or statuses at once</p>
              </div>
            </label>
          </div>

          {/* Filters */}
          {multiSelectMode ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <MultiSelectDropdown
                  label="Partners"
                  options={dropdownOptions.partners}
                  selectedValues={selectedPartners}
                  onChange={setSelectedPartners}
                  placeholder="Select partners..."
                />
                <MultiSelectDropdown
                  label="Areas"
                  options={dropdownOptions.areas}
                  selectedValues={selectedAreas}
                  onChange={setSelectedAreas}
                  placeholder="Select areas..."
                />
                <MultiSelectDropdown
                  label="Statuses"
                  options={dropdownOptions.statuses}
                  selectedValues={selectedStatuses}
                  onChange={setSelectedStatuses}
                  placeholder="Select statuses..."
                />
              </div>
              <button
                onClick={clearMultiSelectFilters}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-xl font-medium hover:bg-gray-200 active:scale-95 transition-all duration-200"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <FilterDropdown
                  label="Partner"
                  value={filters.partner || ''}
                  options={dropdownOptions.partners}
                  onChange={(value) => updateFilter('partner', value)}
                />
                <FilterDropdown
                  label="Area"
                  value={filters.area || ''}
                  options={dropdownOptions.areas}
                  onChange={(value) => updateFilter('area', value)}
                />
                <FilterDropdown
                  label="Status"
                  value={filters.status || ''}
                  options={dropdownOptions.statuses}
                  onChange={(value) => updateFilter('status', value)}
                />
              </div>
              <button
                onClick={clearFilters}
                className="mt-3 px-4 py-2 text-gray-600 bg-gray-100 rounded-xl font-medium hover:bg-gray-200 active:scale-95 transition-all duration-200"
              >
                Clear Filters
              </button>
            </div>
          )}

          {/* Search Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex gap-4 mb-3">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="partner"
                  checked={searchMode === 'partner'}
                  onChange={() => setSearchMode('partner')}
                  className="w-4 h-4 text-purple-600"
                />
                <span className="text-sm">Partner Name</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="address"
                  checked={searchMode === 'address'}
                  onChange={() => setSearchMode('address')}
                  className="w-4 h-4 text-purple-600"
                />
                <span className="text-sm">Customer Address</span>
              </label>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder={`Search by ${searchMode === 'partner' ? 'Partner Name' : 'Customer Address'}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200"
                />
              </div>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="px-4 py-2.5 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 active:scale-95 transition-all duration-200"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-green-50 rounded-2xl p-3 border border-green-100">
              <p className="text-xs text-gray-600">Completed</p>
              <p className="text-xl font-bold text-green-600">{doneCount}</p>
            </div>
            <div className="bg-orange-50 rounded-2xl p-3 border border-orange-100">
              <p className="text-xs text-gray-600">Pending</p>
              <p className="text-xl font-bold text-orange-600">{pendingCount}</p>
            </div>
            <div className="bg-blue-50 rounded-2xl p-3 border border-blue-100">
              <p className="text-xs text-gray-600">Total Litres</p>
              <p className="text-xl font-bold text-blue-600">{totalLiters.toFixed(1)}</p>
            </div>
          </div>

          {/* Record Count */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold">{filteredData.length}</span> of{' '}
              <span className="font-semibold">{flatData.length}</span> records
            </p>
          </div>

          {/* DSR Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Partner</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Area</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Day</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Time</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Litres</th>
                    {userRole === 'admin' && (
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={userRole === 'admin' ? 8 : 7} className="px-4 py-8 text-center text-gray-500">
                        <svg className="w-12 h-12 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        No records found
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-4 py-3 text-sm font-medium text-gray-800">{row.partner_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{row.area}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-center font-mono">{row.day}</td>
                        <td className="px-4 py-3 text-sm text-gray-800">{row.customer}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            row.status === 'done' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {row.status === 'done' ? '✅ Done' : '⏳ Pending'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 text-center font-mono">{row.delivery_time || '-'}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-right">
                          {parseFloat(row.liters).toFixed(1)} L
                        </td>
                        {userRole === 'admin' && (
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleEditLog(row)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                                title="Edit"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                              {row.log_id && (
                                <button
                                  onClick={() => handleDeleteLog(row.log_id)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                  title="Delete"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalItems > 0 && (
              <div className="border-t border-gray-100 p-4">
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  goToPage={goToPage}
                  nextPage={nextPage}
                  prevPage={prevPage}
                  firstPage={firstPage}
                  lastPage={lastPage}
                  totalItems={totalItems}
                  itemsPerPage={50}
                  showInfo={false}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delivery Log Modal */}
      <DeliveryLogModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        log={editingLog}
        onSave={handleSaveLog}
        mode={modalMode}
        partners={partnersList}
        customers={customersList}
        month={month}
      />
    </div>
  )
}

export default DSRTable