const CheckJournal = require("../../db/models/check_journal.model");
const {
  createConditions,
  sumAccountBalance,
  sumOtherIncome,
} = require("./trialBalanceHelpers");
const sequelize = require("../../db/config/sequelize.config");
const {
  accountlist_transaction_subject,
  accountlist_sub3,
  accountlist_base_subject,
} = require("../../db/models/ModelsBySubject/associations_sub");
const { Op } = require("sequelize");
const Currency = require("../../db/models/currency.model");
const OtherIncome = require("../../db/models/other_income.model");

// Generates the WHERE clause for accountlist_base_subject based on the subject type
const accountListBaseSubClause = (subjectType) => {
  const baseClause = { isDeleted: false };

  // For cash account or bank account
  if (subjectType === "Cash" || subjectType === "Bank") {
    return {
      ...baseClause,
      subject_type: subjectType,
      module_type: { [Op.in]: ["Owner's Equity Account", "Account-List"] },
    };
  }

  // For other current assets
  if (subjectType === "Other Current Asset") {
    return {
      ...baseClause,
      module_type: "Asset Account",
    };
  }

  // For other current liabilities
  if (subjectType === "Other Current Liabilities") {
    return {
      ...baseClause,
      module_type: "Liabilities Account",
    };
  }

  // For startup capital
  if (subjectType === "Startup Capital") {
    return {
      ...baseClause,
      module_type: { [Op.in]: ["Owner's Equity Account", "Account-List"] },
    };
  }
};

// Get the total entry based on given subject type
// Subject Type: (Bank, Cash, Other Current Asset, Other Current Liabilities, Startup Capital)
const getJournalTotal = async (subjectType, startDate, endDate) => {
  const dateConditions = createConditions(startDate, endDate);

  // prettier-ignore
  // Separated for dynamic attributes based on subjectType
  const debitAttributes = [
    sequelize.literal(
      sumAccountBalance(`date ${dateConditions.between}`, "Debit", "accountList")
    ),
    "debit",
  ];

  const attributes = [];

  // prettier-ignore
  // Attributes for Current Assets/Liabilities section
  if (subjectType !== "Startup Capital") {
    attributes.push(
      [
        sequelize.literal(
          `${sumAccountBalance(`date ${dateConditions.lessThanStart}`, "Debit", "accountList")} 
            - ${sumAccountBalance(`date ${dateConditions.lessThanStart}`, "Credit", "accountList")}`
        ),
        "beginningTotal", // Debit - Credit with date less than start date
      ],
      debitAttributes, // Sum of debit within selected cutoff
      [
        sequelize.literal(
          sumAccountBalance(`date ${dateConditions.between}`, "Credit", "accountList")
        ),
        "credit", // Sum of credit within selected cutoff
      ],
      [
        sequelize.literal(
          `${sumAccountBalance(`date ${dateConditions.lessThanEqualEnd}`, "Debit", "accountList")}
             - ${sumAccountBalance(`date ${dateConditions.lessThanEqualEnd}`, "Credit", "accountList")}`
        ),
        "endingTotal", // Debit - Credit with date less than or equal end date
      ],
    );
  }

  // prettier-ignore
  // --- Attributes for Startup Capital only, under additional items section ---
  if (subjectType === "Startup Capital") {
    attributes.push(
      [
        sequelize.literal(
          sumAccountBalance(`date ${dateConditions.lessThanStart}`, "Debit", "accountList")
        ),
        "startupBeginningTotal", // Beginning total for startup, only sum the debit
      ],
      debitAttributes, // Sum of debit within selected cutoff
      [
        sequelize.literal(
          sumAccountBalance(`date ${dateConditions.lessThanEqualEnd}`, "Debit", "accountList")
        ), 
        "startupEndingTotal" // Sum of beginning total and debit with date less than or equal end date
      ]
    );
  }

  // Main fetching
  const entry = await accountlist_transaction_subject.findOne({
    attributes,
    include: [
      {
        model: accountlist_sub3,
        required: true,
        as: "transacteds",
        attributes: [],
        include: [
          {
            model: accountlist_base_subject,
            required: true,
            attributes: [],
            where: accountListBaseSubClause(subjectType),
          },
          {
            model: Currency,
            required: true,
            attributes: [],
          },
        ],
      },
    ],
    where: {
      isDeleted: false,
    },
    raw: true,
  });

  return {
    beginningTotal: entry?.beginningTotal,
    debit: entry?.debit,
    credit: entry?.credit,
    endingTotal: entry?.endingTotal,
    startupBeginningTotal: entry?.startupBeginningTotal,
    startupEndingTotal: entry?.startupEndingTotal,
  };
};

