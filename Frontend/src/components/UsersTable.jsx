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
  const formatDate = (user) => {
    // Check both snake_case and camelCase fallbacks from FastAPI serialization
    const dateVal = user.created_at || user.createdAt
    if (!dateVal) return '-'
    
    const parsedDate = new Date(dateVal)
    return isNaN(parsedDate.getTime()) ? '-' : parsedDate.toLocaleDateString()
  }

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

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Users Management</h2>
        <button 
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded shadow-sm text-sm"
        >
          + Add User
        </button>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <>
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'white',
              padding: '25px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              zIndex: 1000,
              maxWidth: '420px',
              width: '90%',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          >
            <h3 className="text-lg font-bold text-gray-700 mb-4">{editingId ? 'Edit User Account' : 'Add New User Account'}</h3>
            <form onSubmit={handleSubmit}>
              
              {/* Role Selection */}
              <div className="mb-4">
                <span className="block text-sm font-medium text-gray-600 mb-1">Account Role:</span>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      className="mr-1.5"
                      checked={formData.role === 'admin'}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          role: e.target.value,
                          delivery_partner_id: '',
                          name: '',
                          phone: ''
                        })
                      }}
                    /> Admin
                  </label>
                  <label className="flex items-center text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="delivery_partner"
                      className="mr-1.5"
                      checked={formData.role === 'delivery_partner'}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          role: e.target.value,
                          delivery_partner_id: ''
                        })
                        setPartnerChanged(false)
                      }}
                    /> Delivery Partner
                  </label>
                </div>
              </div>

              {/* Delivery Partner Options */}
              {formData.role === 'delivery_partner' ? (
                <>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Select Partner profile:</label>
                    <select
                      value={formData.delivery_partner_id}
                      className="w-full border border-gray-300 rounded p-2 text-sm bg-white"
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
                    >
                      <option value="">-- Select Partner Profile --</option>
                      {availablePartners.map(partner => (
                        <option key={partner.id} value={partner.id}>
                          {partner.name} {editingId && partner.id === parseInt(formData.delivery_partner_id) ? '(current)' : ''}
                        </option>
                      ))}
                    </select>
                    {availablePartners.length === 0 && (
                      <p className="text-xs text-orange-500 mt-1">
                        All mapped delivery partners already have local user accounts setup.
                      </p>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Name:</label>
                    <input
                      type="text"
                      value={formData.name}
                      disabled
                      className="w-full border border-gray-200 bg-gray-50 rounded p-2 text-sm text-gray-500 cursor-not-allowed"
                      placeholder="Linked profile name"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Phone String:</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      disabled
                      className="w-full border border-gray-200 bg-gray-50 rounded p-2 text-sm text-gray-500 cursor-not-allowed"
                      placeholder="Linked profile contact phone"
                    />
                  </div>
                </>
              ) : (
                /* Admin Route Handling - Fields are now properly editable */
                <>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Admin Name:</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full border border-gray-300 rounded p-2 text-sm"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Admin Phone:</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      className="w-full border border-gray-300 rounded p-2 text-sm"
                    />
                  </div>
                </>
              )}

              {/* Password Config */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Password: {partnerChanged && editingId && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingId ? (partnerChanged ? 'Required - update password' : 'Blank to keep current') : 'Required'}
                  required={!editingId || partnerChanged}
                  className="w-full border border-gray-300 rounded p-2 text-sm"
                />
                {editingId && !partnerChanged && (
                  <p className="text-xs text-gray-400 mt-1">Leave empty to preserve existing hashed password strings.</p>
                )}
                {editingId && partnerChanged && (
                  <p className="text-xs text-red-500 mt-1 font-medium">⚠️ Partner target swapped: You must set a new baseline password.</p>
                )}
              </div>

              <div className="flex gap-2 justify-end mt-6">
                <button 
                  type="button" 
                  onClick={resetForm}
                  className="px-3 py-1.5 border border-gray-300 hover:bg-gray-50 rounded text-sm font-medium text-gray-600"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded text-sm shadow-sm"
                >
                  {loading ? 'Saving...' : (editingId ? 'Update Account' : 'Create Account')}
                </button>
              </div>
            </form>
          </div>
          
          {/* Backdrop Shadow overlay */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.4)',
              zIndex: 999
            }}
            onClick={resetForm}
          />
        </>
      )}

      {error && (
        <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-600 rounded text-sm font-medium">
          {error}
        </div>
      )}

      {/* Users Data Grid Layout */}
      {loading && users.length === 0 ? (
        <p className="text-sm text-gray-500 italic">Refreshing database logs...</p>
      ) : (
        <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg shadow-sm mt-2">
          <div className="p-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">System Accounts Log</span>
            <span className="text-xs font-bold px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full">Total: {users.length}</span>
          </div>
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <br/>
              <tr className="bg-gray-100 text-gray-600 text-xs uppercase font-medium border-b border-gray-200">
                <th className="p-3 font-semibold">ID</th>
                <th className="p-3 font-semibold">Name</th>
                <th className="p-3 font-semibold">Phone</th>
                <th className="p-3 font-semibold">Role</th>
                <th className="p-3 font-semibold">Partner Link</th>
                <th className="p-3 font-semibold">Created At</th>
                <th className="p-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-3 text-gray-400 font-mono text-xs">{user.id}</td>
                  <td className="p-3 font-medium text-gray-900">{user.name}</td>
                  <td className="p-3">{user.phone}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-3 text-gray-500">
                    {user.role === 'delivery_partner' ? getPartnerName(user.delivery_partner_id) : '-'}
                  </td>
                  {/* Clean safe data handler mapping target checks */}
                  <td className="p-3 text-gray-500">{formatDate(user)}</td>
                  <td className="p-3 text-right space-x-2">
                    <button 
                      onClick={() => handleEdit(user)} 
                      className="text-blue-600 hover:text-blue-800 font-medium text-xs"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(user.id)} 
                      className="text-red-600 hover:text-red-800 font-medium text-xs"
                    >
                      Delete
                    </button>
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

export default UsersTable