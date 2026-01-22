export const formatPrice = (value) => {
  if (!value) return "0";
  // Format with commas for display
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export const parsePrice = (value) => {
  if (!value) return 0;
  // Remove commas for storage/calculation
  return parseFloat(value.toString().replace(/,/g, "")) || 0;
};

export const valueChange = (value, fn) => {
  const rawValue = value.floatValue || 0;
  fn();
};
