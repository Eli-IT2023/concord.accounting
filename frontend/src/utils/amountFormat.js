const formatAmount = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "0.00";
  }

  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export default formatAmount;
