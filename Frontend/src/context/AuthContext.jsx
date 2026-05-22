import { createContext, useState, useContext } from "react"

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token"))
  const [role, setRole] = useState(localStorage.getItem("role"))
  const [partnerID, setPartnerID] = useState(localStorage.getItem("partnerID"))
  
  function login(receivedToken, receivedRole) {
    const payload = JSON.parse(atob(receivedToken.split(".")[1]))
    const receivedPartnerID = payload.delivery_partner_id
    // console.log(receivedPartnerID)

    setToken(receivedToken)
    setRole(receivedRole)
    setPartnerID(receivedPartnerID)
    localStorage.setItem("token", receivedToken)
    localStorage.setItem("role", receivedRole)
    localStorage.setItem("partnerID", receivedPartnerID)
  }
  
  function logout() {
    setToken(null)
    setRole(null)
    setPartnerID(null)
    localStorage.removeItem("token")
    localStorage.removeItem("role")
    localStorage.removeItem("partnerID")
  }

  return (
    <AuthContext.Provider value={{ token, role, partnerID, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}