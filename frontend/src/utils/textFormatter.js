// Truncate text
export const truncateText = (str, maxLength) => {
  return str?.length > maxLength ? `${str.substring(0, maxLength)}...` : str;
};
