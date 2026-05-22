import { useState } from "react"
import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom"
import MyCustomersTable from "../components/MyCustomersTable"
import LogDeliveryForm from "../components/LogDeliveryForm"
import MyLogs from "../components/MyLogs"

function PartnerPage() {
  const { logout, partnerID } = useAuth()
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState("customers")

  function handleLogout() {
    logout()
    navigate("/login")
  }

  const buttonStyle = {
    padding: '8px 16px',
    margin: '0 5px',
    cursor: 'pointer',
    backgroundColor: '#f0f0f0',
    borderWidth: '1px',        // ← instead of 'border'
    borderStyle: 'solid',      // ← instead of 'border'
    borderColor: '#ccc',       // ← instead of 'border'
    borderRadius: '4px'
  }

  const activeButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#007bff',
    color: 'white',
    borderColor: '#007bff'     // ← now this can update safely
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Partner Dashboard</h1>
        <button onClick={handleLogout} style={buttonStyle}>Logout</button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setActiveSection("customers")}
          style={activeSection === "customers" ? activeButtonStyle : buttonStyle}
        >
          My Customers
        </button>
        <button
          onClick={() => setActiveSection("log")}
          style={activeSection === "log" ? activeButtonStyle : buttonStyle}
        >
          Log Delivery
        </button>
        <button
          onClick={() => setActiveSection("logs")}
          style={activeSection === "logs" ? activeButtonStyle : buttonStyle}
        >
          My Logs
        </button>
      </div>

      {activeSection === "customers" && <MyCustomersTable />}
      {activeSection === "log" && <LogDeliveryForm />}
      {activeSection === "logs" && <MyLogs />}
    </div>
  )
}

export default PartnerPage