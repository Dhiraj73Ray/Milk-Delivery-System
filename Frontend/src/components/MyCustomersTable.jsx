import { useEffect, useState } from "react"
import api from "../api"
import useIsMobile from "../hooks/useIsMobile"

function MyCustomersTable() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const isMobile = useIsMobile()

  useEffect(() => {
    api.get("/customers/my/list")
      .then(res => {
        setCustomers(res.data)
        setLoading(false)
      })
      .catch(err => {
        setError("Failed to load customers")
        setLoading(false)
      })
  }, [])

  if (loading) return <p>Loading...</p>
  if (error) return <p>{error}</p>

  // Mobile View - Card Layout
  if (isMobile) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span>👥</span> My Customers ({customers.length})
        </h2>
        {customers.length === 0 ? (
          <div className="text-center py-10 text-gray-500">No customers assigned yet</div>
        ) : (
          <div className="space-y-3">
            {customers.map(customer => (
              <div key={customer.id} className="border rounded-lg p-4 bg-gray-50">
                <p className="font-semibold text-gray-800">{customer.name}</p>
                <div className="mt-2 text-sm text-gray-600 space-y-1">
                  <p>📞 {customer.phone || 'No phone'}</p>
                  <p>📍 {customer.address || 'No address'}</p>
                  <p>🥛 {customer.milk_type} • ₹{customer.rate}/L</p>
                  <p>💰 Balance: ₹{customer.previous_balance || 0}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Desktop View - Original Table Layout
  return (
    <div>
      <h2>My Customers</h2>
      <table border="1">
        <thead>
          <tr>
            <th>Customer ID</th>
            <th>Customer Name</th>
            <th>Customer Address</th>
            <th>Phone</th>
            <th>Milk Type</th>
            <th>Rate</th>
            <th>Status</th>
            <th>Prev Balance</th>
          </tr>
        </thead>
        <tbody>
          {customers.map(cust => (
            <tr key={cust.id}>
              <td>{cust.id}</td>
              <td>{cust.name}</td>
              <td>{cust.address}</td>
              <td>{cust.phone}</td>
              <td>{cust.milk_type}</td>
              <td>{cust.rate}</td>
              <td>{cust.status}</td>
              <td>{cust.previous_balance}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default MyCustomersTable