import { Routes, Route } from "react-router-dom"
import LoginPage from "./pages/LoginPage"
import DashboardPage from "./pages/DashboardPage"
import PartnerPage from "./pages/PartnerPage"
import ProtectedRoute from "./components/ProtectedRoute"
import PartnerMobile from "./components/PartnerMobile"
// import MobileTest from "./components/MobileTest"
import { Routes, Route, Navigate } from "react-router-dom"
import { useAuth } from "./context/AuthContext"

function App() {
  const { token, role } = useAuth()

  return (
    <Routes>
      {/* Root Path Smart Redirect */}
      <Route path="/" element={
        token ? (
          role === "admin" ? <Navigate to="/dashboard" replace /> : <Navigate to="/partner" replace />
        ) : (
          <LoginPage />
        )
      } />

      <Route path="/login" element={<LoginPage />} />

      <Route path="/dashboard" element={
        <ProtectedRoute allowedRole="admin">
          <DashboardPage />
        </ProtectedRoute>
      } />

      <Route path="/partner" element={
        <ProtectedRoute allowedRole="delivery_partner">
          <PartnerMobile />
        </ProtectedRoute>
      } />
    </Routes>
  )
}

export default App