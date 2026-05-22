import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import { useQuantityInput } from '../utils/useQuantityInput'
import useIsMobile from '../hooks/useIsMobile'

function LogDeliveryForm() {
  const { partnerID } = useAuth()
  const [customers, setCustomers] = useState([])
  const [customerID, setCustomerID] = useState("")
  const [status, setStatus] = useState("done")
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0])
  const [deliveryTime, setDeliveryTime] = useState(() => {
    const now = new Date()
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)
  const [submitError, setSubmitError] = useState(null)
  
  const quantityInput = useQuantityInput(1.0, 0.1, 0.5)
  const isMobile = useIsMobile()

  useEffect(() => {
    api.get("/customers/my/list")
      .then(res => {
        setCustomers(res.data)
        setLoading(false)
      })
      .catch(err => {
        setError("Failed to load Customers")
        setLoading(false)
      })
  }, [])

  if (loading) return <p>Loading customers...</p>
  if (error) return <p>{error}</p>

  async function handleSubmit() {
    setSuccessMsg(null)
    setSubmitError(null)

    if (!customerID) {
      setSubmitError("Please select a customer")
      return
    }

    const finalQuantity = parseFloat(quantityInput.value)
    if (status === 'done' && finalQuantity <= 0) {
      setSubmitError("Quantity must be greater than 0 for completed deliveries")
      return
    }

    try {
      await api.post("/logs", {
        delivery_partner_id: parseInt(partnerID),
        customer_id: parseInt(customerID),
        delivery_status: status,
        quantity_delivered: finalQuantity,
        delivery_date: deliveryDate,
        delivery_time: deliveryTime
      })
      
      setSuccessMsg("Delivery logged successfully!")
      setCustomerID("")
      setStatus("done")
      quantityInput.setValue(1.0)
      setDeliveryDate(new Date().toISOString().split('T')[0])
      const now = new Date()
      setDeliveryTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`)
      
    } catch (err) {
      if (err.response && err.response.data.detail) {
        setSubmitError(err.response.data.detail)
      } else {
        setSubmitError("Failed to log delivery")
      }
    }
  }

  // Mobile View
  if (isMobile) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span>📝</span> Log Delivery
        </h2>

        {successMsg && (
          <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4 text-center">
            {successMsg}
          </div>
        )}
        
        {submitError && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-center">
            {submitError}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">👤 Customer</label>
            <select 
              value={customerID} 
              onChange={(e) => setCustomerID(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg"
            >
              <option value="">-- Select Customer --</option>
              {customers.map(cust => (
                <option key={cust.id} value={cust.id}>{cust.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">📅 Date</label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">⏰ Time</label>
              <input
                type="time"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">✅ Status</label>
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => setStatus("done")}
                className={`py-3 rounded-lg font-medium ${status === "done" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700"}`}
              >
                Done ✓
              </button>
              <button 
                onClick={() => setStatus("pending")}
                className={`py-3 rounded-lg font-medium ${status === "pending" ? "bg-yellow-500 text-white" : "bg-gray-100 text-gray-700"}`}
              >
                Pending ⏳
              </button>
              <button 
                onClick={() => setStatus("cancelled")}
                className={`py-3 rounded-lg font-medium ${status === "cancelled" ? "bg-red-600 text-white" : "bg-gray-100 text-gray-700"}`}
              >
                Cancelled ✗
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">🥛 Quantity (Litres)</label>
            <div className="flex items-center gap-3">
              <button 
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
                onClick={() => quantityInput.setValue(parseFloat(quantityInput.value) + 0.5)}
                className="w-12 h-12 text-2xl bg-gray-100 rounded-lg font-bold"
              >
                +
              </button>
            </div>
          </div>

          <button 
            onClick={handleSubmit}
            className="w-full bg-green-600 text-white py-4 rounded-lg font-semibold text-lg mt-4"
          >
            💾 Save Delivery
          </button>
        </div>
      </div>
    )
  }

  // Desktop View - Original layout
  return (
    <div>
      <h2>Log Delivery</h2>

      <div style={{ marginBottom: '10px' }}>
        <label>Customer:</label>
        <select 
          value={customerID} 
          onChange={(e) => setCustomerID(e.target.value)}
          style={{ width: '100%', padding: '5px' }}
        >
          <option value="">-- Select Customer --</option>
          {customers.map(cust => (
            <option key={cust.id} value={cust.id}>{cust.name}</option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label>Date:</label>
        <input
          type="date"
          value={deliveryDate}
          onChange={(e) => setDeliveryDate(e.target.value)}
          style={{ width: '100%', padding: '5px' }}
        />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label>Time:</label>
        <input
          type="time"
          value={deliveryTime}
          onChange={(e) => setDeliveryTime(e.target.value)}
          style={{ width: '100%', padding: '5px' }}
        />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label>Status:</label>
        <select 
          value={status} 
          onChange={(e) => setStatus(e.target.value)}
          style={{ width: '100%', padding: '5px' }}
        >
          <option value="done">Done</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label>Quantity (Litres):</label>
        <input
          {...quantityInput.inputProps}
          style={{ width: '100%', padding: '5px' }}
        />
        {status === 'done' && parseFloat(quantityInput.value) <= 0 && (
          <p style={{ color: 'red', fontSize: '12px', margin: '5px 0 0 0' }}>
            Quantity must be greater than 0 for completed deliveries
          </p>
        )}
      </div>

      <button onClick={handleSubmit}>Submit</button>

      {successMsg && <p style={{ color: 'green' }}>{successMsg}</p>}
      {submitError && <p style={{ color: 'red' }}>{submitError}</p>}
    </div>
  )
}

export default LogDeliveryForm