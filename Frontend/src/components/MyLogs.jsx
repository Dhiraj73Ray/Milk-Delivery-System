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

  if (loading) return <p>Loading...</p>
  if (error) return <p style={{ color: 'red' }}>{error}</p>

  // Mobile View
  if (isMobile) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <span>📋</span> My Logs
          </h2>
          <button 
            onClick={handleAddLog}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm"
          >
            + Add Delivery
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
          <input
            type="date"
            value={date}
            max={today}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg"
          />
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-10 text-gray-500">No logs found for {date}</div>
        ) : (
          <>
            <div className="space-y-3">
              {paginatedLogs.map(log => (
                <div key={log.log_id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">{log.customer_name}</p>
                      <div className="flex gap-3 mt-2 text-sm text-gray-600">
                        <span>🥛 {log.quantity_delivered} L</span>
                        <span className={log.delivery_status === 'done' ? 'text-green-600' : 'text-orange-500'}>
                          {log.delivery_status === 'done' ? '✓ Done' : '⏳ Pending'}
                        </span>
                        <span>⏰ {log.delivery_time_raw ? log.delivery_time_raw.substring(0, 5) : '-'}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEditLog(log)}
                        className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteLog(log.log_id)}
                        className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm"
                      >
                        Del
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-4">
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

  // Desktop View - Original Table Layout
  return (
    <div>
      <h2>My Delivery Logs</h2>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <div>
          <label>Select Date: </label>
          <input
            type="date"
            value={date}
            max={today}
            onChange={(e) => setDate(e.target.value)}
            style={{ padding: '5px', marginLeft: '10px' }}
          />
        </div>
        <button onClick={handleAddLog} style={{ backgroundColor: '#28a745', color: 'white', padding: '5px 10px' }}>
          + Add Delivery
        </button>
      </div>

      {logs.length === 0 ? (
        <p>No logs found for {date}</p>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table border="1" style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Quantity (L)</th>
                  <th>Status</th>
                  <th>Delivery Time</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLogs.map(log => (
                  <tr key={log.log_id}>
                    <td>{log.customer_name}</td>
                    <td>{log.quantity_delivered}</td>
                    <td style={{ color: log.delivery_status === 'done' ? 'green' : 'orange' }}>
                      {log.delivery_status}
                    </td>
                    <td>{log.delivery_time_raw ? log.delivery_time_raw.substring(0, 5) : '-'}</td>
                    <td>
                      <button onClick={() => handleEditLog(log)} style={{ marginRight: '5px' }}>
                        Edit
                      </button>
                      <button onClick={() => handleDeleteLog(log.log_id)} style={{ color: 'red' }}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '20px' }}>
            <div className="record-count">
              Showing {totalItems === 0 ? 0 : ((currentPage - 1) * 20) + 1} to{' '}
              {Math.min(currentPage * 20, totalItems)} of {totalItems} logs
            </div>

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

export default MyLogs