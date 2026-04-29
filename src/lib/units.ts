
export const convertToBaseUnit = (quantity: number, fromUnit: string, toUnit: string): number => {
    if (fromUnit === toUnit) return quantity;

    // Convert everything to a base (g or ml)
    let valueInBase = quantity;
    if (fromUnit === 'kg' || fromUnit === 'L') valueInBase = quantity * 1000;
    
    // Now convert from base to target
    if (toUnit === 'kg' || toUnit === 'L') return valueInBase / 1000;
    
    return valueInBase;
};

export const convertUnits = convertToBaseUnit;
