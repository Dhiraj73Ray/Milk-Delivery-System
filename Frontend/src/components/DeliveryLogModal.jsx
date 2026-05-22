import React, { useState, useEffect } from 'react'
import api from '../api'
import { useQuantityInput } from '../utils/useQuantityInput'

function DeliveryLogModal({ isOpen, onClose, log, onSave, mode, partners, customers, month }) {
    const [formData, setFormData] = useState({
        customer_id: '',
        delivery_date: '',
        delivery_time: '',
        delivery_status: 'done',
        quantity_delivered: ''
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [availableCustomers, setAvailableCustomers] = useState([])
    const [partnerId, setPartnerId] = useState(null)
    const quantityInput = useQuantityInput('', 0.1, '0.5');

    useEffect(() => {
        if (!isOpen) return
        // console.log(log)
        if (mode === 'edit' && log) {
            // Existing log - edit mode
            const pId = log.delivery_partner_id
            setPartnerId(pId)

            let formattedDate = log.delivery_date || ''
            if (!formattedDate && log.day) {
                const [year, monthNum] = month.split('-')
                formattedDate = `${year}-${monthNum}-${String(log.day).padStart(2, '0')}`
            }

            quantityInput.setValue(log.liters || '');

            let formattedTime = (log.delivery_time_raw && log.delivery_time_raw.length >= 5) ? log.delivery_time_raw : ''

            setFormData({
                customer_id: log.customer_id || '',
                delivery_date: formattedDate,
                delivery_time: formattedTime,
                delivery_status: log.delivery_status || 'done',
                quantity_delivered: quantityInput
            })

            if (pId) {
                api.get(`/customers/by-partner/${pId}`)
                    .then(res => setAvailableCustomers(res.data))
                    .catch(err => console.error('Failed to fetch customers', err))
            }
        }
        else if (mode === 'create_from_dsr' && log) {
            // Create from DSR (historical entry - preserve date and time from DSR)
            const pId = log.delivery_partner_id
            setPartnerId(pId)

            // Get the date from the DSR row (the actual delivery date)
            let formattedDate = ''
            if (log.delivery_date) {
                formattedDate = log.delivery_date
            } else if (log.day) {
                const [year, monthNum] = month.split('-')
                formattedDate = `${year}-${monthNum}-${String(log.day).padStart(2, '0')}`
            }

            // Get the time from DSR if available, otherwise leave empty for user to enter
            let formattedTime = ''
            if (log.delivery_time_raw) {
                formattedTime = log.delivery_time_raw
            } else if (log.delivery_time) {
                formattedTime = log.delivery_time.split('.')[0].substring(0, 5)
            }

            quantityInput.setValue(log.liters || '');


            setFormData({
                customer_id: log.customer_id || '',
                delivery_date: formattedDate,
                delivery_time: formattedTime,  // Use historical time, NOT current time
                delivery_status: log.delivery_status || 'done',
                // quantity_delivered: log.liters || ''
                quantity_delivered: quantityInput

            })

            if (pId) {
                api.get(`/customers/by-partner/${pId}`)
                    .then(res => setAvailableCustomers(res.data))
                    .catch(err => console.error('Failed to fetch customers', err))
            }
        }
        else if (mode === 'create' && !log) {
            // Blank create mode (from Add button - for current/future entries)
            const now = new Date()
            const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

            quantityInput.setValue('0.5');


            setPartnerId(null)
            setFormData({
                customer_id: '',
                delivery_date: new Date().toISOString().split('T')[0],
                delivery_time: currentTime,
                delivery_status: 'done',
                // quantity_delivered: ''
                quantity_delivered: quantityInput

            })
            setAvailableCustomers([])
        }
    }, [isOpen, mode, log, month])

    const handlePartnerChange = async (pId) => {
        setPartnerId(pId)
        setFormData(prev => ({ ...prev, customer_id: '' }))

        if (pId) {
            const res = await api.get(`/customers/by-partner/${pId}`)
            setAvailableCustomers(res.data)
        } else {
            setAvailableCustomers([])
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const finalQuantity = parseFloat(quantityInput.value);

        try {
            if (mode === 'edit' && log && log.log_id) {
                // For EDIT - send only fields that can be updated
                const updateData = {}

                if (formData.delivery_status !== log.delivery_status) {
                    updateData.delivery_status = formData.delivery_status
                }
                // if (parseFloat(formData.quantity_delivered) !== parseFloat(log.liters)) {
                //     updateData.quantity_delivered = parseFloat(formData.quantity_delivered)
                // }
                if (finalQuantity !== parseFloat(log.liters)) {
                    updateData.quantity_delivered = finalQuantity;
                }
                if (formData.delivery_time && formData.delivery_time !== (log.delivery_time_raw || '')) {
                    updateData.delivery_time = formData.delivery_time
                }
                if (formData.delivery_date && formData.delivery_date !== log.delivery_date) {
                    updateData.delivery_date = formData.delivery_date
                }

                // Only make the API call if there's something to update
                if (Object.keys(updateData).length > 0) {
                    await api.patch(`/logs/${log.log_id}`, updateData)
                }

            } else if (mode === 'create_from_dsr' || mode === 'create') {
                // For CREATE - send ONLY the fields the backend expects
                const submitData = {
                    delivery_partner_id: partnerId,
                    customer_id: parseInt(formData.customer_id),
                    delivery_status: formData.delivery_status,
                    // quantity_delivered: parseFloat(formData.quantity_delivered),
                    quantity_delivered: finalQuantity,
                    delivery_date: formData.delivery_date || null,
                    delivery_time: formData.delivery_time || null
                }

                // DO NOT send delivery_date and delivery_time for create, but send for create_from_dsr

                await api.post('/logs', submitData)
            }

            onSave()
            onClose()
        } catch (err) {
            let errorMessage = 'Operation failed'
            if (err.response?.data?.detail) {
                if (Array.isArray(err.response.data.detail)) {
                    errorMessage = err.response.data.detail.map(e => e.msg).join(', ')
                } else if (typeof err.response.data.detail === 'string') {
                    errorMessage = err.response.data.detail
                }
            }
            setError(errorMessage)
            console.error('Error details:', err.response?.data)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{
                backgroundColor: 'white', padding: '20px', borderRadius: '8px',
                maxWidth: '500px', width: '90%'
            }}>
                <h3>{mode === 'edit' ? 'Edit Delivery Log' : mode === 'create_from_dsr' ? 'Create Delivery Log' : 'Add Delivery Log'}</h3>

                <form onSubmit={handleSubmit}>
                    {(mode === 'create' || mode === 'create_from_dsr') && (
                        <div style={{ marginBottom: '10px' }}>
                            <label>Partner: </label>
                            <select
                                value={partnerId || ''}
                                onChange={(e) => handlePartnerChange(e.target.value)}
                                required
                                disabled={mode === 'create_from_dsr'} // Disable if coming from DSR
                                style={{ width: '100%', padding: '5px' }}
                            >
                                <option value="">Select Partner</option>
                                {partners.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div style={{ marginBottom: '10px' }}>
                        <label>Customer: </label>
                        <select
                            value={formData.customer_id}
                            onChange={(e) => setFormData(prev => ({ ...prev, customer_id: e.target.value }))}
                            required
                            disabled={mode === 'create' && !partnerId}
                            style={{ width: '100%', padding: '5px' }}
                        >
                            <option value="">Select Customer</option>
                            {availableCustomers.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    {(mode === 'create_from_dsr') && (
                        <>
                            <div style={{ marginBottom: '10px' }}>
                                <label>Date: </label>
                                <input
                                    type="date"
                                    value={formData.delivery_date}
                                    onChange={(e) => setFormData(prev => ({ ...prev, delivery_date: e.target.value }))}
                                    required={mode === 'create_from_dsr'} // Required for historical entries
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
                        </>
                    )}

                    {mode === 'edit' && (
                        <>
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
                        </>
                    )}

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

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
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

export default DeliveryLogModal