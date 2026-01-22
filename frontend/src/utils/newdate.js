export const getMonthBoundaries = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const firstDay = new Date(year, month, 1, 0, 0, 0, 0);
  const lastDay = new Date(year, month + 1, 0, 23, 59, 59, 999);

  return {
    start: firstDay,
    end: lastDay,
  };
};

export const initializeCutoff = (boundaries) => {
  return {
    id: "custom",
    from: boundaries.start,
    to: boundaries.end,
  };
};