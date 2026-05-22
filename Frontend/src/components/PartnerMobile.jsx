import { useState, useEffect } from "react"
import api from "../api"
import { useAuth } from "../context/AuthContext"
import LogDeliveryForm from "./LogDeliveryForm"
import MyLogs from "./MyLogs"
import MyCustomersTable from "./MyCustomersTable"

function PartnerMobile() {
  const [activeTab, setActiveTab] = useState("customers")
  const { partnerName } = useAuth()

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <header className="bg-[#2c3e50] text-white sticky top-0 z-20 shadow-lg">
        <div className="flex justify-between items-center p-4">
          <div>
            <h1 className="text-xl font-bold">Milk Delivery</h1>
            <p className="text-sm opacity-90 mt-1">Welcome, {partnerName || "Partner"}</p>
          </div>
        </div>
      </header>

      {/* Content - Reusing existing components */}
      <main className="p-4">
        {activeTab === "customers" && <MyCustomersTable />}
        {activeTab === "log" && <LogDeliveryForm />}
        {activeTab === "logs" && <MyLogs />}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="flex justify-around py-2">
          <button 
            onClick={() => setActiveTab("customers")}
            className={`flex flex-col items-center p-2 ${activeTab === "customers" ? "text-[#2c3e50] border-t-2 border-[#2c3e50]" : "text-gray-500"}`}
          >
            <span className="text-2xl">👥</span>
            <span className="text-xs mt-1">Customers</span>
          </button>
          <button 
            onClick={() => setActiveTab("log")}
            className={`flex flex-col items-center p-2 ${activeTab === "log" ? "text-[#2c3e50] border-t-2 border-[#2c3e50]" : "text-gray-500"}`}
          >
            <span className="text-2xl">📝</span>
            <span className="text-xs mt-1">Log</span>
          </button>
          <button 
            onClick={() => setActiveTab("logs")}
            className={`flex flex-col items-center p-2 ${activeTab === "logs" ? "text-[#2c3e50] border-t-2 border-[#2c3e50]" : "text-gray-500"}`}
          >
            <span className="text-2xl">📋</span>
            <span className="text-xs mt-1">Logs</span>
          </button>
        </div>
      </nav>
    </div>
  )
}

export default PartnerMobile