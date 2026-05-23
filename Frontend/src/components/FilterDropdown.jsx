// FilterDropdown.jsx - Enhanced Version
import React, { useState, useRef, useEffect } from 'react'

function FilterDropdown({ label, value, options, onChange, placeholder }) {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSelect = (option) => {
        onChange(option)
        setIsOpen(false)
    }

    const selectedLabel = value ? options.find(opt => opt === value) || value : `All ${label}s`

    return (
        <div className="w-full" ref={dropdownRef}>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
                {label}
            </label>
            
            {/* Custom Select Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200 bg-white flex items-center justify-between hover:border-purple-300"
            >
                <span className={`text-sm ${!value ? 'text-gray-500' : 'text-gray-800'}`}>
                    {selectedLabel}
                </span>
                <svg className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 mt-2 w-full min-w-[200px] bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-slideDown">
                    <div className="max-h-60 overflow-y-auto">
                        {/* All option */}
                        <button
                            onClick={() => handleSelect('')}
                            className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors duration-150 flex items-center gap-2 ${
                                !value ? 'bg-purple-50 text-purple-700 font-medium' : 'text-gray-700'
                            }`}
                        >
                            {!value && (
                                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                            <span className={!value ? 'ml-6' : 'ml-0'}>All {label}s</span>
                        </button>
                        
                        {/* Options list */}
                        {options.map(option => (
                            <button
                                key={option}
                                onClick={() => handleSelect(option)}
                                className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors duration-150 flex items-center gap-2 ${
                                    value === option ? 'bg-purple-50 text-purple-700 font-medium' : 'text-gray-700'
                                }`}
                            >
                                {value === option && (
                                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                                <span className={value === option ? 'ml-6' : 'ml-0'}>{option}</span>
                            </button>
                        ))}
                    </div>
                    
                    {/* Clear button when something is selected */}
                    {value && (
                        <div className="border-t border-gray-100 p-2 bg-gray-50">
                            <button
                                onClick={() => handleSelect('')}
                                className="w-full px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 transition-colors duration-150 flex items-center justify-center gap-1"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Clear selection
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default FilterDropdown