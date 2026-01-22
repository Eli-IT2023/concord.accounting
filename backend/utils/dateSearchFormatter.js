const moment = require("moment");

function normalizeDateSearch(input) {
  if (!input) return null;

  const currentYear = new Date().getFullYear();
  input = input.trim();

  // Valid month abbreviations
  const validMonths = [
    "jan",
    "feb",
    "mar",
    "apr",
    "may",
    "jun",
    "jul",
    "aug",
    "sep",
    "oct",
    "nov",
    "dec",
  ];

  // Helper function to validate month
  function isValidMonth(monthStr) {
    return validMonths.includes(monthStr.toLowerCase());
  }

  // Helper function to validate year (reasonable range)
  function isValidYear(year) {
    const yearNum = parseInt(year);
    return yearNum >= 1900 && yearNum <= currentYear + 10;
  }

  // 1. Date-only match — "Jun/18" or "Jun/18/2025"
  const dateOnlyMatch = input.match(/^([A-Za-z]{3})\/(\d{1,2})(?:\/(\d{4}))?$/);
  if (dateOnlyMatch) {
    const [, mon, day, year] = dateOnlyMatch;

    // Validate month
    if (!isValidMonth(mon)) return null;

    // Validate year if provided
    const targetYear = year || currentYear;
    if (year && !isValidYear(year)) return null;

    const parsed = moment(`${mon}/${day}/${targetYear}`, "MMM/DD/YYYY", true);
    return parsed.isValid() ? parsed.format("YYYY-MM-DD") : null;
  }

  // 2. ISO date input — "2025-06-18"
  const isoMatch = input.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;

    // Validate year
    if (!isValidYear(year)) return null;

    // Validate month (1-12)
    const monthNum = parseInt(month);
    if (monthNum < 1 || monthNum > 12) return null;

    // Validate day (basic check, moment will do detailed validation)
    const dayNum = parseInt(day);
    if (dayNum < 1 || dayNum > 31) return null;

    const parsed = moment(input, "YYYY-MM-DD", true);
    return parsed.isValid() ? parsed.format("YYYY-MM-DD") : null;
  }

  // 3. Try other common date formats as fallback
  const flexibleFormats = [
    "MM/DD/YYYY",
    "DD/MM/YYYY",
    "YYYY/MM/DD",
    "MM-DD-YYYY",
    "DD-MM-YYYY",
  ];

  for (const format of flexibleFormats) {
    const parsed = moment(input, format, true);
    if (parsed.isValid()) {
      // Additional validation for reasonable dates
      const year = parsed.year();
      if (year < 1900 || year > currentYear + 10) continue;

      return parsed.format("YYYY-MM-DD");
    }
  }

  return null;
}

module.exports = normalizeDateSearch;
