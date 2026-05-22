import React, { useState, useEffect } from 'react'
import api from '../api'

function PaymentsTable() {
    const [payments, setPayments] = useState([])
    const [customers, setCustomers] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    
    // Form state for add/edit
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [formData, setFormData] = useState({
        customer_id: '',
        amount: '',
        payment_mode: 'cash',
        for_month: '',
        payment_date: new Date().toISOString().split('T')[0]
    })
    
    // Filters
    const [filterCustomer, setFilterCustomer] = useState('')
    const [filterMonth, setFilterMonth] = useState('')
    const [filterMode, setFilterMode] = useState('')
    
    // Fetch customers for dropdown
    useEffect(() => {
        api.get('/customers')
            .then(res => setCustomers(res.data))
            .catch(err => console.error('Failed to fetch customers', err))
    }, [])
    
    // Fetch payments
    const fetchPayments = () => {
        setLoading(true)
        api.get('/payments')
            .then(res => {
                setPayments(res.data)
                setLoading(false)
            })
            .catch(err => {
                setError(err.response?.data?.detail || 'Failed to fetch payments')
                setLoading(false)
            })
    }
    
    useEffect(() => {
        fetchPayments()
    }, [])
    
    // Get customer name by ID
    const getCustomerName = (customerId) => {
        const customer = customers.find(c => c.id === customerId)
        return customer ? customer.name : `Customer ${customerId}`
    }
    
    // Filter payments
    const filteredPayments = payments.filter(payment => {
        if (filterCustomer && payment.customer_id !== parseInt(filterCustomer)) return false
        if (filterMonth && payment.for_month !== filterMonth) return false
        if (filterMode && payment.payment_mode !== filterMode) return false
        return true
    })
    
    // Handle form submit (Create/Update)
    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        
        try {
            if (editingId) {
                // Update
                await api.patch(`/payments/${editingId}`, formData)
            } else {
                // Create
                await api.post('/payments', formData)
            }
            // Reset form and refresh
            resetForm()
            fetchPayments()
        } catch (err) {
            setError(err.response?.data?.detail || 'Operation failed')
        } finally {
            setLoading(false)
        }
    }
    
    // Handle delete
    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this payment?')) return
        
        setLoading(true)
        try {
            await api.delete(`/payments/${id}`)
            fetchPayments()
        } catch (err) {
            setError(err.response?.data?.detail || 'Delete failed')
        } finally {
            setLoading(false)
        }
    }
    
    // Handle edit
    const handleEdit = (payment) => {
        setEditingId(payment.id)
        setFormData({
            customer_id: payment.customer_id,
            amount: payment.amount,
            payment_mode: payment.payment_mode,
            for_month: payment.for_month,
            payment_date: payment.payment_date.split('T')[0]
        })
        setShowForm(true)
    }
    
    // Reset form
    const resetForm = () => {
        setShowForm(false)
        setEditingId(null)
        setFormData({
            customer_id: '',
            amount: '',
            payment_mode: 'cash',
            for_month: '',
            payment_date: new Date().toISOString().split('T')[0]
        })
    }
    
    // Unique values for filters
    const uniqueMonths = [...new Set(payments.map(p => p.for_month))].sort().reverse()
    const uniqueModes = [...new Set(payments.map(p => p.payment_mode))]
    
    return (
        <div>
            <h2>Payments Section</h2>
            
            {/* Add Payment Button */}
            <button onClick={() => setShowForm(true)}>+ Add Payment</button>
            
            {/* Filters */}
            <div style={{ marginTop: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <select value={filterCustomer} onChange={(e) => setFilterCustomer(e.target.value)}>
                    <option value="">All Customers</option>
                    {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
                
                <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
                    <option value="">All Months</option>
                    {uniqueMonths.map(m => (
                        <option key={m} value={m}>{m}</option>
                    ))}
                </select>
                
                <select value={filterMode} onChange={(e) => setFilterMode(e.target.value)}>
                    <option value="">All Modes</option>
                    {uniqueModes.map(m => (
                        <option key={m} value={m}>{m}</option>
                    ))}
                </select>
                
                <button onClick={() => {
                    setFilterCustomer('')
                    setFilterMonth('')
                    setFilterMode('')
                }}>Clear Filters</button>
            </div>
            
            {/* Add/Edit Form Modal */}
            {showForm && (
                <div style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: 'white',
                    padding: '20px',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    zIndex: 1000,
                    minWidth: '300px'
                }}>
                    <h3>{editingId ? 'Edit Payment' : 'Add Payment'}</h3>
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '10px' }}>
                            <label>Customer: </label>
                            <select
                                value={formData.customer_id}
                                onChange={(e) => setFormData({...formData, customer_id: e.target.value})}
                                required
                                style={{ width: '100%', padding: '5px' }}
                            >
                                <option value="">Select Customer</option>
                                {customers.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div style={{ marginBottom: '10px' }}>
                            <label>Amount: </label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.amount}
                                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                required
                                style={{ width: '100%', padding: '5px' }}
                            />
                        </div>
                        
                        <div style={{ marginBottom: '10px' }}>
                            <label>Payment Mode: </label>
                            <select
                                value={formData.payment_mode}
                                onChange={(e) => setFormData({...formData, payment_mode: e.target.value})}
                                style={{ width: '100%', padding: '5px' }}
                            >
                                <option value="cash">Cash</option>
                                <option value="bank">Bank Transfer</option>
                                <option value="upi">UPI</option>
                                <option value="cheque">Cheque</option>
                            </select>
                        </div>
                        
                        <div style={{ marginBottom: '10px' }}>
                            <label>For Month: </label>
                            <input
                                type="month"
                                value={formData.for_month}
                                onChange={(e) => setFormData({...formData, for_month: e.target.value})}
                                required
                                style={{ width: '100%', padding: '5px' }}
                            />
                        </div>
                        
                        <div style={{ marginBottom: '10px' }}>
                            <label>Payment Date: </label>
                            <input
                                type="date"
                                value={formData.payment_date}
                                onChange={(e) => setFormData({...formData, payment_date: e.target.value})}
                                required
                                style={{ width: '100%', padding: '5px' }}
                            />
                        </div>
                        
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={resetForm}>Cancel</button>
                            <button type="submit" disabled={loading}>
                                {loading ? 'Saving...' : (editingId ? 'Update' : 'Create')}
                            </button>
                        </div>
                    </form>
                </div>
            )}
            
            {/* Overlay for modal */}
            {showForm && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        zIndex: 999
                    }}
                    onClick={resetForm}
                />
            )}
            
            {loading && <p>Loading...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            
            {/* Payments Table */}
            {!loading && (
                <div style={{ overflowX: 'auto', marginTop: '20px' }}>
                    <p>Total Payments: {filteredPayments.length}</p>
                    <table border="1" style={{ borderCollapse: 'collapse', width: '100%' }}>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Customer</th>
                                <th>Amount</th>
                                <th>Mode</th>
                                <th>For Month</th>
                                <th>Payment Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPayments.map(payment => (
                                <tr key={payment.id}>
                                    <td>{payment.id}</td>
                                    <td>{getCustomerName(payment.customer_id)}</td>
                                    <td>₹{payment.amount}</td>
                                    <td>{payment.payment_mode}</td>
                                    <td>{payment.for_month}</td>
                                    <td>{payment.payment_date}</td>
                                    <td>
                                        <button onClick={() => handleEdit(payment)} style={{ marginRight: '5px' }}>Edit</button>
                                        <button onClick={() => handleDelete(payment.id)} style={{ color: 'red' }}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

export default PaymentsTable