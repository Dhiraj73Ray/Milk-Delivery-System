import { useState } from "react"
import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom"
import MyCustomersTable from "../components/MyCustomersTable"
import LogDeliveryForm from "../components/LogDeliveryForm"
import MyLogs from "../components/MyLogs"

function PartnerPage() {
  const { logout, partnerName } = useAuth()
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState("customers")

  function handleLogout() {
    logout()
    navigate("/login")
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Top Desktop Navigation Bar */}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Partner Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Welcome back, {partnerName || "Partner"}</p>
        </div>
        <button 
          onClick={handleLogout} 
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded transition-colors shadow-sm"
        >
          Logout
        </button>
      </div>

      {/* Tab Switcher Layout */}
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setActiveSection("customers")}
          className={`px-4 py-2 font-medium rounded transition-colors ${
            activeSection === "customers" 
              ? "bg-[#2c3e50] text-white" 
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          👥 My Customers
        </button>
        <button
          onClick={() => setActiveSection("log")}
          className={`px-4 py-2 font-medium rounded transition-colors ${
            activeSection === "log" 
              ? "bg-[#2c3e50] text-white" 
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          📝 Log Delivery
        </button>
        <button
          onClick={() => setActiveSection("logs")}
          className={`px-4 py-2 font-medium rounded transition-colors ${
            activeSection === "logs" 
              ? "bg-[#2c3e50] text-white" 
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          📋 My Logs
        </button>
      </div>

      {/* Active Component Wrapper */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        {activeSection === "customers" && <MyCustomersTable />}
        {activeSection === "log" && <LogDeliveryForm />}
        {activeSection === "logs" && <MyLogs />}
      </div>
    </div>
  )
}

export default PartnerPage