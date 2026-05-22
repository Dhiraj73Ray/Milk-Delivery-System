import { Routes, Route } from "react-router-dom"
import LoginPage from "./pages/LoginPage"
import DashboardPage from "./pages/DashboardPage"
import PartnerPage from "./pages/PartnerPage"
import ProtectedRoute from "./components/ProtectedRoute"
import PartnerMobile from "./components/PartnerMobile"
// import MobileTest from "./components/MobileTest"

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={
        <ProtectedRoute allowedRole="admin">
          <DashboardPage />
        </ProtectedRoute>
      } />
      <Route path="/partner" element={
        <ProtectedRoute allowedRole="delivery_partner">
          {/* <PartnerPage /> */}
          <PartnerMobile />
        </ProtectedRoute>
      } />
    </Routes>
  )
}

export default App