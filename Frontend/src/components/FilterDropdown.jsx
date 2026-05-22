// FilterDropdown.jsx
function FilterDropdown({ label, value, options, onChange }) {
    return (
        <div style={{ marginBottom: '10px', display: 'inline-block', marginRight: '10px' }}>
            <label>{label}: </label>
            <select value={value} onChange={(e) => onChange(e.target.value)}>
                <option value="">All {label}s</option>
                {options.map(option => (
                    <option key={option} value={option}>{option}</option>
                ))}
            </select>
        </div>
    )
}

export default FilterDropdown