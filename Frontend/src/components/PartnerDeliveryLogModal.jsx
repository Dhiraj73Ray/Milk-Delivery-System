import React, { useState, useEffect } from 'react'
import api from '../api'
import { useQuantityInput } from '../utils/useQuantityInput'
import useIsMobile from '../hooks/useIsMobile'

function PartnerDeliveryLogModal({ isOpen, onClose, log, onSave, mode, partnerId }) {
    const [formData, setFormData] = useState({
        customer_id: '',
        delivery_date: '',
        delivery_time: '',
        delivery_status: 'done',
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [availableCustomers, setAvailableCustomers] = useState([])
    const quantityInput = useQuantityInput('', 0.1, 0.5)
    const isMobile = useIsMobile()

    // Fetch partner's customers when modal opens
    useEffect(() => {
        if (!isOpen) return

        if (partnerId) {
            api.get(`/customers/my/list`)
                .then(res => setAvailableCustomers(res.data))
                .catch(err => console.error('Failed to fetch customers', err))
        }
    }, [isOpen, partnerId])

    useEffect(() => {
        if (!isOpen) return

        if (mode === 'edit' && log) {
            quantityInput.setValue(log.quantity_delivered || '')

            let formattedDate = log.delivery_date || ''
            if (!formattedDate && log.date) {
                formattedDate = log.date
            }

            let formattedTime = ''
            if (log.delivery_time_raw) {
                formattedTime = log.delivery_time_raw.substring(0, 5)
            } else if (log.delivery_time) {
                formattedTime = log.delivery_time.substring(0, 5)
            }

            setFormData({
                customer_id: log.customer_id || '',
                delivery_date: formattedDate,
                delivery_time: formattedTime,
                delivery_status: log.delivery_status || 'done',
            })
        } else if (mode === 'create') {
            const now = new Date()
            const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

            quantityInput.setValue(1.0)
            setFormData({
                customer_id: '',
                delivery_date: new Date().toISOString().split('T')[0],
                delivery_time: currentTime,
                delivery_status: 'done',
            })
        }
    }, [isOpen, mode, log])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const finalQuantity = parseFloat(quantityInput.value)

        if (!formData.customer_id) {
            setError("Please select a customer")
            setLoading(false)
            return
        }

        if (formData.delivery_status === 'done' && finalQuantity <= 0) {
            setError("Quantity must be greater than 0 for completed deliveries")
            setLoading(false)
            return
        }

        try {
            if (mode === 'edit' && log && log.log_id) {
                const updateData = {}

                if (formData.delivery_status !== log.delivery_status) {
                    updateData.delivery_status = formData.delivery_status
                }
                if (finalQuantity !== parseFloat(log.quantity_delivered)) {
                    updateData.quantity_delivered = finalQuantity
                }
                if (formData.delivery_time && formData.delivery_time !== (log.delivery_time_raw || '').substring(0, 5)) {
                    updateData.delivery_time = formData.delivery_time
                }
                if (formData.delivery_date && formData.delivery_date !== log.delivery_date) {
                    updateData.delivery_date = formData.delivery_date
                }

                if (Object.keys(updateData).length > 0) {
                    await api.patch(`/logs/${log.log_id}`, updateData)
                }
            } else {
                const submitData = {
                    delivery_partner_id: parseInt(partnerId),
                    customer_id: parseInt(formData.customer_id),
                    delivery_status: formData.delivery_status,
                    quantity_delivered: finalQuantity,
                    delivery_date: formData.delivery_date || null,
                    delivery_time: formData.delivery_time || null
                }

                await api.post('/logs', submitData)
            }

            onSave()
            onClose()
        } catch (err) {
            let errorMessage = 'Operation failed'
            if (err.response?.data?.detail) {
                if (typeof err.response.data.detail === 'string') {
                    errorMessage = err.response.data.detail
                } else {
                    errorMessage = JSON.stringify(err.response.data.detail)
                }
            }
            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    const getModalTitle = () => {
        if (mode === 'edit') return 'Edit Delivery Log'
        return 'Add Delivery Log'
    }

    const getModalIcon = () => {
        if (mode === 'edit') return '✏️'
        return '➕'
    }

    // Mobile View
    if (isMobile) {
        return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-slideUp">
                    {/* Modal Header */}
                    <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-2xl p-5 text-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur text-xl">
                                    {getModalIcon()}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">{getModalTitle()}</h3>
                                    <p className="text-sm text-blue-100 mt-0.5">
                                        {mode === 'edit' ? 'Update delivery information' : 'Record new delivery'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
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
                                👤 Customer *
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <select
                                    value={formData.customer_id}
                                    onChange={(e) => setFormData(prev => ({ ...prev, customer_id: e.target.value }))}
                                    required
                                    disabled={mode === 'edit'}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed appearance-none"
                                >
                                    <option value="">Select Customer</option>
                                    {availableCustomers.map(c => (
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

                        {/* Date Field */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                📅 Delivery Date
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <input
                                    type="date"
                                    value={formData.delivery_date}
                                    onChange={(e) => setFormData(prev => ({ ...prev, delivery_date: e.target.value }))}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                                />
                            </div>
                        </div>

                        {/* Time Field */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                ⏰ Delivery Time
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="time"
                                    value={formData.delivery_time}
                                    onChange={(e) => setFormData(prev => ({ ...prev, delivery_time: e.target.value }))}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                                />
                            </div>
                        </div>

                        {/* Status Selection */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                ✅ Delivery Status
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, delivery_status: 'done' }))}
                                    className={`py-3 rounded-xl font-medium transition-all duration-200 active:scale-95 ${
                                        formData.delivery_status === 'done' 
                                            ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md' 
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    ✅ Done
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, delivery_status: 'pending' }))}
                                    className={`py-3 rounded-xl font-medium transition-all duration-200 active:scale-95 ${
                                        formData.delivery_status === 'pending' 
                                            ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-md' 
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    ⏳ Pending
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, delivery_status: 'cancelled' }))}
                                    className={`py-3 rounded-xl font-medium transition-all duration-200 active:scale-95 ${
                                        formData.delivery_status === 'cancelled' 
                                            ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md' 
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    ❌ Cancelled
                                </button>
                            </div>
                        </div>

                        {/* Quantity Selection */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                🥛 Quantity (Litres) *
                            </label>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => quantityInput.setValue(Math.max(0.1, parseFloat(quantityInput.value) - 0.5))}
                                    className="w-12 h-12 bg-gray-100 rounded-xl text-2xl font-bold text-gray-700 hover:bg-gray-200 active:scale-95 transition-all duration-200"
                                >
                                    −
                                </button>
                                <div className="relative flex-1">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                    </div>
                                    <input
                                        {...quantityInput.inputProps}
                                        type="number"
                                        step="0.1"
                                        className="w-full pl-10 pr-4 py-3 text-center text-lg font-semibold border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => quantityInput.setValue(parseFloat(quantityInput.value) + 0.5)}
                                    className="w-12 h-12 bg-gray-100 rounded-xl text-2xl font-bold text-gray-700 hover:bg-gray-200 active:scale-95 transition-all duration-200"
                                >
                                    +
                                </button>
                            </div>
                            {formData.delivery_status === 'done' && parseFloat(quantityInput.value) <= 0 && (
                                <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Quantity must be greater than 0 for completed deliveries
                                </p>
                            )}
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 animate-shake">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-sm">{error}</span>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-xl font-medium hover:bg-gray-200 active:scale-95 transition-all duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 active:scale-95 transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
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
                                    mode === 'edit' ? 'Update Delivery' : 'Create Delivery'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )
    }

    // Desktop View - Enhanced Layout
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-slideUp">
                {/* Modal Header */}
                <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-2xl p-5 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold">{mode === 'edit' ? 'Edit Delivery Log' : 'Add Delivery Log'}</h3>
                            <p className="text-sm text-blue-100 mt-0.5">
                                {mode === 'edit' ? 'Update delivery information' : 'Record a new delivery entry'}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 active:scale-95 transition-all duration-200"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Modal Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Customer Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Customer *
                        </label>
                        <select
                            value={formData.customer_id}
                            onChange={(e) => setFormData(prev => ({ ...prev, customer_id: e.target.value }))}
                            required
                            disabled={mode === 'edit'}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                            <option value="">Select Customer</option>
                            {availableCustomers.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Date and Time Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Delivery Date
                            </label>
                            <input
                                type="date"
                                value={formData.delivery_date}
                                onChange={(e) => setFormData(prev => ({ ...prev, delivery_date: e.target.value }))}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Delivery Time
                            </label>
                            <input
                                type="time"
                                value={formData.delivery_time}
                                onChange={(e) => setFormData(prev => ({ ...prev, delivery_time: e.target.value }))}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                            />
                        </div>
                    </div>

                    {/* Status Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Delivery Status
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, delivery_status: 'done' }))}
                                className={`py-2.5 rounded-xl font-medium transition-all duration-200 ${
                                    formData.delivery_status === 'done' 
                                        ? 'bg-green-600 text-white shadow-md' 
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Done ✓
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, delivery_status: 'pending' }))}
                                className={`py-2.5 rounded-xl font-medium transition-all duration-200 ${
                                    formData.delivery_status === 'pending' 
                                        ? 'bg-yellow-500 text-white shadow-md' 
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Pending ⏳
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, delivery_status: 'cancelled' }))}
                                className={`py-2.5 rounded-xl font-medium transition-all duration-200 ${
                                    formData.delivery_status === 'cancelled' 
                                        ? 'bg-red-600 text-white shadow-md' 
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Cancelled ✗
                            </button>
                        </div>
                    </div>

                    {/* Quantity Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Quantity (Litres) *
                        </label>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => quantityInput.setValue(Math.max(0.1, parseFloat(quantityInput.value) - 0.5))}
                                className="w-10 h-10 bg-gray-100 rounded-xl text-xl font-bold text-gray-700 hover:bg-gray-200 transition-all duration-200"
                            >
                                −
                            </button>
                            <input
                                {...quantityInput.inputProps}
                                className="flex-1 px-4 py-2.5 text-center text-lg font-semibold border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                            />
                            <button
                                type="button"
                                onClick={() => quantityInput.setValue(parseFloat(quantityInput.value) + 0.5)}
                                className="w-10 h-10 bg-gray-100 rounded-xl text-xl font-bold text-gray-700 hover:bg-gray-200 transition-all duration-200"
                            >
                                +
                            </button>
                        </div>
                        {formData.delivery_status === 'done' && parseFloat(quantityInput.value) <= 0 && (
                            <p className="text-red-600 text-xs mt-1.5">
                                Quantity must be greater than 0 for completed deliveries
                            </p>
                        )}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 rounded-xl font-medium hover:bg-gray-200 transition-all duration-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : (mode === 'edit' ? 'Update' : 'Create')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default PartnerDeliveryLogModal