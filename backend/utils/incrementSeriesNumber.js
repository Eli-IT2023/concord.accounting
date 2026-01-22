function incrementSeriesNumber(currentValue) {
  const number = parseInt(currentValue, 10);
  const nextNumber = number + 1;
  return nextNumber.toString().padStart(4, "0");
}

module.exports = incrementSeriesNumber;
