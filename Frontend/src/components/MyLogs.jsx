import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import PartnerDeliveryLogModal from './PartnerDeliveryLogModal'
import { usePagination } from '../hooks/usePagination'
import { PaginationControls } from '../components/PaginationControls'
import useIsMobile from '../hooks/useIsMobile'

function MyLogs() {
  const today = new Date().toISOString().split("T")[0]
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [date, setDate] = useState(today)
  const { partnerID } = useAuth()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingLog, setEditingLog] = useState(null)
  const [modalMode, setModalMode] = useState('edit')
  const isMobile = useIsMobile()

  const {
    currentItems: paginatedLogs,
    currentPage,
    totalPages,
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    totalItems,
    resetPage
  } = usePagination(logs, isMobile ? 10 : 20)

  useEffect(() => {
    fetchLogs()
  }, [date])

  const fetchLogs = () => {
    setLoading(true)
    setError("")
    api.get(`/dsr/partner/${partnerID}/date/${date}`)
      .then(res => {
        setLogs(res.data.logs || [])
        setLoading(false)
        resetPage()
      })
      .catch(err => {
        setError("Failed to load Logs")
        setLoading(false)
      })
  }

  const handleEditLog = (log) => {
    setEditingLog(log)
    setModalMode('edit')
    setModalOpen(true)
  }

  const handleAddLog = () => {
    setEditingLog(null)
    setModalMode('create')
    setModalOpen(true)
  }

  const handleSaveLog = () => {
    fetchLogs()
  }

  const handleDeleteLog = async (logId) => {
    if (!window.confirm('Are you sure you want to delete this delivery log?')) return

    try {
      await api.delete(`/logs/${logId}`)
      fetchLogs()
    } catch (err) {
      alert("Failed to delete log")
    }
  }

  // Calculate summary stats
  const totalQuantity = logs.reduce((sum, log) => sum + (parseFloat(log.quantity_delivered) || 0), 0)
  const completedCount = logs.filter(log => log.delivery_status === 'done').length
  const pendingCount = logs.filter(log => log.delivery_status === 'pending').length

  // Loading State
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-600"></div>
        <p className="mt-3 text-gray-500">Loading delivery logs...</p>
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

  // Mobile View
  if (isMobile) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold">My Delivery Logs</h2>
                <p className="text-sm text-blue-100 mt-0.5">Track your daily deliveries</p>
              </div>
            </div>
            <button 
              onClick={handleAddLog}
              className="px-4 py-2 bg-white/20 rounded-xl font-medium text-sm hover:bg-white/30 active:scale-95 transition-all duration-200 backdrop-blur flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add
            </button>
          </div>
        </div>

        {/* Date Selector & Stats */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Date
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <input
                type="date"
                value={date}
                max={today}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
              />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-green-50 rounded-xl p-2 text-center">
              <p className="text-xs text-gray-600">Completed</p>
              <p className="text-lg font-bold text-green-600">{completedCount}</p>
            </div>
            <div className="bg-yellow-50 rounded-xl p-2 text-center">
              <p className="text-xs text-gray-600">Pending</p>
              <p className="text-lg font-bold text-yellow-600">{pendingCount}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-2 text-center">
              <p className="text-xs text-gray-600">Total L</p>
              <p className="text-lg font-bold text-blue-600">{totalQuantity.toFixed(1)}</p>
            </div>
          </div>
        </div>

        {/* Logs List */}
        {logs.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-gray-500">No delivery logs found</p>
            <p className="text-sm text-gray-400 mt-1">for {date}</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {paginatedLogs.map(log => (
                <div key={log.log_id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
                  {/* Log Header */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">
                            {log.customer_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-800">{log.customer_name}</h3>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEditLog(log)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                          title="Edit"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => handleDeleteLog(log.log_id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                          title="Delete"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Log Details */}
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 text-gray-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Quantity</p>
                          <p className="text-sm font-semibold text-gray-800">{log.quantity_delivered} L</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 text-gray-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Time</p>
                          <p className="text-sm font-mono text-gray-800">{log.delivery_time_raw ? log.delivery_time_raw.substring(0, 5) : '-'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 col-span-2">
                        <div className="w-8 text-gray-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Status</p>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            log.delivery_status === 'done' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {log.delivery_status === 'done' ? '✓ Completed' : '⏳ Pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  goToPage={goToPage}
                  nextPage={nextPage}
                  prevPage={prevPage}
                  firstPage={firstPage}
                  lastPage={lastPage}
                  totalItems={totalItems}
                  itemsPerPage={isMobile ? 10 : 20}
                  showInfo={false}
                />
              </div>
            )}
          </>
        )}

        <PartnerDeliveryLogModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          log={editingLog}
          onSave={handleSaveLog}
          mode={modalMode}
          partnerId={partnerID}
        />
      </div>
    )
  }

  // Desktop View - Enhanced Table Layout
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">My Delivery Logs</h2>
            <p className="text-blue-100 mt-1">View and manage your daily deliveries</p>
          </div>
          <button 
            onClick={handleAddLog}
            className="px-4 py-2 bg-white/20 rounded-xl font-medium text-sm hover:bg-white/30 active:scale-95 transition-all duration-200 backdrop-blur flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Delivery
          </button>
        </div>
      </div>

      {/* Date Selector & Stats */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Date
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <input
                type="date"
                value={date}
                max={today}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <div className="bg-green-50 rounded-xl px-4 py-2 text-center">
              <p className="text-xs text-gray-600">Completed</p>
              <p className="text-xl font-bold text-green-600">{completedCount}</p>
            </div>
            <div className="bg-yellow-50 rounded-xl px-4 py-2 text-center">
              <p className="text-xs text-gray-600">Pending</p>
              <p className="text-xl font-bold text-yellow-600">{pendingCount}</p>
            </div>
            <div className="bg-blue-50 rounded-xl px-4 py-2 text-center">
              <p className="text-xs text-gray-600">Total Litres</p>
              <p className="text-xl font-bold text-blue-600">{totalQuantity.toFixed(1)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      {logs.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-gray-500">No delivery logs found for {date}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Quantity (L)</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Delivery Time</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedLogs.map(log => (
                  <tr key={log.log_id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{log.customer_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right font-semibold">
                      {log.quantity_delivered} L
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        log.delivery_status === 'done' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {log.delivery_status === 'done' ? '✓ Done' : '⏳ Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 text-center font-mono">
                      {log.delivery_time_raw ? log.delivery_time_raw.substring(0, 5) : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEditLog(log)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                          title="Edit"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteLog(log.log_id)}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-gray-100 p-4">
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                goToPage={goToPage}
                nextPage={nextPage}
                prevPage={prevPage}
                firstPage={firstPage}
                lastPage={lastPage}
                totalItems={totalItems}
                itemsPerPage={20}
                showInfo={false}
              />
            </div>
          )}
        </div>
      )}

      <PartnerDeliveryLogModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        log={editingLog}
        onSave={handleSaveLog}
        mode={modalMode}
        partnerId={partnerID}
      />
    </div>
  )
}

export default MyLogs