import { createContext, useState, useContext } from "react"

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token"))
  const [role, setRole] = useState(localStorage.getItem("role"))
  const [partnerID, setPartnerID] = useState(localStorage.getItem("partnerID"))
  const [loading, setLoading] = useState(true); // Add a loading state

  useEffect(() => {
    // Verify tokens exist on initial load
    const storedToken = localStorage.getItem("token");
    const storedRole = localStorage.getItem("role");
    
    if (storedToken && storedRole) {
      setToken(storedToken);
      setRole(storedRole);
    }
    setLoading(false); // Done checking localStorage
  }, []);
  
  // function login(receivedToken, receivedRole) {
  //   const payload = JSON.parse(atob(receivedToken.split(".")[1]))
  //   const receivedPartnerID = payload.delivery_partner_id
  //   // console.log(receivedPartnerID)

  //   setToken(receivedToken)
  //   setRole(receivedRole)
  //   setPartnerID(receivedPartnerID)
  //   localStorage.setItem("token", receivedToken)
  //   localStorage.setItem("role", receivedRole)
  //   localStorage.setItem("partnerID", receivedPartnerID)
  // }
  
  // function logout() {
  //   setToken(null)
  //   setRole(null)
  //   setPartnerID(null)
  //   localStorage.removeItem("token")
  //   localStorage.removeItem("role")
  //   localStorage.removeItem("partnerID")
  // }

  const login = (userData) => {
    localStorage.setItem("token", userData.token);
    localStorage.setItem("role", userData.role);
    if (userData.partner_id) {
      localStorage.setItem("partner_id", userData.partner_id);
    }
    setToken(userData.token);
    setRole(userData.role);
    setPartnerID(userData.partner_id);
  };

  const logout = () => {
    localStorage.clear();
    setToken(null);
    setRole(null);
    setPartnerID(null);
  };

  return (
    <AuthContext.Provider value={{ token, role, partnerID, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}