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
    // Check if this log has a valid log_id
    if (log.log_id && log.log_id !== null && log.log_id !== undefined) {
      // Existing log - edit mode
      setEditingLog(log)
      setModalMode('edit')
    } else {
      // No log exists - create mode
      setEditingLog(log) // Still pass the log data for pre-filling
      setModalMode('create_from_dsr') // New mode type
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

  return (
    <div>
      <h2>DSR Report</h2>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <label>Month: </label>
          <input
            type="month"
            value={month}
            max={currentMonth}
            onChange={(e) => setMonth(e.target.value)}
          />
        </div>
        {monthError && <p style={{ color: 'red', margin: 0 }}>{monthError}</p>}
        <button onClick={fetchDSR}>Fetch DSR</button>

        <DsrExcelExport
          month={month}
          currentMonth={currentMonth}
          flatData={flatData}
          filteredData={filteredData}
          paginatedData={paginatedData}
        />

        {userRole === 'admin' && (
          <button onClick={handleAddLog} style={{ backgroundColor: '#28a745', color: 'white' }}>
            + Add Delivery Log
          </button>
        )}
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {data && (
        <div>
          <div>
            <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                />
                <span>Enable Multi-Select Mode</span>
                <span style={{ fontSize: '12px', color: '#666' }}>
                  (Select multiple partners, areas, or statuses)
                </span>
              </label>
            </div>

            {multiSelectMode ? (
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px' }}>
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
                <button onClick={clearMultiSelectFilters}>Clear Filters</button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px' }}>
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
                <button onClick={clearFilters}>Clear Filters</button>
              </div>
            )}

            <div style={{ marginTop: '10px' }}>
              <label>Search Mode: </label>
              <label>
                <input
                  type="radio"
                  value="partner"
                  checked={searchMode === 'partner'}
                  onChange={() => setSearchMode('partner')}
                />
                Partner Name
              </label>
              <label style={{ marginLeft: '10px' }}>
                <input
                  type="radio"
                  value="address"
                  checked={searchMode === 'address'}
                  onChange={() => setSearchMode('address')}
                />
                Customer Address
              </label>

              <div style={{ marginTop: '5px' }}>
                <input
                  type="text"
                  placeholder={`Search by ${searchMode === 'partner' ? 'Partner Name' : 'Customer Address'}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '250px', padding: '5px' }}
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} style={{ marginLeft: '5px' }}>
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          <p>Showing {filteredData.length} of {flatData.length} records</p>

          <div style={{ overflowX: 'auto', marginTop: '20px' }}>
            <table border="1" style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr>
                  <th>Partner</th>
                  <th>Area</th>
                  <th>Day</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Delivery Time</th>
                  <th>Liters</th>
                  {userRole === 'admin' && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={userRole === 'admin' ? 8 : 7} style={{ textAlign: 'center' }}>
                      No records found
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row, idx) => (
                    <tr key={idx}>
                      <td>{row.partner_name}</td>
                      <td>{row.area}</td>
                      <td>{row.day}</td>
                      <td>{row.customer}</td>
                      <td style={{ color: row.status === 'done' ? 'green' : 'orange' }}>
                        {row.status}
                      </td>
                      <td>{row.delivery_time}</td>
                      <td>{row.liters}</td>
                      {userRole === 'admin' && (
                        <td>
                          <button onClick={() => handleEditLog(row)} style={{ marginRight: '5px' }}>
                            Edit
                          </button>
                          <button onClick={() => handleDeleteLog(row.log_id)} style={{ color: 'red' }}>
                            Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div className="record-count">
              Showing {totalItems === 0 ? 0 : ((currentPage - 1) * 50) + 1} to{' '}
              {Math.min(currentPage * 50, totalItems)} of {totalItems} records
            </div>

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
        </div>
      )}

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