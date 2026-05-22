import { useState } from "react"
import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom"
import LogDeliveryForm from "./LogDeliveryForm"
import MyLogs from "./MyLogs"
import MyCustomersTable from "./MyCustomersTable"

function PartnerMobile() {
  const [activeTab, setActiveTab] = useState("customers")
  const { partnerName, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate("/login")
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      {/* Mobile Sticky Header */}
      <header className="bg-[#2c3e50] text-white sticky top-0 z-20 shadow-lg">
        <div className="flex justify-between items-center p-4">
          <div>
            <h1 className="text-xl font-bold tracking-wide">Milk Delivery</h1>
            <p className="text-xs opacity-80 mt-0.5">Partner: {partnerName || "Delivery Agent"}</p>
          </div>
          {/* Added Logout button for mobile layout optimization */}
          <button 
            onClick={handleLogout}
            className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-xs font-semibold rounded shadow transition-all active:scale-95"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Container - Renders Active Workflow */}
      <main className="p-4">
        {activeTab === "customers" && <MyCustomersTable />}
        {activeTab === "log" && <LogDeliveryForm />}
        {activeTab === "logs" && <MyLogs />}
      </main>

      {/* Bottom Sticky Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-20 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around py-1.5">
          <button 
            onClick={() => setActiveTab("customers")}
            className={`flex flex-col items-center w-full py-1 transition-all ${
              activeTab === "customers" ? "text-[#2c3e50] font-semibold" : "text-gray-400"
            }`}
          >
            <span className="text-xl mb-0.5">👥</span>
            <span className="text-[11px]">Customers</span>
          </button>
          <button 
            onClick={() => setActiveTab("log")}
            className={`flex flex-col items-center w-full py-1 transition-all ${
              activeTab === "log" ? "text-[#2c3e50] font-semibold" : "text-gray-400"
            }`}
          >
            <span className="text-xl mb-0.5">📝</span>
            <span className="text-[11px]">Log</span>
          </button>
          <button 
            onClick={() => setActiveTab("logs")}
            className={`flex flex-col items-center w-full py-1 transition-all ${
              activeTab === "logs" ? "text-[#2c3e50] font-semibold" : "text-gray-400"
            }`}
          >
            <span className="text-xl mb-0.5">📋</span>
            <span className="text-[11px]">Logs</span>
          </button>
        </div>
      </nav>
    </div>
  )
}

export default PartnerMobile