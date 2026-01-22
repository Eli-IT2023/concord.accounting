// Validate file template for migration
export const isFileTemplateValid = (data, requiredColumns) => {
  if (data.length === 0) return false;

  const dataKeys = Object.keys(data[0]);

  const uniqueDataKeys = new Set(Object.keys(data[0]));

  if (requiredColumns.length !== dataKeys.length) return false;

  return requiredColumns.every((col) => uniqueDataKeys.has(col));
};
