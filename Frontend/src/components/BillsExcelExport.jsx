import React, { useState, useRef, useEffect } from 'react'

function BillsExcelExport({ month, filteredData, allData }) {
    const [loadingExport, setLoadingExport] = useState(false)
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const dropdownRef = useRef(null)

    // Export options state
    const [exportFiltered, setExportFiltered] = useState(false)
    const [exportAll, setExportAll] = useState(false)

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
        if (exportFiltered) {
            return [...filteredData]
        }
        if (exportAll) {
            return [...allData]
        }
        return [...filteredData] // default to filtered
    }

    const convertToCSV = (data) => {
        if (data.length === 0) return null

        // Define columns in desired order
        const columns = [
            'customer_name',
            'partner_name',
            'total_litres',
            'rate_per_litre',
            'total_amount',
            'previous_balance',
            'grand_total',
            'total_paid',
            'balance'
        ]

        const headers = ['Customer Name', 'Partner', 'Litres', 'Rate/Litre', 'Total Amount', 'Previous Balance', 'Grand Total', 'Total Paid', 'Balance']

        const csvRows = []
        csvRows.push(headers.join(','))

        for (const row of data) {
            const values = columns.map(col => {
                let value = row[col] || ''
                if (typeof value === 'number' || !isNaN(parseFloat(value))) {
                    value = parseFloat(value).toFixed(2)
                }
                return `"${String(value).replace(/"/g, '""')}"`
            })
            csvRows.push(values.join(','))
        }
        // Add UTF-8 BOM (Byte Order Mark) to fix special characters
        const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
        return new Blob([csvRows.join('\n')], { type: 'text/csv' })
    }

    const handleExport = async () => {
        const dataToExport = getDataToExport()

        if (dataToExport.length === 0) {
            alert('No data to export. Check your options.')
            return
        }

        setLoadingExport(true)
        setDropdownOpen(false)

        try {
            const blob = convertToCSV(dataToExport)
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            const now = new Date()
            const dateStr = now.toISOString().slice(0, 19).replace(/:/g, '-')
            const optionText = exportFiltered ? 'filtered' : (exportAll ? 'all' : 'default')
            link.download = `Bills_${month}_${optionText}_${dateStr}.csv`
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
        setExportAll(false)
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
                {loadingExport ? 'Exporting...' : '📥 Export Bills Excel'}
                <span style={{ fontSize: '12px' }}>▼</span>
            </button>

            {dropdownOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: '4px',
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    minWidth: '220px',
                    zIndex: 1000
                }}>
                    <div style={{ padding: '8px' }}>
                        <label style={{ display: 'block', marginBottom: '8px' }}>
                            <input
                                type="checkbox"
                                checked={exportFiltered}
                                onChange={(e) => {
                                    setExportFiltered(e.target.checked)
                                    if (e.target.checked) setExportAll(false)
                                }}
                                style={{ marginRight: '8px' }}
                            />
                            Filtered Data Only (current filters)
                        </label>
                        <label style={{ display: 'block', marginBottom: '8px' }}>
                            <input
                                type="checkbox"
                                checked={exportAll}
                                onChange={(e) => {
                                    setExportAll(e.target.checked)
                                    if (e.target.checked) setExportFiltered(false)
                                }}
                                style={{ marginRight: '8px' }}
                            />
                            All Data (full month)
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

export default BillsExcelExport