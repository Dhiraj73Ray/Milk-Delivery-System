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
    const [isLoading, setIsLoading] = useState(false)

    const call_partners = () => {
        api.get("/delivery-partners")
            .then(res => {
                setPartners(res.data)
            })
            .catch(err => {
                console.error("Failed to fetch partners:", err)
            })
    }

    useEffect(() => {
        if (role === "delivery_partner") {
            call_partners()
        }
    }, [role])

    const handleRoleChange = (event) => {
        setRole(event.target.value)
        if (event.target.value !== "delivery_partner") {
            setName("")
            setPhone("")
            setDeliveryPartnerId("")
        }
    }

    async function handleSignUp() {
        if (!name.trim()) {
            setError("Name is required")
            return
        }
        if (!phone.trim()) {
            setError("Phone number is required")
            return
        }
        if (!password.trim()) {
            setError("Password is required")
            return
        }
        if (role === "delivery_partner" && !deliveryPartnerId) {
            setError("Please select a delivery partner")
            return
        }

        setIsLoading(true)
        setError(null)
        setSuccessMsg(null)

        try {
            const response = await api.post("/auth/users", {
                name: name,
                phone: phone,
                password: password,
                role: role,
                delivery_partner_id: role === "delivery_partner" ? parseInt(deliveryPartnerId) : null
            })
            setSuccessMsg("User created successfully!")
            
            // reset form
            setName("")
            setPhone("")
            setPassword("")
            setRole("delivery_partner")
            setDeliveryPartnerId("")
            
            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMsg(null), 3000)
        } catch (err) {
            setError(err.response?.data?.detail || "Failed to create user")
            setTimeout(() => setError(null), 5000)
        } finally {
            setIsLoading(false)
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
        <div className="space-y-4">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-4 text-white">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Create New User</h2>
                        <p className="text-sm text-blue-100 mt-0.5">Add admin or delivery partner accounts</p>
                    </div>
                </div>
            </div>

            {/* Form Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                {/* Role Selection */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                        User Role
                    </label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="radio"
                                name="role"
                                value="admin"
                                checked={role === "admin"}
                                onChange={handleRoleChange}
                                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-gray-700 group-hover:text-blue-600 transition-colors">
                                Admin
                            </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="radio"
                                name="role"
                                value="delivery_partner"
                                checked={role === "delivery_partner"}
                                onChange={handleRoleChange}
                                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-gray-700 group-hover:text-blue-600 transition-colors">
                                Delivery Partner
                            </span>
                        </label>
                    </div>
                </div>

                {/* Delivery Partner Selection */}
                {role === "delivery_partner" && (
                    <div className="mb-5 animate-slideDown">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Select Delivery Partner
                        </label>
                        <select
                            value={deliveryPartnerId}
                            onChange={handlePartnerSelect}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-white"
                        >
                            <option value="">-- Select Partner --</option>
                            {partners.map(part => (
                                <option key={part.id} value={part.id}>{part.name}</option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1.5">
                            Selecting a partner will auto-fill name and phone
                        </p>
                    </div>
                )}

                {/* Name Field - Shows for Admin or when no partner selected */}
                {(role !== "delivery_partner" || (role === "delivery_partner" && !deliveryPartnerId)) && (
                    <div className="mb-5">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Full Name
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter full name"
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                            />
                        </div>
                    </div>
                )}

                {/* Phone Field - Shows for Admin or when no partner selected */}
                {(role !== "delivery_partner" || (role === "delivery_partner" && !deliveryPartnerId)) && (
                    <div className="mb-5">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Phone Number
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                            </div>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="Enter phone number"
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                            />
                        </div>
                    </div>
                )}

                {/* Password Field */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Password
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-1.5">
                        Minimum 6 characters recommended
                    </p>
                </div>

                {/* Success Message */}
                {successMsg && (
                    <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-2 animate-shake">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{successMsg}</span>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 animate-shake">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                {/* Submit Button */}
                <button
                    onClick={handleSignUp}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 active:scale-95 transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Creating User...</span>
                        </div>
                    ) : (
                        'Create User'
                    )}
                </button>
            </div>

            {/* Info Note */}
            <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs text-blue-700">
                        <span className="font-semibold">Note:</span> Delivery partners will be linked to their respective delivery partner account. Admins have full system access.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default CreateUserForm