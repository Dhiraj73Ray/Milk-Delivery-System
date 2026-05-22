import React, { useState, useRef, useEffect } from 'react'
import api from '../api'

function DsrExcelExport({ month, flatData, filteredData, paginatedData }) {
  const [loadingExport, setLoadingExport] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Export options state
  const [exportFiltered, setExportFiltered] = useState(false)
  const [exportPaginated, setExportPaginated] = useState(false)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getDataToExport = () => {
    let data = [...flatData]

    if (exportFiltered) {
      const filteredIds = new Set(filteredData.map(row => row.customer_id + row.day))
      data = data.filter(row => filteredIds.has(row.customer_id + row.day))
    }

    if (exportPaginated) {
      const paginatedIds = new Set(paginatedData.map(row => row.customer_id + row.day))
      data = data.filter(row => paginatedIds.has(row.customer_id + row.day))
    }

    return data
  }

  const convertToExcel = (data) => {
    // Simple CSV for now (we'll improve)
    if (data.length === 0) return null

    const headers = Object.keys(data[0])
    const csvRows = []
    csvRows.push(headers.join(','))

    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header] || ''
        return `"${String(value).replace(/"/g, '""')}"`
      })
      csvRows.push(values.join(','))
    }

    return new Blob([csvRows.join('\n')], { type: 'text/csv' })
  }

  const handleExport = async () => {
    const dataToExport = getDataToExport()

    if (dataToExport.length === 0) {
      alert('No data to export. Check your filter options.')
      return
    }

    setLoadingExport(true)
    setDropdownOpen(false)

    try {
      // Convert data to CSV/Excel
      const blob = convertToExcel(dataToExport)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const now = new Date()
      const dateStr = now.toISOString().slice(0, 19).replace(/:/g, '-')
      link.download = `DSR_${month}_${dateStr}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Export error:", error)
      alert('Failed to export')
    } finally {
      setLoadingExport(false)
    }
  }

  const clearOptions = () => {
    setExportFiltered(false)
    setExportPaginated(false)
    setDropdownOpen(false)
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        style={{
          padding: '8px 16px',
          marginLeft: '10px',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px'
        }}
        disabled={loadingExport}
      >
        {loadingExport ? 'Exporting...' : '📥 Export Excel'}
        <span style={{ fontSize: '12px' }}>▼</span>
      </button>

      {dropdownOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: '0',
          marginTop: '4px',
          backgroundColor: 'white',
          border: '1px solid #ccc',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          minWidth: '200px',
          zIndex: 1000
        }}>
          <div style={{ padding: '8px' }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>
              <input
                type="checkbox"
                checked={exportFiltered}
                onChange={(e) => setExportFiltered(e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              Filtered Data Only
            </label>
            <label style={{ display: 'block', marginBottom: '8px' }}>
              <input
                type="checkbox"
                checked={exportPaginated}
                onChange={(e) => setExportPaginated(e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              Paginated Only (Current Page)
            </label>
          </div>

          <div style={{
            borderTop: '1px solid #eee',
            padding: '8px',
            display: 'flex',
            gap: '8px',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={clearOptions}
              style={{
                padding: '4px 12px',
                cursor: 'pointer',
                backgroundColor: '#f5f5f5',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            >
              Clear
            </button>
            <button
              onClick={handleExport}
              style={{
                padding: '4px 12px',
                cursor: 'pointer',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px'
              }}
            >
              Export
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DsrExcelExport