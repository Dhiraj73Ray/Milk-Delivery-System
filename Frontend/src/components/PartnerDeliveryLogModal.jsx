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
            // For edit mode - pre-fill the form
            quantityInput.setValue(log.quantity_delivered || '')

            // Format date from YYYY-MM-DD
            let formattedDate = log.delivery_date || ''
            if (!formattedDate && log.date) {
                formattedDate = log.date
            }

            // Format time (remove seconds if present)
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
            // For create mode - set defaults
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
                // Update existing log
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
                // Create new log
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

    // Mobile view
    if (isMobile) {
        return (
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '16px'
            }}>
                <div style={{
                    backgroundColor: 'white', padding: '20px', borderRadius: '12px',
                    width: '100%', maxHeight: '90vh', overflowY: 'auto'
                }}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-gray-800">
                            {mode === 'edit' ? 'Edit Delivery Log' : 'Add Delivery Log'}
                        </h3>
                        <button onClick={onClose} className="text-2xl text-gray-500">✕</button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    👤 Customer
                                </label>
                                <select
                                    value={formData.customer_id}
                                    onChange={(e) => setFormData(prev => ({ ...prev, customer_id: e.target.value }))}
                                    required
                                    disabled={mode === 'edit'}
                                    className="w-full p-3 border border-gray-300 rounded-lg bg-white"
                                >
                                    <option value="">Select Customer</option>
                                    {availableCustomers.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    📅 Date
                                </label>
                                <input
                                    type="date"
                                    value={formData.delivery_date}
                                    onChange={(e) => setFormData(prev => ({ ...prev, delivery_date: e.target.value }))}
                                    className="w-full p-3 border border-gray-300 rounded-lg"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    ⏰ Time
                                </label>
                                <input
                                    type="time"
                                    value={formData.delivery_time}
                                    onChange={(e) => setFormData(prev => ({ ...prev, delivery_time: e.target.value }))}
                                    className="w-full p-3 border border-gray-300 rounded-lg"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    ✅ Status
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, delivery_status: 'done' }))}
                                        className={`py-3 rounded-lg font-medium ${formData.delivery_status === 'done' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                                    >
                                        Done ✓
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, delivery_status: 'pending' }))}
                                        className={`py-3 rounded-lg font-medium ${formData.delivery_status === 'pending' ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-700'}`}
                                    >
                                        Pending ⏳
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, delivery_status: 'cancelled' }))}
                                        className={`py-3 rounded-lg font-medium ${formData.delivery_status === 'cancelled' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                                    >
                                        Cancelled ✗
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    🥛 Quantity (Litres)
                                </label>
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => quantityInput.setValue(Math.max(0.1, parseFloat(quantityInput.value) - 0.5))}
                                        className="w-12 h-12 text-2xl bg-gray-100 rounded-lg font-bold"
                                    >
                                        −
                                    </button>
                                    <input
                                        {...quantityInput.inputProps}
                                        className="flex-1 p-3 text-center text-lg border border-gray-300 rounded-lg"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => quantityInput.setValue(parseFloat(quantityInput.value) + 0.5)}
                                        className="w-12 h-12 text-2xl bg-gray-100 rounded-lg font-bold"
                                    >
                                        +
                                    </button>
                                </div>
                                {formData.delivery_status === 'done' && parseFloat(quantityInput.value) <= 0 && (
                                    <p className="text-red-500 text-sm mt-2">
                                        Quantity must be greater than 0 for completed deliveries
                                    </p>
                                )}
                            </div>

                            {error && (
                                <div className="bg-red-50 text-red-700 p-3 rounded-lg text-center">
                                    {error}
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium"
                                >
                                    {loading ? 'Saving...' : (mode === 'edit' ? 'Update' : 'Create')}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        )
    }

    // Desktop view - Original layout
    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{
                backgroundColor: 'white', padding: '20px', borderRadius: '8px',
                maxWidth: '500px', width: '90%', maxHeight: '90vh', overflowY: 'auto'
            }}>
                <h3>{mode === 'edit' ? 'Edit Delivery Log' : 'Add Delivery Log'}</h3>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '10px' }}>
                        <label>Customer: </label>
                        <select
                            value={formData.customer_id}
                            onChange={(e) => setFormData(prev => ({ ...prev, customer_id: e.target.value }))}
                            required
                            disabled={mode === 'edit'}
                            style={{ width: '100%', padding: '5px' }}
                        >
                            <option value="">Select Customer</option>
                            {availableCustomers.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ marginBottom: '10px' }}>
                        <label>Date: </label>
                        <input
                            type="date"
                            value={formData.delivery_date}
                            onChange={(e) => setFormData(prev => ({ ...prev, delivery_date: e.target.value }))}
                            style={{ width: '100%', padding: '5px' }}
                        />
                    </div>

                    <div style={{ marginBottom: '10px' }}>
                        <label>Time: </label>
                        <input
                            type="time"
                            value={formData.delivery_time}
                            onChange={(e) => setFormData(prev => ({ ...prev, delivery_time: e.target.value }))}
                            style={{ width: '100%', padding: '5px' }}
                        />
                    </div>

                    <div style={{ marginBottom: '10px' }}>
                        <label>Status: </label>
                        <select
                            value={formData.delivery_status}
                            onChange={(e) => setFormData(prev => ({ ...prev, delivery_status: e.target.value }))}
                            style={{ width: '100%', padding: '5px' }}
                        >
                            <option value="done">Done</option>
                            <option value="pending">Pending</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

                    <div style={{ marginBottom: '10px' }}>
                        <label>Quantity (Litres): </label>
                        <input
                            {...quantityInput.inputProps}
                            style={{ width: '100%', padding: '5px' }}
                        />
                        {formData.delivery_status === 'done' && parseFloat(quantityInput.value) <= 0 && (
                            <p style={{ color: 'red', fontSize: '12px', margin: '5px 0 0 0' }}>
                                Quantity must be greater than 0 for completed deliveries
                            </p>
                        )}
                    </div>

                    {error && <p style={{ color: 'red' }}>{error}</p>}

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                        <button type="button" onClick={onClose}>Cancel</button>
                        <button type="submit" disabled={loading}>
                            {loading ? 'Saving...' : (mode === 'edit' ? 'Update' : 'Create')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default PartnerDeliveryLogModal