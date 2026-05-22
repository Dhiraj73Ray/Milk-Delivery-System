import React, { useState, useRef, useEffect } from 'react'

function MultiSelectDropdown({ label, options, selectedValues, onChange, placeholder = "Select..." }) {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef(null)

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false)
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
        onChange([...options])
    }

    const clearAll = () => {
        onChange([])
    }

    const displayText = selectedValues.length === 0 
        ? placeholder 
        : `${selectedValues.length} selected`

    return (
        <div style={{ position: 'relative', display: 'inline-block', minWidth: '180px' }} ref={dropdownRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    padding: '5px 10px',
                    cursor: 'pointer',
                    backgroundColor: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}
            >
                <span>{displayText}</span>
                <span>▼</span>
            </div>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: '4px',
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    maxHeight: '250px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    minWidth: '200px'
                }}>
                    <div style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                        <button onClick={selectAll} style={{ marginRight: '8px' }}>Select All</button>
                        <button onClick={clearAll}>Clear All</button>
                    </div>
                    <div style={{ padding: '8px' }}>
                        {options.map(option => (
                            <label key={option} style={{ display: 'block', marginBottom: '5px' }}>
                                <input
                                    type="checkbox"
                                    checked={selectedValues.includes(option)}
                                    onChange={() => toggleOption(option)}
                                    style={{ marginRight: '8px' }}
                                />
                                {option}
                            </label>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default MultiSelectDropdown