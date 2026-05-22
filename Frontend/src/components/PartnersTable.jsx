import React, { useState, useEffect } from 'react'
import api from '../api'

function PartnersTable() {
  const [partners, setPartners] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    area: ''
  })

  // Fetch partners
  const fetchPartners = () => {
    setLoading(true)
    api.get('/delivery-partners')
      .then(res => {
        setPartners(res.data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.response?.data?.detail || 'Failed to fetch partners')
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchPartners()
  }, [])

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    // Prepare data
    const submitData = {
      name: formData.name,
      phone: formData.phone || null,
      area: formData.area || null
    }

    try {
      if (editingId) {
        // Update
        await api.patch(`/delivery-partners/${editingId}`, submitData)
      } else {
        // Create
        await api.post('/delivery-partners', submitData)
      }
      resetForm()
      fetchPartners()
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
      }
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this partner? This will also affect customers assigned to this partner.')) return

    setLoading(true)
    try {
      await api.delete(`/delivery-partners/${id}`)
      fetchPartners()
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
  const handleEdit = (partner) => {
    setEditingId(partner.id)
    setFormData({
      name: partner.name,
      phone: partner.phone || '',
      area: partner.area || ''
    })
    setShowForm(true)
  }

  // Reset form
  const resetForm = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData({
      name: '',
      phone: '',
      area: ''
    })
    setError(null)
  }

  return (
    <div>
      <h2>Delivery Partners</h2>

      {/* Add Partner Button */}
      <button onClick={() => setShowForm(true)}>+ Add Partner</button>

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
            <h3>{editingId ? 'Edit Partner' : 'Add New Partner'}</h3>
            <form onSubmit={handleSubmit}>
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
                  style={{ width: '100%', padding: '5px' }}
                />
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label>Area: </label>
                <input
                  type="text"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  style={{ width: '100%', padding: '5px' }}
                />
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

      {/* Partners Table */}
      {!loading && (
        <div style={{ overflowX: 'auto', marginTop: '20px' }}>
          <p>Total Partners: {partners.length}</p>
          <table border="1" style={{ borderCollapse: 'collapse', width: '60%' }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Area</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {partners.map(partner => (
                <tr key={partner.id}>
                  <td>{partner.id}</td>
                  <td>{partner.name}</td>
                  <td>{partner.phone || '-'}</td>
                  <td>{partner.area || '-'}</td>
                  <td>{partner.created_at ? new Date(partner.created_at).toLocaleDateString() : '-'}</td>
                  <td>
                    <button onClick={() => handleEdit(partner)} style={{ marginRight: '5px' }}>Edit</button>
                    <button onClick={() => handleDelete(partner.id)} style={{ color: 'red' }}>Delete</button>
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

export default PartnersTable