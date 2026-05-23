import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import CustomersTable from "../components/CustomersTable"
import PartnersTable from "../components/PartnersTable"
import UsersTable from "../components/UsersTable"
import CreateUserForm from "../components/CreateUserForm"
import DSRTable from "../components/DSRTable"
import BillsTable from '../components/BillsTable'
import PaymentsTable from '../components/PaymentsTable'

function DashboardPage() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState("customers")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate("/login")
  }

  const menuItems = [
    { id: "customers", label: "Customers", icon: "👥" },
    { id: "partners", label: "Partners", icon: "🤝" },
    { id: "users", label: "Users", icon: "👤" },
    { id: "dsr", label: "DSR", icon: "📊" },
    { id: "bills", label: "Bills", icon: "💰" },
    { id: "payments", label: "Payments", icon: "💳" },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">Admin Dashboard</h1>
              <p className="text-xs text-gray-500">Manage your platform</p>
            </div>
          </div>

          {/* Logout Button - Mobile */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-xl active:bg-red-100 transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="text-sm font-medium hidden sm:inline">Logout</span>
          </button>
        </div>

        {/* Mobile Menu Button + Horizontal Scroll Menu */}
        <div className="border-t border-gray-100">
          <div className="relative">
            {/* Horizontal Scroll Menu for Mobile */}
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-1 p-2 min-w-max">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveSection(item.id)
                      setIsMobileMenuOpen(false)
                    }}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm
                      transition-all duration-200 whitespace-nowrap
                      ${activeSection === item.id
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                        : "text-gray-600 hover:bg-gray-100 active:bg-gray-200"
                      }
                    `}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 pb-20">
        {/* Active Section Header */}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            {menuItems.find(item => item.id === activeSection)?.label || "Dashboard"}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage and view all {menuItems.find(item => item.id === activeSection)?.label?.toLowerCase() || "data"}
          </p>
        </div>

        <div
          className="overflow-y-auto"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* Content */}
          {/* Content Container */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4">
              {activeSection === "customers" && <CustomersTable />}
              {activeSection === "partners" && <PartnersTable />}
              {activeSection === "users" && <UsersTable />}
              {activeSection === "dsr" && <DSRTable />}
              {activeSection === 'bills' && <BillsTable />}
              {activeSection === 'payments' && <PaymentsTable />}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation (Optional) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50">
        <div className="flex justify-around items-center p-2">
          {menuItems.slice(0, 4).map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`
                flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200
                ${activeSection === item.id
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-500 active:bg-gray-100"
                }
              `}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
          <button
            onClick={handleLogout}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-red-500 active:bg-red-50 transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="text-xs font-medium">Exit</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage