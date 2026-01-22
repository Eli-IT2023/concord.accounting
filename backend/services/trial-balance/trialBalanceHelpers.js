const sequelize = require("../../db/config/sequelize.config");

// prettier-ignore
// For date condition
const createConditions = (startDate, endDate) => {
  return {
    between: `BETWEEN ${sequelize.escape(startDate)} AND ${sequelize.escape(endDate)}`,
    lessThanStart: `< ${sequelize.escape(startDate)}`,
    lessThanEqualEnd: `<= ${sequelize.escape(endDate)}`,
  };
};

// For table column amount calculation
const column = {
  accountList: "accountlist_transaction_subject.amount * currency_rate",
  checkJournal: "amount * currency_rate",
};

// Helper: Builds an SQL SUM() statement for calculating totals
// based on a given date condition and entry type (Debit or Credit).
const sumAccountBalance = (dateCondition, entryType, columnKey) =>
  `
      SUM(
        COALESCE(
          CASE
            WHEN ${dateCondition} AND type = ${sequelize.escape(entryType)} 
            THEN ${column[columnKey]} -- table column
            ELSE 0
          END,
        0)
      )
    `;

// Helper: Calculate other income total amount based on given date
const sumOtherIncome = (dateCondition) =>
  `
    SUM(
      COALESCE(
        CASE
          WHEN ${dateCondition} THEN totalAmount
          ELSE 0
        END,
      0)
    )
  `;

// prettier-ignore
// Calculation strategies for footer totals
const CalculationModes = {
  // For Current Assets/Liabilities footer totals 
  default: {
    fn: (acc, [_, value]) => {
      acc["beginningBalanceTotal"] += value.beginningTotal;
      acc["debitTotal"] += value.debit;
      acc["creditTotal"] += value.credit;
      acc["endingBalanceTotal"] += value.endingTotal;

      return acc;
    },
    initialValue: {
      beginningBalanceTotal: 0,
      debitTotal: 0,
      creditTotal: 0,
      endingBalanceTotal: 0,
    },
  },
  // For Additional Items footer totals
  adjusted: {
    fn: (acc, [_, value]) => {
      const normalize = (num) => num ?? 0;

      // Total beginning balance
      acc["beginningBalanceTotal"] += normalize(value.startupBeginningTotal);
      acc["beginningBalanceTotal"] += normalize(value.mainBusinessIncomeBeginningTotal);
      acc["beginningBalanceTotal"] += normalize(value.otherIncomeBeginningTotal)

      acc["debitTotal"] += normalize(value.debit); // Total debit

      // Total ending balance
      acc["endingBalanceTotal"] += normalize(value.startupEndingTotal);
      acc["endingBalanceTotal"] += normalize(value.mainBusinessIncomeEndingTotal);
      acc["endingBalanceTotal"] += normalize(value.otherIncomeEndingTotal);


      return acc;
    },
    initialValue: {
      beginningBalanceTotal: 0,
      debitTotal: 0,
      endingBalanceTotal: 0,
    },
  },
};

// prettier-ignore
// Get the total of beginning total, addition (debit), deduction(credit) and end of total columns
const getTotals = (obj, mode = "default") => {
  const totalEntryList = Object.entries(obj).reduce(CalculationModes[mode].fn, { ...CalculationModes[mode].initialValue });

  return totalEntryList;
};

module.exports = {
  createConditions,
  sumAccountBalance,
  getTotals,
  sumOtherIncome,
};
