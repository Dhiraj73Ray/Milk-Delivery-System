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
        <div className="relative inline-block" ref={dropdownRef}>
            {/* Main Export Button */}
            <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                disabled={loadingExport}
                className={`
                    inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm
                    transition-all duration-200 shadow-md
                    ${loadingExport 
                        ? 'bg-gray-400 cursor-not-allowed opacity-60' 
                        : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 text-white'
                    }
                `}
            >
                {loadingExport ? (
                    <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Exporting...</span>
                    </>
                ) : (
                    <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span>Export Bills</span>
                        <svg className={`w-3 h-3 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </>
                )}
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-slideDown">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-800 text-sm">Export Options</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Choose what data to export</p>
                    </div>

                    {/* Options */}
                    <div className="p-3 space-y-3">
                        <label className="flex items-start gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={exportFiltered}
                                onChange={(e) => {
                                    setExportFiltered(e.target.checked)
                                    if (e.target.checked) setExportAll(false)
                                }}
                                className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                            />
                            <div className="flex-1">
                                <span className="text-sm font-medium text-gray-700 group-hover:text-emerald-600 transition-colors">
                                    Filtered Data Only
                                </span>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Export data matching current filters
                                </p>
                            </div>
                        </label>

                        <label className="flex items-start gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={exportAll}
                                onChange={(e) => {
                                    setExportAll(e.target.checked)
                                    if (e.target.checked) setExportFiltered(false)
                                }}
                                className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                            />
                            <div className="flex-1">
                                <span className="text-sm font-medium text-gray-700 group-hover:text-emerald-600 transition-colors">
                                    All Data
                                </span>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Export complete {month} data
                                </p>
                            </div>
                        </label>
                    </div>

                    {/* Current Selection Info */}
                    {(exportFiltered || exportAll) && (
                        <div className="mx-3 mb-3 px-3 py-2 bg-blue-50 rounded-lg border border-blue-100">
                            <div className="flex items-center gap-2 text-xs text-blue-700">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>
                                    Exporting: {exportFiltered ? 'Filtered Data' : 'All Data'}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="border-t border-gray-100 p-3 flex gap-2">
                        <button
                            onClick={clearOptions}
                            className="flex-1 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 active:scale-95 transition-all duration-200"
                        >
                            Clear
                        </button>
                        <button
                            onClick={handleExport}
                            className="flex-1 px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl hover:from-emerald-600 hover:to-teal-700 active:scale-95 transition-all duration-200 shadow-sm"
                        >
                            Export Now
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default BillsExcelExport