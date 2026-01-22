// Custom style for dropdown select
export const selectCustomStyles = (
  selectedValue,
  validated = false,
  inputPadding = "0",
  width
) => ({
  control: (base, state) => {
    const borderColor =
      validated && !state.isDisabled
        ? validated && selectedValue
          ? "1px solid #198754" // green (valid)
          : "1px solid #dc3545" // red (invalid)
        : state.isFocused
        ? "1px solid #86b7fe" // blue (default when focused)
        : "1px solid #dee2e6"; // grey (default)

    const boxShadow =
      state.isFocused && !validated
        ? "0 0 0 0.2rem rgba(13, 110, 253, 0.25)" // red (invalid)
        : state.isFocused && validated && selectedValue
        ? "0 0 0 0.2rem rgba(25, 135, 84, 0.25)" // green (valid)
        : state.isFocused
        ? "0 0 0 0.2rem rgba(220, 53, 69, 0.25)" // blue (default)
        : "none";

    return {
      ...base,
      border: borderColor,
      borderRadius: "0.375rem",
      backgroundColor: state.isDisabled ? "#e9ecef" : "white",
      boxShadow: boxShadow,
      "&:hover": {
        borderColor: borderColor,
      },
      padding: inputPadding,
      ...(width
        ? { width: `${Math.min(width, 42) + 5}ch` }
        : { minWidth: "8rem" }),
    };
  },
  singleValue: (base, state) => ({
    ...base,
    color: "#212529",
  }),
  placeholder: (base, state) => ({
    ...base,
    color: "#212529",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "100%",
  }),
});
