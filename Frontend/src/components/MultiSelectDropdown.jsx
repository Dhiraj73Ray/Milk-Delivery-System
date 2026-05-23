import React, { useState, useRef, useEffect } from 'react'

function MultiSelectDropdown({ label, options, selectedValues, onChange, placeholder = "Select..." }) {
    const [isOpen, setIsOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const dropdownRef = useRef(null)

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false)
                setSearchTerm('')
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const toggleOption = (value) => {
        if (selectedValues.includes(value)) {
            onChange(selectedValues.filter(v => v !== value))
        } else {
            onChange([...selectedValues, value])
        }
    }

    const selectAll = () => {
        onChange([...filteredOptions])
    }

    const clearAll = () => {
        onChange([])
    }

    const filteredOptions = options.filter(option =>
        option.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const displayText = selectedValues.length === 0 
        ? placeholder 
        : `${selectedValues.length} selected`

    const isAllSelected = filteredOptions.length > 0 && filteredOptions.every(opt => selectedValues.includes(opt))

    return (
        <div className="relative w-full" ref={dropdownRef}>
            {/* Dropdown Trigger Button */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {label}
                </label>
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200 bg-white flex items-center justify-between hover:border-purple-300"
                >
                    <div className="flex items-center gap-2">
                        {selectedValues.length > 0 && (
                            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-purple-600 rounded-full">
                                {selectedValues.length}
                            </span>
                        )}
                        <span className={`text-sm ${selectedValues.length === 0 ? 'text-gray-500' : 'text-gray-800 font-medium'}`}>
                            {displayText}
                        </span>
                    </div>
                    <svg className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-slideDown">
                    {/* Search Bar */}
                    <div className="p-3 border-b border-gray-100">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Search options..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200"
                            />
                        </div>
                    </div>

                    {/* Header with Select All/Clear All */}
                    <div className="bg-gray-50 px-3 py-2 border-b border-gray-100 flex gap-2">
                        <button
                            type="button"
                            onClick={selectAll}
                            className="flex-1 px-2 py-1.5 text-xs font-medium text-purple-600 bg-white rounded-lg hover:bg-purple-50 active:scale-95 transition-all duration-200"
                        >
                            {isAllSelected ? '✓ All Selected' : 'Select All'}
                        </button>
                        <button
                            type="button"
                            onClick={clearAll}
                            className="flex-1 px-2 py-1.5 text-xs font-medium text-gray-600 bg-white rounded-lg hover:bg-gray-50 active:scale-95 transition-all duration-200"
                        >
                            Clear All
                        </button>
                    </div>

                    {/* Options List */}
                    <div className="max-h-60 overflow-y-auto">
                        {filteredOptions.length === 0 ? (
                            <div className="px-4 py-8 text-center text-gray-500 text-sm">
                                {searchTerm ? 'No matching options' : 'No options available'}
                            </div>
                        ) : (
                            filteredOptions.map(option => (
                                <label
                                    key={option}
                                    onClick={() => toggleOption(option)}
                                    className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors duration-150 ${
                                        selectedValues.includes(option) 
                                            ? 'bg-purple-50 hover:bg-purple-100' 
                                            : 'hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            checked={selectedValues.includes(option)}
                                            onChange={() => {}}
                                            className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500 cursor-pointer"
                                        />
                                    </div>
                                    <span className={`text-sm flex-1 ${
                                        selectedValues.includes(option) 
                                            ? 'text-purple-700 font-medium' 
                                            : 'text-gray-700'
                                    }`}>
                                        {option}
                                    </span>
                                </label>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-gray-100 px-3 py-2 bg-gray-50 flex justify-between items-center">
                        <p className="text-xs text-gray-600">
                            {selectedValues.length} selected
                        </p>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="text-xs text-purple-600 font-medium hover:text-purple-700"
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default MultiSelectDropdown