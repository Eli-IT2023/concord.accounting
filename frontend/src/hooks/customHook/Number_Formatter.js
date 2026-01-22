import { useState, useCallback } from "react";

/**
 * Custom hook for handling numeric input fields with comma formatting and decimal support
 * @param {string|number} initialValue - Initial value for the input
 * @param {number} decimalPlaces - Number of decimal places to allow (default: 2)
 * @returns {[string, function, function]} Returns [formattedValue, handleChange, setValue]
 */
const useFormattedNumberInput = (initialValue = "", decimalPlaces = 2) => {
  const [value, setValue] = useState(initialValue.toString());

  // Format a number string with commas for thousands
  const formatWithCommas = useCallback((numStr) => {
    if (!numStr) return "";

    // Handle numbers with decimal points
    if (numStr.includes(".")) {
      const [integerPart, decimalPart] = numStr.split(".");

      // Format integer part with commas
      const formattedInteger = integerPart.replace(
        /\B(?=(\d{3})+(?!\d))/g,
        ","
      );

      // Combine with decimal part
      return `${formattedInteger}.${decimalPart}`;
    }

    // Format numbers without decimal points
    return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }, []);

  // Remove formatting to get raw value
  const unformat = useCallback((formattedValue) => {
    return formattedValue.replace(/,/g, "");
  }, []);

  // Handle input change
  const handleChange = useCallback(
    (e) => {
      const inputValue = e.target.value;
      const unformattedValue = unformat(inputValue);

      // Only allow digits and a single decimal point
      if (!/^$|^[0-9]+(\.[0-9]*)?$/.test(unformattedValue)) {
        return;
      }

      // Check decimal places limit
      if (unformattedValue.includes(".")) {
        const [, decimals] = unformattedValue.split(".");
        if (decimals && decimals.length > decimalPlaces) {
          return;
        }
      }

      // Update with formatted value
      setValue(unformattedValue);
    },
    [unformat, decimalPlaces]
  );

  // Get displayed value with proper formatting
  const displayValue = formatWithCommas(value);

  // Function to programmatically set the value
  const setFormattedValue = useCallback(
    (newValue) => {
      if (typeof newValue === "number") {
        setValue(newValue.toString());
      } else {
        setValue(unformat(newValue));
      }
    },
    [unformat]
  );

  return [displayValue, handleChange, setFormattedValue];
};

export default useFormattedNumberInput;
