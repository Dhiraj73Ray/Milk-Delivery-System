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

        // Search filter (customer name)
        if (searchTerm) {
            filtered = filtered.filter(item =>
                item.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        // Customer dropdown filter
        if (selectedCustomer) {
            filtered = filtered.filter(item => item.customer_name === selectedCustomer)
        }

        // Partner filter - NOW WORKING
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
                // Reset filters when new data loads
                setSearchTerm('')
                setSelectedCustomer('')
                setSelectedPartner('')
                setLoading(false)
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

    return (
        <div>
            <h2>Bills Section</h2>

            <div>
                <label>Month: </label>
                <input
                    type="month"
                    value={month}
                    max={currentMonth}
                    onChange={(e) => setMonth(e.target.value)}
                />
                {monthError && <p style={{ color: 'red' }}>{monthError}</p>}
                <button onClick={fetchBills}>Fetch Bills</button>
                <BillsExcelExport
                    month={month}
                    filteredData={filteredData}
                    allData={data}
                />

            </div>

            {/* Filters Section */}
            {data.length > 0 && (
                <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
                    <h4>Filters</h4>

                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        {/* Search Bar */}
                        <div>
                            <label>Search Customer: </label>
                            <input
                                type="text"
                                placeholder="Type customer name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ padding: '5px', width: '200px' }}
                            />
                        </div>

                        {/* Customer Dropdown */}
                        <div>
                            <label>Customer: </label>
                            <select
                                value={selectedCustomer}
                                onChange={(e) => setSelectedCustomer(e.target.value)}
                                style={{ padding: '5px', minWidth: '150px' }}
                            >
                                <option value="">All Customers</option>
                                {getUniqueCustomers().map(customer => (
                                    <option key={customer} value={customer}>{customer}</option>
                                ))}
                            </select>
                        </div>

                        {/* Partner Dropdown - NOW ENABLED */}
                        <div>
                            <label>Partner: </label>
                            <select
                                value={selectedPartner}
                                onChange={(e) => setSelectedPartner(e.target.value)}
                                style={{ padding: '5px', minWidth: '150px' }}
                            >
                                <option value="">All Partners</option>
                                {getUniquePartners().map(partner => (
                                    <option key={partner} value={partner}>{partner}</option>
                                ))}
                            </select>
                        </div>

                        <button onClick={clearFilters}>Clear Filters</button>
                    </div>

                    <p style={{ marginTop: '10px' }}>Showing {filteredData.length} of {data.length} customers</p>
                </div>
            )}

            {loading && <p>Loading...</p>}
            {error && <p style={{ color: 'red' }}>Error: {error}</p>}

            {filteredData.length > 0 && (
                <div>
                    <div style={{ overflowX: 'auto', marginTop: '20px' }}>
                        <table border="1" style={{ borderCollapse: 'collapse', width: '100%' }}>
                            <thead>
                                <tr>
                                    <th>Customer Name</th>
                                    <th>Total Litres</th>
                                    <th>Rate/Litre</th>
                                    <th>Total Amount</th>
                                    <th>Previous Balance</th>
                                    <th>Grand Total</th>
                                    <th>Total Paid</th>
                                    <th>Balance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map((bill) => (
                                    <tr key={bill.customer_id} style={{
                                        backgroundColor: bill.balance > 0 ? '#ffcccc' : 'transparent'
                                    }}>
                                        <td>{bill.customer_name}</td>
                                        <td>{bill.total_litres}</td>
                                        <td>₹{bill.rate_per_litre}</td>
                                        <td>₹{bill.total_amount}</td>
                                        <td>₹{bill.previous_balance}</td>
                                        <td>₹{bill.grand_total}</td>
                                        <td>₹{bill.total_paid}</td>
                                        <td style={{
                                            fontWeight: 'bold',
                                            color: bill.balance > 0 ? 'red' : (bill.balance < 0 ? 'green' : 'black')
                                        }}>
                                            ₹{bill.balance}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}

export default BillsTable