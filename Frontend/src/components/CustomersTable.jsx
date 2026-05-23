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

  const transferCustomerLogs = async (customerIds, newPartnerId) => {
    try {
      const response = await api.post('/logs/bulk-update-partner', {
        customer_ids: Array.isArray(customerIds) ? customerIds : [customerIds],
        new_partner_id: newPartnerId
      });
      console.log('Logs updated:', response.data);
      return true;
    } catch (err) {
      console.error('Failed to update logs:', err);
      setError(err.response?.data?.detail || 'Failed to update delivery logs');
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    let oldPartnerId = null;
    if (editingId) {
      const oldCustomer = customers.find(c => c.id === editingId);
      oldPartnerId = oldCustomer?.delivery_partner_id;
    }

    const submitData = {
      name: formData.name,
      phone: formData.phone || null,
      address: formData.address || null,
      milk_type: formData.milk_type,
      rate: formData.rate ? parseFloat(formData.rate) : null,
      delivery_partner_id: formData.delivery_partner_id ? parseInt(formData.delivery_partner_id) : null,
      previous_balance: formData.previous_balance ? parseFloat(formData.previous_balance) : 0
    };

    try {
      if (editingId) {
        await api.patch(`/customers/${editingId}`, submitData);
        const newPartnerId = submitData.delivery_partner_id;
        if (newPartnerId && oldPartnerId !== newPartnerId) {
          await transferCustomerLogs(editingId, newPartnerId);
        }
      } else {
        await api.post('/customers', submitData);
      }

      resetForm();
      fetchCustomers();
      setError(null);
    } catch (err) {
      let errorMessage = 'Operation failed';
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail;
        } else if (Array.isArray(err.response.data.detail)) {
          errorMessage = err.response.data.detail.map(e => e.msg).join(', ');
        } else {
          errorMessage = JSON.stringify(err.response.data.detail);
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this customer? This will preserve billing history.")) return;

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

  // Calculate summary stats
  const activeCustomers = customers.filter(c => c.status === 'active').length;
  const totalPreviousBalance = customers.reduce((sum, c) => sum + (parseFloat(c.previous_balance) || 0), 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold">Customers</h2>
              <p className="text-sm text-teal-100 mt-0.5">Manage customer information</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-white/20 rounded-xl font-medium text-sm hover:bg-white/30 active:scale-95 transition-all duration-200 backdrop-blur"
          >
            + Add Customer
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {!loading && customers.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <p className="text-xs text-gray-500 mb-1">Total Customers</p>
            <p className="text-2xl font-bold text-gray-800">{customers.length}</p>
            <p className="text-xs text-green-600 mt-1">{activeCustomers} active</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <p className="text-xs text-gray-500 mb-1">Total Previous Balance</p>
            <p className="text-2xl font-bold text-orange-600">₹{totalPreviousBalance.toLocaleString('en-IN')}</p>
            <p className="text-xs text-gray-500 mt-1">Across all customers</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-2xl p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-teal-200 border-t-teal-600"></div>
          <p className="mt-3 text-gray-500">Loading customers...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Customers Table */}
      {!loading && customers.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Milk Type</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Rate</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Partner</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Balance</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.map((customer) => (
                  <tr 
                    key={customer.id} 
                    className={`hover:bg-gray-50 transition-colors duration-150 ${
                      customer.status === 'deleted' ? 'bg-red-50/50' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{customer.name}</p>
                        {customer.address && (
                          <p className="text-xs text-gray-500 mt-0.5">{customer.address}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {customer.phone || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        customer.milk_type === 'kesav srishti' ? 'bg-orange-100 text-orange-700' :
                        customer.milk_type === 'Go-Amrut' ? 'bg-green-100 text-green-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {customer.milk_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">
                      ₹{parseFloat(customer.rate).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {getPartnerName(customer.delivery_partner_id)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-sm font-semibold ${
                        parseFloat(customer.previous_balance) > 0 ? 'text-red-600' :
                        parseFloat(customer.previous_balance) < 0 ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        ₹{parseFloat(customer.previous_balance || 0).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(customer)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                          title="Edit"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        {customer.status !== "deleted" && (
                          <button
                            onClick={() => handleDelete(customer.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                            title="Delete"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && customers.length === 0 && !error && (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-gray-500">No customers found. Click "Add Customer" to get started.</p>
        </div>
      )}

      {/* Modal Overlay */}
      {showForm && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={resetForm}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl">
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-t-2xl p-5 text-white">
                <h3 className="text-lg font-bold">
                  {editingId ? "Edit Customer" : "Add New Customer"}
                </h3>
                <p className="text-sm text-teal-100 mt-0.5">
                  {editingId ? "Update customer information" : "Fill in customer details"}
                </p>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200"
                    placeholder="Enter customer name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200"
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200"
                    rows="2"
                    placeholder="Enter address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Milk Type *
                  </label>
                  <select
                    value={formData.milk_type}
                    onChange={(e) => setFormData({ ...formData, milk_type: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200 bg-white"
                  >
                    <option value="">Select Milk Type</option>
                    {milkTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Rate (₹ per litre) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200"
                    placeholder="Enter rate"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Delivery Partner
                  </label>
                  <select
                    value={formData.delivery_partner_id}
                    onChange={(e) => setFormData({ ...formData, delivery_partner_id: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200 bg-white"
                  >
                    <option value="">Select Partner</option>
                    {partners.map((partner) => (
                      <option key={partner.id} value={partner.id}>{partner.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Previous Balance
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.previous_balance}
                    onChange={(e) => setFormData({ ...formData, previous_balance: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200"
                    placeholder="0.00"
                  />
                </div>

                {editingId && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200 bg-white"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="deleted">Deleted</option>
                    </select>
                  </div>
                )}

                {/* Modal Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 rounded-xl font-medium hover:bg-gray-200 active:scale-95 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl font-medium hover:from-teal-700 hover:to-cyan-700 active:scale-95 transition-all duration-200 shadow-md disabled:opacity-50"
                  >
                    {loading ? "Saving..." : (editingId ? "Update" : "Create")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default CustomersTable;