import { useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { useAuth } from "../context/AuthContext"
import api from "../api"

function LoginPage() {
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState(null)

  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleLogin() {
    try {
      const response = await api.post("/auth/login", {
        phone: phone,
        password: password,
      })

      // console.log("response data: ", response.data)

      const token = response.data.access_token
      const role = response.data.role

      // console.log("token:", token)
      // console.log("role:", role)

      login(token, role)
      
      // console.log("navigating to dashboard")
      if (role === "admin") {
        navigate("/dashboard")
      } else {
        navigate("/partner")
      }

    } catch (err) {
      setError("Invalid phone or password")
    }
  }

  return (
    <div>
      <h2>MDS Login</h2>
      <input
        type="text"
        placeholder="Phone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleLogin}>Login</button>
      {error && <p>{error}</p>}
    </div>
  )
}

export default LoginPage