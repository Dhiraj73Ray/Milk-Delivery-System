import { useState } from 'react';

/**
 * Custom hook for managing a quantity input that increments/decrements 
 * by 0.5 steps via arrow keys but allows custom typing with a hard minimum floor.
 * 
 * @param {string} initialValue - Initial value for the input
 * @param {number} minFloor - Absolute minimum value allowed (e.g., 0.1)
 * @param {string} defaultSnap - Fallback value if user leaves it below floor (e.g., '0.5')
 */
export function useQuantityInput(initialValue = '', minFloor = 0.1, defaultSnap = '0.5') {
    const [quantity, setQuantity] = useState(initialValue);

    const handleChange = (e) => {
        const valStr = e.target.value;
        
        // Allow user to empty the field to start typing fresh
        if (valStr === '') {
            setQuantity('');
            return;
        }

        const value = parseFloat(valStr);
        // Instantly reject negative numbers while typing
        if (value < 0) return;

        setQuantity(valStr);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault(); // Override native broken HTML stepping
            
            const currentVal = parseFloat(quantity) || 0;
            let newVal;

            if (e.key === 'ArrowUp') {
                // Round to next clean 0.5 step up
                newVal = Math.floor(currentVal * 2) / 2 + 0.5;
            } else if (e.key === 'ArrowDown') {
                // Round to next clean 0.5 step down
                newVal = Math.ceil(currentVal * 2) / 2 - 0.5;
            }

            // Stop arrow keys from going below the absolute floor
            if (newVal < minFloor) {
                newVal = parseFloat(defaultSnap);
            }

            setQuantity(newVal.toString());
        }
    };

    const handleBlur = (e) => {
        const value = parseFloat(e.target.value);
        if (isNaN(value)) return;

        // If they click away while value is below floor, snap to safety default
        if (value < minFloor) {
            setQuantity(defaultSnap);
        }
    };

    return {
        value: quantity,
        setValue: setQuantity, // Useful if you need to set it manually from a useEffect
        inputProps: {
            type: 'number',
            value: quantity,
            onChange: handleChange,
            onKeyDown: handleKeyDown,
            onBlur: handleBlur,
            placeholder: defaultSnap,
            required: true
        }
    };
}