// For collection checks / outstanding checks and posted payable checks row
const getChecks = async (
  startDate,
  endDate,
  checkJournalClause,
  subjectType = null
) => {
  const dateConditions = createConditions(startDate, endDate);
  // prettier-ignore
  // Separated for dynamic attributes based on subjectType
  const debitAttributes = [
    sequelize.literal(sumAccountBalance(`transaction_date ${dateConditions.between}`, "Debit", "checkJournal")),
    "debit"
  ]

  const attributes = [];

  // prettier-ignore
  // Attributes for Current Assets/Liabilities section
  if (subjectType !== "Main Business Income") {
    attributes.push(
      [
        sequelize.literal(`
          ${sumAccountBalance(`transaction_date ${dateConditions.lessThanStart}`, "Debit", "checkJournal")} 
            - ${sumAccountBalance(`transaction_date ${dateConditions.lessThanStart}`, "Credit", "checkJournal")}
        `),
        "beginningTotal" // Debit - Credit with date less than startDate
      ],
      debitAttributes, // Sum of debit within selected cutoff
      [
        sequelize.literal(sumAccountBalance(`transaction_date ${dateConditions.between}`, "Credit", "checkJournal")),
        "credit" // Sum of credit within selected cutoff
      ],
      [
        sequelize.literal(`
          ${sumAccountBalance(`transaction_date ${dateConditions.lessThanEqualEnd}`, "Debit", "checkJournal")}
            - ${sumAccountBalance(`transaction_date ${dateConditions.lessThanEqualEnd}`, "Credit", "checkJournal")}
        `),
        "endingTotal" // Debit - Credit with date less than or equal endDate 
      ],
    )
  }

  // prettier-ignore
  // --- Attributes for Main Business Income only, under additional items section ---
  if (subjectType === "Main Business Income") {
    attributes.push(
      [
        sequelize.literal(
          sumAccountBalance(`transaction_date ${dateConditions.lessThanStart}`, "Debit", "checkJournal")
        ),
        "mainBusinessIncomeBeginningTotal", // Beginning total for main business income, only sum the debit
      ],
      debitAttributes, // Sum of debit within selected cutoff
      [
        sequelize.literal(
          sumAccountBalance(`transaction_date ${dateConditions.lessThanEqualEnd}`, "Debit", "checkJournal")
        ), 
        "mainBusinessIncomeEndingTotal" // Sum of beginning total and debit with the date less than end date
      ]
    )
  }

  // Main fetching
  const entry = await CheckJournal.findOne({
    attributes,
    raw: true,
    where: checkJournalClause,
  });

  return {
    beginningTotal: entry?.beginningTotal,
    debit: entry?.debit,
    credit: entry?.credit,
    endingTotal: entry?.endingTotal,
    mainBusinessIncomeBeginningTotal: entry?.mainBusinessIncomeBeginningTotal,
    mainBusinessIncomeEndingTotal: entry?.mainBusinessIncomeEndingTotal,
  };
};

// Get the other income row for additional items section
const getOtherIncome = async (startDate, endDate) => {
  const dateConditions = createConditions(startDate, endDate);

  const otherIncome = await OtherIncome.findOne({
    // prettier-ignore
    attributes: [
      [sequelize.literal(sumOtherIncome(`income_date ${dateConditions.lessThanStart}`)), "beginningTotal"],
      [sequelize.literal(sumOtherIncome(`income_date ${dateConditions.between}`)), "debit"],
      [sequelize.literal(sumOtherIncome(`income_date ${dateConditions.lessThanEqualEnd}`)), "endingTotal"]
    ],
    where: {
      status: "Approved",
      isDeleted: false,
    },
    raw: true,
  });

  return {
    otherIncomeBeginningTotal: otherIncome?.beginningTotal,
    debit: otherIncome?.debit,
    otherIncomeEndingTotal: otherIncome?.endingTotal,
  };
};

module.exports = {
  getJournalTotal,
  getChecks,
  getOtherIncome,
};
