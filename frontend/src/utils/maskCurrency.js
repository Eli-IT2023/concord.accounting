const maskCurrency = (value) => {
  return Number(value)
    .toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    .replace(/[0-9]/g, "*");
};

export default maskCurrency;
