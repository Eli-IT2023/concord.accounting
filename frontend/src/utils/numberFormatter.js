// export const compactNumberFormat = (number) => {
//   return new Intl.NumberFormat("en", {
//     notation: "compact",
//     compactDisplay: "short",
//     maximumFractionDigits: 2,
//   }).format(number);
// };

export const compactNumberFormat = (num) => {
  if (num === null || num === undefined || isNaN(num)) return "0";

  const absNum = Math.abs(num);
  let formatted;
  let suffix = "";

  const truncate = (number, digits) => {
    const factor = Math.pow(10, digits);
    return Math.floor(number * factor) / factor;
  };

  if (absNum >= 1_000_000_000_000) {
    formatted = truncate(num / 1_000_000_000_000, 2);
    suffix = "T";
  } else if (absNum >= 1_000_000_000) {
    formatted = truncate(num / 1_000_000_000, 2);
    suffix = "B";
  } else if (absNum >= 1_000_000) {
    formatted = truncate(num / 1_000_000, 2);
    suffix = "M";
  } else if (absNum >= 1_000) {
    formatted = truncate(num / 1_000, 2);
    suffix = "K";
  } else {
    formatted = truncate(num, 2).toFixed(2);
  }

  return `${formatted}${suffix}`;
};

// Truncates a number to two decimal places without rounding (e.g., 234.1999 -> 234.19).
export const truncateToTwoDecimals = (num) => {
  const removeComma = parseFloat(String(num).replace(/,/g, "")); // Remove comma from number
  const sanitizedNumber = typeof num === "string" ? removeComma : num; // Check for type

  const roundToTwo = Math.trunc(sanitizedNumber * 100) / 100;

  const [integer, decimal] = String(roundToTwo).split(".");

  const formatWithDecimal = decimal
    ? numberWithComma(roundToTwo)
    : `${numberWithComma(roundToTwo)}.00`;
  return roundToTwo === 0 ? "0.00" : formatWithDecimal;
};

const numberWithComma = (num) => {
  if (num === null) return "";

  const [intPart, decimalPart] = String(num).split(".");

  // Add commas to integer part
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  // Join back decimal part if it exists
  const formatted =
    decimalPart !== undefined
      ? `${withCommas}.${decimalPart.padEnd(2, "0")}`
      : withCommas;

  return formatted;
};

const currencySymbol = {
  PHP: "₱",
  JPY: "¥",
  USD: "$",
  EUR: "€",
  HKD: "HK$",
  CNY: "CN¥",
};

// Get Currency symbol
export const getCurrencySymbol = (currencyData, currencyId) => {
  const currencyName = currencyData.find(
    (item) => item.id === currencyId
  )?.currency_name;

  return currencySymbol[currencyName || "PHP"];
};
