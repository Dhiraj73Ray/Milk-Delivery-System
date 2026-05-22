import React, { useEffect, useState } from 'react'
import api from '../api'

function CreateUserForm() {
    const [name, setName] = useState("")
    const [phone, setPhone] = useState("")
    const [password, setPassword] = useState("")
    const [role, setRole] = useState("delivery_partner")
    const [partners, setPartners] = useState([])
    const [deliveryPartnerId, setDeliveryPartnerId] = useState("")
    const [successMsg, setSuccessMsg] = useState(null)
    const [error, setError] = useState(null)


    const call_partners = () => {
        api.get("/delivery-partners")
            .then(res => {
                setPartners(res.data)
            })
    }

    useEffect(() => {
        if (role === "delivery_partner") {
            call_partners()
        }
    }, [])

    const handleChange = (event) => {
        setRole(event.target.value)
        if (event.target.value == "delivery_partner") {
            call_partners()
        }
    }

    async function handleSignUp() {
        try {
            const response = await api.post("/auth/users", {
                name: name,
                phone: phone,
                password: password,
                role: role,
                delivery_partner_id: role === "delivery_partner" ? parseInt(deliveryPartnerId) : null
            })
            setSuccessMsg("User created successfully!")
            setError(null)

            // reset form
            setName("")
            setPhone("")
            setPassword("")
            setRole("delivery_partner")
            setDeliveryPartnerId("")
        } catch (err) {
            setError(err.response?.data?.detail || "Failed to create user")
            setSuccessMsg(null)
        }
    }

    function handlePartnerSelect(e) {
        const selectedId = e.target.value
        setDeliveryPartnerId(selectedId)

        const selectedPartner = partners.find(p => p.id === parseInt(selectedId))
        if (selectedPartner) {
            setName(selectedPartner.name)
            setPhone(selectedPartner.phone)
        }
    }
    return (
        <div>
            <h2>Create User</h2>

            {/* Role selection — always visible */}
            <label>Role:</label>
            <input type="radio" name="role" value="admin" checked={role === "admin"} onChange={handleChange} /> Admin
            <input type="radio" name="role" value="delivery_partner" checked={role === "delivery_partner"} onChange={handleChange} /> Delivery Partner

            <br />

            {/* Only shows for delivery_partner */}
            {(role === "delivery_partner") ? (
                <select value={deliveryPartnerId} onChange={handlePartnerSelect}>
                    <option value="">-- Select Partner --</option>
                    {partners.map(part => (
                        <option key={part.id} value={part.id}>{part.name}</option>
                    ))}
                </select>
            ) : (<>
                <label>Name:</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} />

                <label>Phone:</label>
                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </>
            )}
            <br />
            <label>Password:</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <br />
            <button onClick={handleSignUp}>Create User</button>
            {successMsg && <p>{successMsg}</p>}
            {error && <p>{error}</p>}
        </div>
    )
}

export default CreateUserForm