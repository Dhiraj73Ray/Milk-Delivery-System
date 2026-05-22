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
    // Get all partner IDs that already have user accounts
    const partnerIdsWithUsers = users
      .filter(user => user.delivery_partner_id && user.id !== editingId)
      .map(user => user.delivery_partner_id)

    // Filter partners: exclude those that already have user accounts
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

    // Prepare data
    const submitData = {
      name: formData.name,
      phone: formData.phone,
      role: formData.role,
      delivery_partner_id: formData.role === 'delivery_partner' && formData.delivery_partner_id
        ? parseInt(formData.delivery_partner_id)
        : null
    }

    // Only include password if provided (for create or password change)
    if (formData.password) {
      submitData.password = formData.password
    }

    try {
      if (editingId) {
        // Check if partner was changed and password is empty
        if (partnerChanged && !formData.password) {
          throw new Error('Password is required because partner was changed')
        }

        // Update - exclude password if empty (but only allow empty if partner not changed)
        await api.patch(`/auth/users/${editingId}`, submitData)
      } else {
        // Create - password is required
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
    console.log('Editing user:', user.name, 'Phone:', user.phone, 'Partner ID:', user.delivery_partner_id)
    setEditingId(user.id)
    setFormData({
      name: user.name,
      phone: user.phone,
      password: '',  // Empty password means don't change
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
    <div>
      <h2>Users</h2>

      {/* Add User Button */}
      <button onClick={() => setShowForm(true)}>+ Add User</button>

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
              padding: '20px',
              border: '1px solid #ccc',
              borderRadius: '8px',
              zIndex: 1000,
              maxWidth: '400px',
              width: '90%'
            }}
          >
            <h3>{editingId ? 'Edit User' : 'Add New User'}</h3>
            <form onSubmit={handleSubmit}>
              {/* Role Selection - Always at top */}
              <div style={{ marginBottom: '10px' }}>
                <label>Role: </label>
                <label style={{ marginLeft: '10px' }}>
                  <input
                    type="radio"
                    name="role"
                    value="admin"
                    checked={formData.role === 'admin'}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        role: e.target.value,
                        delivery_partner_id: ''
                      })
                      // Reset name/phone when switching to admin
                      if (e.target.value === 'admin') {
                        setFormData(prev => ({
                          ...prev,
                          name: '',
                          phone: ''
                        }))
                      }
                    }}
                  /> Admin
                </label>
                <label style={{ marginLeft: '10px' }}>
                  <input
                    type="radio"
                    name="role"
                    value="delivery_partner"
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

              {/* For Delivery Partner: Show partner dropdown + auto-fill */}
              {formData.role === 'delivery_partner' ? (
                <>
                  <div style={{ marginBottom: '10px' }}>
                    <label>Select Partner: </label>
                    <select
                      value={formData.delivery_partner_id}
                      onChange={(e) => {
                        const selectedId = e.target.value
                        const selectedPartner = partners.find(p => p.id === parseInt(selectedId))

                        if (selectedPartner) {
                          // Auto-fill name and phone from selected partner
                          const isPartnerChanged = selectedId !== formData.delivery_partner_id
                          setFormData({
                            ...formData,
                            delivery_partner_id: selectedId,
                            name: selectedPartner.name,
                            phone: selectedPartner.phone,
                            password: ''  // Clear password when partner changes
                          })
                          if (isPartnerChanged && editingId) {
                            setPartnerChanged(true)
                          }
                        }
                      }}
                      style={{ width: '100%', padding: '5px' }}
                    >
                      <option value="">-- Select Partner --</option>
                      {availablePartners.map(partner => (
                        <option key={partner.id} value={partner.id}>
                          {partner.name} {editingId && partner.id === parseInt(formData.delivery_partner_id) ? '(current)' : ''}
                        </option>
                      ))}
                    </select>
                    {availablePartners.length === 0 && (
                      <small style={{ color: '#ff6600' }}>
                        No available partners. All partners already have user accounts.
                      </small>
                    )}
                  </div>

                  {/* Name field - auto-filled */}
                  <div style={{ marginBottom: '10px' }}>
                    <label>Name: </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      style={{ width: '100%', padding: '5px' }}
                      placeholder="Auto-filled from partner"
                    />
                  </div>

                  {/* Phone field - auto-filled */}
                  <div style={{ marginBottom: '10px' }}>
                    <label>Phone: </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      style={{ width: '100%', padding: '5px' }}
                      placeholder="Auto-filled from partner"
                    />
                  </div>
                </>
              ) : (
                // For Admin: Show name and phone inputs
                <>
                  <div style={{ marginBottom: '10px' }}>
                    <label>Name: </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      style={{ width: '100%', padding: '5px' }}
                    />
                  </div>

                  <div style={{ marginBottom: '10px' }}>
                    <label>Phone: </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      style={{ width: '100%', padding: '5px' }}
                    />
                  </div>
                </>
              )}

              {/* Password field - always visible */}
              <div style={{ marginBottom: '10px' }}>
                <label>Password: {partnerChanged && editingId && <span style={{ color: 'red' }}>*</span>}</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingId ? (partnerChanged ? 'Required - password must be updated' : 'Leave blank to keep current') : 'Required'}
                  required={!editingId || partnerChanged}  // ← Make required if partner changed
                  style={{ width: '100%', padding: '5px' }}
                />
                {editingId && !partnerChanged && (
                  <small style={{ color: '#666' }}>Leave blank to keep current password</small>
                )}
                {editingId && partnerChanged && (
                  <small style={{ color: 'red' }}>⚠️ Partner changed - you must enter a new password</small>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={resetForm}>Cancel</button>
                <button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : (editingId ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 999
            }}
            onClick={resetForm}
          />
        </>
      )}

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Users Table */}
      {!loading && (
        <div style={{ overflowX: 'auto', marginTop: '20px' }}>
          <p>Total Users: {users.length}</p>
          <table border="1" style={{ borderCollapse: 'collapse', width: '60%' }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Partner</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.name}</td>
                  <td>{user.phone}</td>
                  <td>{user.role}</td>
                  <td>{user.role === 'delivery_partner' ? getPartnerName(user.delivery_partner_id) : '-'}</td>
                  <td>{user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}</td>
                  <td>
                    <button onClick={() => handleEdit(user)} style={{ marginRight: '5px' }}>Edit</button>
                    <button onClick={() => handleDelete(user.id)} style={{ color: 'red' }}>Delete</button>
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