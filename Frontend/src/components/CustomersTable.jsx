import React, { useState, useEffect } from "react";
import api from "../api";

function CustomersTable() {
  const [customers, setCustomers] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    milk_type: "",
    rate: "",
    delivery_partner_id: "",
    previous_balance: "0",
    status: "active",
  });

  // Milk types from your backend
  const milkTypes = ["kesav srishti", "Go-Amrut", "Raw Milk"];

  // Fetch customers
  const fetchCustomers = () => {
    setLoading(true);
    api
      .get("/customers")
      .then((res) => {
        setCustomers(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.detail || "Failed to fetch customers");
        setLoading(false);
      });
  };

  // Fetch partners for dropdown
  const fetchPartners = () => {
    api
      .get("/delivery-partners")
      .then((res) => setPartners(res.data))
      .catch((err) => console.error("Failed to fetch partners", err));
  };

  useEffect(() => {
    fetchCustomers();
    fetchPartners();
  }, []);

  // Get partner name by ID
  const getPartnerName = (partnerId) => {
    const partner = partners.find((p) => p.id === partnerId);
    return partner ? partner.name : "Not Assigned";
  };

  // Add this function to your CustomersTable component
  const transferCustomerLogs = async (customerIds, newPartnerId) => {
    try {
      const response = await api.post('/logs/bulk-update-partner', {
        customer_ids: Array.isArray(customerIds) ? customerIds : [customerIds],
        new_partner_id: newPartnerId
      })
      console.log('Logs updated:', response.data)
      return true
    } catch (err) {
      console.error('Failed to update logs:', err)
      setError(err.response?.data?.detail || 'Failed to update delivery logs')
      return false
    }
  }

  // Modify your existing handleSubmit function
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    // Store the OLD partner ID before update (for checking if partner changed)
    let oldPartnerId = null
    if (editingId) {
      const oldCustomer = customers.find(c => c.id === editingId)
      oldPartnerId = oldCustomer?.delivery_partner_id
    }

    // Prepare data
    const submitData = {
      name: formData.name,
      phone: formData.phone || null,
      address: formData.address || null,
      milk_type: formData.milk_type,
      rate: formData.rate ? parseFloat(formData.rate) : null,
      delivery_partner_id: formData.delivery_partner_id ? parseInt(formData.delivery_partner_id) : null,
      previous_balance: formData.previous_balance ? parseFloat(formData.previous_balance) : 0
    }

    try {
      // Step 1: Update customer (existing API)
      if (editingId) {
        await api.patch(`/customers/${editingId}`, submitData)

        // Step 2: If partner changed, update all logs for this customer
        const newPartnerId = submitData.delivery_partner_id
        if (newPartnerId && oldPartnerId !== newPartnerId) {
          await transferCustomerLogs(editingId, newPartnerId)
        }
      } else {
        await api.post('/customers', submitData)
      }

      resetForm()
      fetchCustomers()
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

  // Handle delete (soft delete)
  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this customer? This will preserve billing history.",
      )
    )
      return;

    setLoading(true);
    try {
      await api.delete(`/customers/${id}`);
      fetchCustomers();
    } catch (err) {
      setError(err.response?.data?.detail || "Delete failed");
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (customer) => {
    setEditingId(customer.id);
    setFormData({
      name: customer.name,
      phone: customer.phone || "",
      address: customer.address || "",
      milk_type: customer.milk_type,
      rate: customer.rate,
      delivery_partner_id: customer.delivery_partner_id || "",
      previous_balance: customer.previous_balance || "0",
      status: customer.status,
    });
    setShowForm(true);
  };

  // Reset form
  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      name: "",
      phone: "",
      address: "",
      milk_type: "",
      rate: "",
      delivery_partner_id: "",
      previous_balance: "0",
      status: "active",
    });
    setError(null);
  };

  return (
    <div>
      <h2>Customers</h2>

      {/* Add Customer Button */}
      <button onClick={() => setShowForm(true)}>+ Add Customer</button>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <>
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              backgroundColor: "white",
              padding: "20px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              zIndex: 1000,
              maxWidth: "500px",
              width: "90%",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
          >
            <h3>{editingId ? "Edit Customer" : "Add New Customer"}</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "10px" }}>
                <label>Name: </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  style={{ width: "100%", padding: "5px" }}
                />
              </div>

              <div style={{ marginBottom: "10px" }}>
                <label>Phone: </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  style={{ width: "100%", padding: "5px" }}
                />
              </div>

              <div style={{ marginBottom: "10px" }}>
                <label>Address: </label>
                <textarea
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  style={{ width: "100%", padding: "5px" }}
                  rows="2"
                />
              </div>

              <div style={{ marginBottom: "10px" }}>
                <label>Milk Type: </label>
                <select
                  value={formData.milk_type}
                  onChange={(e) =>
                    setFormData({ ...formData, milk_type: e.target.value })
                  }
                  required
                  style={{ width: "100%", padding: "5px" }}
                >
                  <option value="">Select Milk Type</option>
                  {milkTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "10px" }}>
                <label>Rate: </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.rate}
                  onChange={(e) =>
                    setFormData({ ...formData, rate: e.target.value })
                  }
                  required
                  style={{ width: "100%", padding: "5px" }}
                />
              </div>

              <div style={{ marginBottom: "10px" }}>
                <label>Delivery Partner: </label>
                <select
                  value={formData.delivery_partner_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      delivery_partner_id: e.target.value,
                    })
                  }
                  style={{ width: "100%", padding: "5px" }}
                >
                  <option value="">Select Partner</option>
                  {partners.map((partner) => (
                    <option key={partner.id} value={partner.id}>
                      {partner.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "10px" }}>
                <label>Previous Balance: </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.previous_balance}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      previous_balance: e.target.value,
                    })
                  }
                  style={{ width: "100%", padding: "5px" }}
                />
              </div>

              {editingId && (
                <div style={{ marginBottom: "10px" }}>
                  <label>Status: </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    style={{ width: "100%", padding: "5px" }}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="deleted">Deleted</option>
                  </select>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  justifyContent: "flex-end",
                  marginTop: "20px",
                }}
              >
                <button type="button" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" disabled={loading}>
                  {loading ? "Saving..." : editingId ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              zIndex: 999,
            }}
            onClick={resetForm}
          />
        </>
      )}

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Customers Table */}
      {!loading && (
        <div style={{ overflowX: "auto", marginTop: "20px" }}>
          <p>Total Customers: {customers.length}</p>
          <table
            border="1"
            style={{ borderCollapse: "collapse", width: "100%" }}
          >
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Milk Type</th>
                <th>Rate</th>
                <th>Partner</th>
                <th>Prev Balance</th>
                <th>Joined At</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr
                  key={customer.id}
                  style={{
                    backgroundColor:
                      customer.status === "deleted" ? "#ffcccc" : "transparent",
                  }}
                >
                  <td>{customer.id}</td>
                  <td>{customer.name}</td>
                  <td>{customer.phone || "-"}</td>
                  <td>{customer.address || "-"}</td>
                  <td>{customer.milk_type}</td>
                  <td>₹{customer.rate}</td>
                  <td>{getPartnerName(customer.delivery_partner_id)}</td>
                  <td>₹{customer.previous_balance || 0}</td>
                  <td>
                    {customer.created_at
                      ? new Date(customer.created_at).toLocaleDateString()
                      : "-"}
                  </td>
                  <td>{customer.status}</td>
                  <td>
                    <button
                      onClick={() => handleEdit(customer)}
                      style={{ marginRight: "5px" }}
                    >
                      Edit
                    </button>
                    {customer.status !== "deleted" && (
                      <button
                        onClick={() => handleDelete(customer.id)}
                        style={{ color: "red" }}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default CustomersTable;
