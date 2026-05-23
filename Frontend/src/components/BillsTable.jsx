import React, { useState } from 'react'
import api from '../api'
import BillsExcelExport from './BillsExcelExport'

function BillsTable() {
    const today = new Date()
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

    const [month, setMonth] = useState(currentMonth)
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [monthError, setMonthError] = useState(null)

    // Filter states
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCustomer, setSelectedCustomer] = useState('')
    const [selectedPartner, setSelectedPartner] = useState('')
    const [showFilters, setShowFilters] = useState(false)

    // Get unique customers and partners for dropdowns
    const getUniqueCustomers = () => {
        const customers = [...new Set(data.map(item => item.customer_name))]
        return customers.sort()
    }

    const getUniquePartners = () => {
        const partners = [...new Set(data.map(item => item.partner_name))]
        return partners.sort()
    }

    // Filtered data
    const getFilteredData = () => {
        let filtered = [...data]

        if (searchTerm) {
            filtered = filtered.filter(item =>
                item.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        if (selectedCustomer) {
            filtered = filtered.filter(item => item.customer_name === selectedCustomer)
        }

        if (selectedPartner) {
            filtered = filtered.filter(item => item.partner_name === selectedPartner)
        }

        return filtered
    }

    const filteredData = getFilteredData()

    const fetchBills = () => {
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
        api.get(`/bills/month/${monthToFetch}`)
            .then(response => {
                setData(response.data)
                setSearchTerm('')
                setSelectedCustomer('')
                setSelectedPartner('')
                setLoading(false)
                setShowFilters(false)
            })
            .catch(err => {
                setError(err.response?.data?.detail || "Failed to fetch bills data")
                setLoading(false)
            })
    }

    const clearFilters = () => {
        setSearchTerm('')
        setSelectedCustomer('')
        setSelectedPartner('')
    }

    // Calculate totals
    const totalLitres = filteredData.reduce((sum, item) => sum + (parseFloat(item.total_litres) || 0), 0)
    const totalAmount = filteredData.reduce((sum, item) => sum + (parseFloat(item.total_amount) || 0), 0)
    const totalPaid = filteredData.reduce((sum, item) => sum + (parseFloat(item.total_paid) || 0), 0)
    const totalBalance = filteredData.reduce((sum, item) => sum + (parseFloat(item.balance) || 0), 0)

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Bills Section</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Manage and view customer bills</p>
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                </div>

                {/* Month Selection */}
                <div className="space-y-3">
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
                                onClick={fetchBills}
                                disabled={loading}
                                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700 active:scale-95 transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
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
                                    'Fetch Bills'
                                )}
                            </button>
                            <BillsExcelExport
                                month={month}
                                filteredData={filteredData}
                                allData={data}
                            />
                        </div>
                    </div>
                    {monthError && (
                        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-2 rounded-xl text-sm flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span>{monthError}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Filters Section - Collapsible on Mobile */}
            {data.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white"
                    >
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                            <span className="font-semibold text-gray-800">Filters</span>
                            { (searchTerm || selectedCustomer || selectedPartner) && (
                                <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full">Active</span>
                            )}
                        </div>
                        <svg className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {showFilters && (
                        <div className="p-4 border-t border-gray-100 space-y-3 animate-slideDown">
                            {/* Search Bar */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Search Customer
                                </label>
                                <input
                                    type="text"
                                    placeholder="Type customer name..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200"
                                />
                            </div>

                            {/* Customer Dropdown */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Customer
                                </label>
                                <select
                                    value={selectedCustomer}
                                    onChange={(e) => setSelectedCustomer(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200 bg-white"
                                >
                                    <option value="">All Customers</option>
                                    {getUniqueCustomers().map(customer => (
                                        <option key={customer} value={customer}>{customer}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Partner Dropdown */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Partner
                                </label>
                                <select
                                    value={selectedPartner}
                                    onChange={(e) => setSelectedPartner(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200 bg-white"
                                >
                                    <option value="">All Partners</option>
                                    {getUniquePartners().map(partner => (
                                        <option key={partner} value={partner}>{partner}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={clearFilters}
                                    className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 rounded-xl font-medium hover:bg-gray-200 active:scale-95 transition-all duration-200"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Results Summary */}
            {data.length > 0 && (
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-4 border border-purple-100">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                            <p className="text-xs text-gray-500">Showing</p>
                            <p className="text-lg font-bold text-gray-800">{filteredData.length} <span className="text-sm font-normal text-gray-500">of {data.length}</span></p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Total Litres</p>
                            <p className="text-lg font-bold text-gray-800">{totalLitres.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Total Amount</p>
                            <p className="text-lg font-bold text-gray-800">₹{totalAmount.toLocaleString('en-IN')}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Balance</p>
                            <p className={`text-lg font-bold ${totalBalance > 0 ? 'text-red-600' : totalBalance < 0 ? 'text-green-600' : 'text-gray-800'}`}>
                                ₹{totalBalance.toLocaleString('en-IN')}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="bg-white rounded-2xl p-8 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-200 border-t-purple-600"></div>
                    <p className="mt-3 text-gray-500">Loading bills data...</p>
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

            {/* Bills Table - Horizontal Scroll on Mobile */}
            {filteredData.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Litres</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Rate/L</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Total</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Prev Bal</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Grand Total</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Paid</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Balance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredData.map((bill) => (
                                    <tr key={bill.customer_id} className="hover:bg-gray-50 transition-colors duration-150">
                                        <td className="px-4 py-3 text-sm font-medium text-gray-800 whitespace-nowrap">
                                            {bill.customer_name}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 text-right whitespace-nowrap">
                                            {parseFloat(bill.total_litres).toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 text-right whitespace-nowrap">
                                            ₹{parseFloat(bill.rate_per_litre).toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 text-right whitespace-nowrap">
                                            ₹{parseFloat(bill.total_amount).toLocaleString('en-IN')}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 text-right whitespace-nowrap">
                                            ₹{parseFloat(bill.previous_balance).toLocaleString('en-IN')}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 text-right whitespace-nowrap">
                                            ₹{parseFloat(bill.grand_total).toLocaleString('en-IN')}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 text-right whitespace-nowrap">
                                            ₹{parseFloat(bill.total_paid).toLocaleString('en-IN')}
                                        </td>
                                        <td className={`px-4 py-3 text-sm font-semibold text-right whitespace-nowrap ${
                                            parseFloat(bill.balance) > 0 ? 'text-red-600' : 
                                            parseFloat(bill.balance) < 0 ? 'text-green-600' : 'text-gray-800'
                                        }`}>
                                            ₹{parseFloat(bill.balance).toLocaleString('en-IN')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!loading && data.length === 0 && !error && (
                <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                    <svg className="w-16 h-16 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-500">No bills data available. Select a month and click "Fetch Bills".</p>
                </div>
            )}
        </div>
    )
}

export default BillsTable