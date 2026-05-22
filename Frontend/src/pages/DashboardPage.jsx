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


// import { useState } from "react"

function DashboardPage() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState("customers")


  function handleLogout() {
    logout()
    navigate("/login")
  }
  return <div>
    <h1>Admin Dashboard</h1>
    <button onClick={handleLogout}>Logout</button>

    <button onClick={() => setActiveSection("customers")}>Customers</button>
    <button onClick={() => setActiveSection("partners")}>Partners</button>
    <button onClick={() => setActiveSection("users")}>Users</button>
    {/* <button onClick={() => setActiveSection("create_user")}>Create New User</button> */}
    <button onClick={() => setActiveSection("dsr")}>DSR Table</button>
    <button onClick={() => setActiveSection('bills')}>Bills</button>
    <button onClick={() => setActiveSection('payments')}>Payments</button>


    {activeSection === "customers" && <CustomersTable />}
    {activeSection === "partners" && <PartnersTable />}
    {activeSection === "users" && <UsersTable />}
    {/* {activeSection === "create_user" && <CreateUserForm />} */}
    {activeSection === "dsr" && <DSRTable />}
    {activeSection === 'bills' && <BillsTable />}
    {activeSection === 'payments' && <PaymentsTable />}


    
  </div>
}

export default DashboardPage