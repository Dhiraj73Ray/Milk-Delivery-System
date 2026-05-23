import React, { useState, useEffect } from 'react'
import api from '../api'

function UsersTable() {
  const [users, setUsers] = useState([])
  const [partners, setPartners] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    role: 'delivery_partner',
    delivery_partner_id: ''
  })
  const [partnerChanged, setPartnerChanged] = useState(false)

  // Fetch users
  const fetchUsers = () => {
    setLoading(true)
    api.get('/auth/users')
      .then(res => {
        setUsers(res.data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.response?.data?.detail || 'Failed to fetch users')
        setLoading(false)
      })
  }

  // Fetch partners for dropdown
  const fetchPartners = () => {
    api.get('/delivery-partners')
      .then(res => setPartners(res.data))
      .catch(err => console.error('Failed to fetch partners', err))
  }

  useEffect(() => {
    fetchUsers()
    fetchPartners()
  }, [])

  // Get available partners (partners without user accounts, except current one)
  const getAvailablePartners = () => {
    const partnerIdsWithUsers = users
      .filter(user => user.delivery_partner_id && user.id !== editingId)
      .map(user => user.delivery_partner_id)

    return partners.filter(partner => !partnerIdsWithUsers.includes(partner.id))
  }

  // Helper to accurately process date formats across DB standards
  const formatDate = (user) => {
    // Check for created_at from your API
    const dateVal = user.created_at
    if (!dateVal) return '-'

    try {
      const parsedDate = new Date(dateVal)
      if (isNaN(parsedDate.getTime())) return '-'

      // Format as: DD/MM/YYYY or MM/DD/YYYY based on your preference
      return parsedDate.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch (error) {
      return '-'
    }
  }

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (editingId && partnerChanged && !formData.password) {
      setError('Password is required because partner was changed')
      return
    }
    setLoading(true)

    const submitData = {
      name: formData.name,
      phone: formData.phone,
      role: formData.role,
      delivery_partner_id: formData.role === 'delivery_partner' && formData.delivery_partner_id
        ? parseInt(formData.delivery_partner_id)
        : null
    }

    if (formData.password) {
      submitData.password = formData.password
    }

    try {
      if (editingId) {
        if (partnerChanged && !formData.password) {
          throw new Error('Password is required because partner was changed')
        }
        await api.patch(`/auth/users/${editingId}`, submitData)
      } else {
        if (!formData.password) {
          throw new Error('Password is required for new user')
        }
        await api.post('/auth/users', submitData)
      }
      resetForm()
      setPartnerChanged(false)
      fetchUsers()
      setError(null)
    } catch (err) {
      let errorMessage = 'Operation failed'
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail
        } else if (Array.isArray(err.response.data.detail)) {
          errorMessage = err.response.data.detail.map(e => e.msg).join(', ')
        } else {
          errorMessage = JSON.stringify(err.response.data.detail)
        }
      } else if (err.message) {
        errorMessage = err.message
      }
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return

    setLoading(true)
    try {
      await api.delete(`/auth/users/${id}`)
      fetchUsers()
    } catch (err) {
      let errorMessage = 'Delete failed'
      if (err.response?.data?.detail) {
        errorMessage = typeof err.response.data.detail === 'string'
          ? err.response.data.detail
          : JSON.stringify(err.response.data.detail)
      }
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Handle edit
  const handleEdit = (user) => {
    setEditingId(user.id)
    setFormData({
      name: user.name || '',
      phone: user.phone || '',
      password: '',
      role: user.role,
      delivery_partner_id: user.delivery_partner_id || ''
    })
    setPartnerChanged(false)
    setShowForm(true)
  }

  // Get partner name by ID
  const getPartnerName = (partnerId) => {
    const partner = partners.find(p => p.id === partnerId)
    return partner ? partner.name : '-'
  }

  // Helper to accurately process date formats across DB standards
  // const formatDate = (user) => {
  //   const dateVal = user.created_at || user.createdAt
  //   if (!dateVal) return '-'

  //   const parsedDate = new Date(dateVal)
  //   return isNaN(parsedDate.getTime()) ? '-' : parsedDate.toLocaleDateString()
  // }

  // Reset form
  const resetForm = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData({
      name: '',
      phone: '',
      password: '',
      role: 'delivery_partner',
      delivery_partner_id: ''
    })
    setPartnerChanged(false)
    setError(null)
  }

  const availablePartners = getAvailablePartners()

  // Calculate summary stats
  const adminCount = users.filter(u => u.role === 'admin').length
  const partnerCount = users.filter(u => u.role === 'delivery_partner').length

  // Loading State
  if (loading && users.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-600"></div>
        <p className="mt-3 text-gray-500">Loading users...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold">User Management</h2>
              <p className="text-sm text-blue-100 mt-0.5">Manage system users and roles</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-white/20 rounded-xl font-medium text-sm hover:bg-white/30 active:scale-95 transition-all duration-200 backdrop-blur flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add User
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-xs text-gray-500">Admins</p>
          </div>
          <p className="text-2xl font-bold text-gray-800">{adminCount}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-xs text-gray-500">Delivery Partners</p>
          </div>
          <p className="text-2xl font-bold text-gray-800">{partnerCount}</p>
        </div>
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

      {/* Users Table */}
      {users.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Phone</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Partner</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created At</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{user.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">ID: {user.id}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span className="text-sm text-gray-600">{user.phone}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${user.role === 'admin'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-green-100 text-green-700'
                        }`}>
                        {user.role === 'admin' ? '👑 Admin' : '🚚 Delivery'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {user.role === 'delivery_partner' ? (
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="text-sm text-gray-600">{getPartnerName(user.delivery_partner_id)}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm text-gray-500 font-mono">
                        {formatDate(user)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                          title="Edit"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
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

          {/* Footer */}
          <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Users:</span>
              <span className="text-sm font-semibold text-gray-800">{users.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && users.length === 0 && !error && (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <p className="text-gray-500">No users found</p>
          <p className="text-sm text-gray-400 mt-1">Click "Add User" to get started</p>
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
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-2xl p-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold">
                      {editingId ? 'Edit User' : 'Add New User'}
                    </h3>
                    <p className="text-sm text-blue-100 mt-0.5">
                      {editingId ? 'Update user account details' : 'Create a new user account'}
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
                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Account Role *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          role: 'admin',
                          delivery_partner_id: '',
                          name: '',
                          phone: ''
                        })
                      }}
                      className={`py-3 rounded-xl font-medium transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 ${formData.role === 'admin'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      <span>👑</span>
                      <span>Admin</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          role: 'delivery_partner',
                          delivery_partner_id: ''
                        })
                        setPartnerChanged(false)
                      }}
                      className={`py-3 rounded-xl font-medium transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 ${formData.role === 'delivery_partner'
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      <span>🚚</span>
                      <span>Delivery</span>
                    </button>
                  </div>
                </div>

                {/* Delivery Partner Selection */}
                {formData.role === 'delivery_partner' && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Select Partner Profile *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <select
                          value={formData.delivery_partner_id}
                          onChange={(e) => {
                            const selectedId = e.target.value
                            const selectedPartner = partners.find(p => p.id === parseInt(selectedId))

                            if (selectedPartner) {
                              const isPartnerChanged = selectedId !== formData.delivery_partner_id
                              setFormData({
                                ...formData,
                                delivery_partner_id: selectedId,
                                name: selectedPartner.name,
                                phone: selectedPartner.phone,
                                password: ''
                              })
                              if (isPartnerChanged && editingId) {
                                setPartnerChanged(true)
                              }
                            }
                          }}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-white appearance-none"
                        >
                          <option value="">-- Select Partner --</option>
                          {availablePartners.map(partner => (
                            <option key={partner.id} value={partner.id}>
                              {partner.name} {editingId && partner.id === parseInt(formData.delivery_partner_id) ? '(current)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                      {availablePartners.length === 0 && (
                        <p className="text-xs text-orange-600 mt-1.5 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          All partners already have user accounts
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Name (Auto-filled)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          value={formData.name}
                          disabled
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                          placeholder="Auto-filled from partner"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Phone (Auto-filled)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </div>
                        <input
                          type="tel"
                          value={formData.phone}
                          disabled
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                          placeholder="Auto-filled from partner"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Admin Fields */}
                {formData.role === 'admin' && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Admin Name *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                          placeholder="Enter admin name"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Admin Phone *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </div>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          required
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                          placeholder="Enter admin phone"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Password Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password {partnerChanged && editingId && <span className="text-red-500">*</span>}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required={!editingId || partnerChanged}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                      placeholder={editingId ? (partnerChanged ? 'Required - enter new password' : 'Leave blank to keep current') : 'Enter password'}
                    />
                  </div>
                  {editingId && !partnerChanged && (
                    <p className="text-xs text-gray-500 mt-1.5">
                      Leave empty to keep current password
                    </p>
                  )}
                  {editingId && partnerChanged && (
                    <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Password required when changing partner
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
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
                      editingId ? 'Update User' : 'Create User'
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

export default UsersTable