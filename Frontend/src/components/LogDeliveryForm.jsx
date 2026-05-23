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
      
      // Reset form
      setCustomerID("")
      setStatus("done")
      quantityInput.setValue(1.0)
      setDeliveryDate(new Date().toISOString().split('T')[0])
      const now = new Date()
      setDeliveryTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`)
      
      // Auto-clear success message after 3 seconds
      setTimeout(() => setSuccessMsg(null), 3000)
      
    } catch (err) {
      if (err.response && err.response.data.detail) {
        setSubmitError(err.response.data.detail)
      } else {
        setSubmitError("Failed to log delivery")
      }
      setTimeout(() => setSubmitError(null), 5000)
    }
  }

  // Loading State
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-green-200 border-t-green-600"></div>
        <p className="mt-3 text-gray-500">Loading customers...</p>
      </div>
    )
  }

  // Error State
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{error}</span>
      </div>
    )
  }

  // Main Form
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-5 text-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold">Log Delivery</h2>
            <p className="text-sm text-green-100 mt-0.5">Record daily milk delivery</p>
          </div>
        </div>
      </div>

      {/* Form Body */}
      <div className="p-5 space-y-5">
        {/* Success Message */}
        {successMsg && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-2 animate-shake">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{successMsg}</span>
          </div>
        )}
        
        {/* Error Message */}
        {submitError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 animate-shake">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{submitError}</span>
          </div>
        )}

        {/* Customer Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Select Customer *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <select 
              value={customerID} 
              onChange={(e) => setCustomerID(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-200 bg-white appearance-none cursor-pointer"
            >
              <option value="">-- Select Customer --</option>
              {customers.map(cust => (
                <option key={cust.id} value={cust.id}>{cust.name}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Date and Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Delivery Date
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-200"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Delivery Time
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <input
                type="time"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-200"
              />
            </div>
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
              onClick={() => setStatus("done")}
              className={`py-3 rounded-xl font-medium transition-all duration-200 active:scale-95 ${
                status === "done" 
                  ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              ✅ Done
            </button>
            <button 
              type="button"
              onClick={() => setStatus("pending")}
              className={`py-3 rounded-xl font-medium transition-all duration-200 active:scale-95 ${
                status === "pending" 
                  ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-md" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              ⏳ Pending
            </button>
            <button 
              type="button"
              onClick={() => setStatus("cancelled")}
              className={`py-3 rounded-xl font-medium transition-all duration-200 active:scale-95 ${
                status === "cancelled" 
                  ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              ❌ Cancelled
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
                className="w-full pl-10 pr-4 py-3 text-center text-lg font-semibold border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-200"
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
          {status === 'done' && parseFloat(quantityInput.value) <= 0 && (
            <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Quantity must be greater than 0 for completed deliveries
            </p>
          )}
        </div>

        {/* Quick Stats */}
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Today's deliveries:</span>
            <span className="font-semibold text-gray-800">{customers.length} customers</span>
          </div>
        </div>

        {/* Submit Button */}
        <button 
          onClick={handleSubmit}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-semibold text-base hover:from-green-700 hover:to-emerald-700 active:scale-95 transition-all duration-200 shadow-md flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Save Delivery
        </button>

        {/* Info Note */}
        <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-blue-700">
              <span className="font-semibold">Note:</span> Only customers assigned to you will appear in the list.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LogDeliveryForm