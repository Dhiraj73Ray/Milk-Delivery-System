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
    const [showFilters, setShowFilters] = useState(false)
    
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
    
    // Calculate summary stats
    const totalAmount = filteredPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
    const cashAmount = filteredPayments.filter(p => p.payment_mode === 'cash').reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
    const bankAmount = filteredPayments.filter(p => p.payment_mode === 'bank').reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
    const upiAmount = filteredPayments.filter(p => p.payment_mode === 'upi').reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
    
    // Handle form submit (Create/Update)
    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        
        try {
            if (editingId) {
                await api.patch(`/payments/${editingId}`, formData)
            } else {
                await api.post('/payments', formData)
            }
            resetForm()
            fetchPayments()
            setError(null)
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
    
    // Get payment mode color
    const getModeColor = (mode) => {
        switch(mode) {
            case 'cash': return 'bg-green-100 text-green-700'
            case 'bank': return 'bg-blue-100 text-blue-700'
            case 'upi': return 'bg-purple-100 text-purple-700'
            case 'cheque': return 'bg-orange-100 text-orange-700'
            default: return 'bg-gray-100 text-gray-700'
        }
    }
    
    // Get payment mode icon
    const getModeIcon = (mode) => {
        switch(mode) {
            case 'cash': return '💰'
            case 'bank': return '🏦'
            case 'upi': return '📱'
            case 'cheque': return '📝'
            default: return '💳'
        }
    }
    
    // Loading State
    if (loading && payments.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-teal-200 border-t-teal-600"></div>
                <p className="mt-3 text-gray-500">Loading payments...</p>
            </div>
        )
    }
    
    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl p-5 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Payments</h2>
                            <p className="text-sm text-teal-100 mt-0.5">Manage customer payments</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowForm(true)}
                        className="px-4 py-2 bg-white/20 rounded-xl font-medium text-sm hover:bg-white/30 active:scale-95 transition-all duration-200 backdrop-blur flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Payment
                    </button>
                </div>
            </div>
            
            {/* Summary Cards */}
            {payments.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                        <p className="text-xs text-gray-500 mb-1">Total Amount</p>
                        <p className="text-2xl font-bold text-teal-600">₹{totalAmount.toLocaleString('en-IN')}</p>
                        <p className="text-xs text-gray-400 mt-1">{filteredPayments.length} transactions</p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                        <p className="text-xs text-gray-500 mb-1">Payment Modes</p>
                        <div className="space-y-1">
                            {cashAmount > 0 && <p className="text-xs">💰 Cash: ₹{cashAmount.toLocaleString('en-IN')}</p>}
                            {bankAmount > 0 && <p className="text-xs">🏦 Bank: ₹{bankAmount.toLocaleString('en-IN')}</p>}
                            {upiAmount > 0 && <p className="text-xs">📱 UPI: ₹{upiAmount.toLocaleString('en-IN')}</p>}
                        </div>
                    </div>
                </div>
            )}
            
            {/* Filters Section */}
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
                        {(filterCustomer || filterMonth || filterMode) && (
                            <span className="bg-teal-100 text-teal-700 text-xs px-2 py-0.5 rounded-full">Active</span>
                        )}
                    </div>
                    <svg className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                
                {showFilters && (
                    <div className="p-4 border-t border-gray-100 space-y-3 animate-slideDown">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                            <select 
                                value={filterCustomer} 
                                onChange={(e) => setFilterCustomer(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200 bg-white"
                            >
                                <option value="">All Customers</option>
                                {customers.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                            <select 
                                value={filterMonth} 
                                onChange={(e) => setFilterMonth(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200 bg-white"
                            >
                                <option value="">All Months</option>
                                {uniqueMonths.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
                            <select 
                                value={filterMode} 
                                onChange={(e) => setFilterMode(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200 bg-white"
                            >
                                <option value="">All Modes</option>
                                {uniqueModes.map(m => (
                                    <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                                ))}
                            </select>
                        </div>
                        
                        <button 
                            onClick={() => {
                                setFilterCustomer('')
                                setFilterMonth('')
                                setFilterMode('')
                            }}
                            className="w-full px-4 py-2.5 text-gray-600 bg-gray-100 rounded-xl font-medium hover:bg-gray-200 active:scale-95 transition-all duration-200"
                        >
                            Clear Filters
                        </button>
                    </div>
                )}
            </div>
            
            {/* Error State */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                </div>
            )}
            
            {/* Payments Table */}
            {!loading && payments.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Mode</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Month</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredPayments.map(payment => (
                                    <tr key={payment.id} className="hover:bg-gray-50 transition-colors duration-150">
                                        <td className="px-4 py-3 text-sm font-medium text-gray-800">
                                            {getCustomerName(payment.customer_id)}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-semibold text-right text-gray-800">
                                            ₹{parseFloat(payment.amount).toLocaleString('en-IN')}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getModeColor(payment.payment_mode)}`}>
                                                <span>{getModeIcon(payment.payment_mode)}</span>
                                                <span>{payment.payment_mode}</span>
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 text-center font-mono">
                                            {payment.for_month}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500 text-center">
                                            {new Date(payment.payment_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleEdit(payment)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                                                    title="Edit"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(payment.id)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                                    title="Delete"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Summary Footer */}
                    {filteredPayments.length > 0 && (
                        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Total Payments:</span>
                                <span className="text-sm font-semibold text-gray-800">
                                    {filteredPayments.length} transactions
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}
            
            {/* Empty State */}
            {!loading && payments.length === 0 && !error && (
                <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                    <svg className="w-16 h-16 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-gray-500">No payment records found</p>
                    <p className="text-sm text-gray-400 mt-1">Click "Add Payment" to get started</p>
                </div>
            )}
            
            {/* Modal Overlay */}
            {showForm && (
                <>
                    <div 
                        className="fixed inset-0 bg-black/50 z-40"
                        onClick={resetForm}
                    />
                    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="bg-white rounded-2xl shadow-2xl animate-slideUp">
                            {/* Modal Header */}
                            <div className="sticky top-0 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-t-2xl p-5 text-white">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold">
                                            {editingId ? 'Edit Payment' : 'Add Payment'}
                                        </h3>
                                        <p className="text-sm text-teal-100 mt-0.5">
                                            {editingId ? 'Update payment information' : 'Record a new payment'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={resetForm}
                                        className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 active:scale-95 transition-all duration-200"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            
                            {/* Modal Body */}
                            <form onSubmit={handleSubmit} className="p-5 space-y-4">
                                {/* Customer Selection */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Customer *
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        <select
                                            value={formData.customer_id}
                                            onChange={(e) => setFormData({...formData, customer_id: e.target.value})}
                                            required
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200 bg-white appearance-none"
                                        >
                                            <option value="">Select Customer</option>
                                            {customers.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Amount Field */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Amount (₹) *
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-gray-400 font-semibold">₹</span>
                                        </div>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                            required
                                            className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                
                                {/* Payment Mode */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Payment Mode *
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['cash', 'bank', 'upi', 'cheque'].map(mode => (
                                            <button
                                                key={mode}
                                                type="button"
                                                onClick={() => setFormData({...formData, payment_mode: mode})}
                                                className={`py-2.5 rounded-xl font-medium transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 ${
                                                    formData.payment_mode === mode 
                                                        ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md' 
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                            >
                                                <span>{getModeIcon(mode)}</span>
                                                <span>{mode.charAt(0).toUpperCase() + mode.slice(1)}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                {/* For Month */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        For Month *
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <input
                                            type="month"
                                            value={formData.for_month}
                                            onChange={(e) => setFormData({...formData, for_month: e.target.value})}
                                            required
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200"
                                        />
                                    </div>
                                </div>
                                
                                {/* Payment Date */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Payment Date *
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <input
                                            type="date"
                                            value={formData.payment_date}
                                            onChange={(e) => setFormData({...formData, payment_date: e.target.value})}
                                            required
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200"
                                        />
                                    </div>
                                </div>
                                
                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-xl font-medium hover:bg-gray-200 active:scale-95 transition-all duration-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 px-4 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl font-medium hover:from-teal-700 hover:to-cyan-700 active:scale-95 transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                <span>Saving...</span>
                                            </div>
                                        ) : (
                                            editingId ? 'Update Payment' : 'Create Payment'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

export default PaymentsTable