const router = require("express").Router();
const { where, Op, fn, col } = require("sequelize");
const sequelize = require("../db/config/sequelize.config");

const {
  Currency,
  StockManagement,
  SalesInvoice,
  Expenses,
  Expenses2,
  FixedAsset,
  FixedAssetForecast,
  Payable,
  Loan_history,
  Loan_mother,
} = require("../db/models/associations");

const {
  accountlist_sub3,
  accountlist_transaction_subject,
  accountlist_base_subject,
  currency_sub,
  bank_transaction,
  issued_check,
} = require("../db/models/ModelsBySubject/associations_sub");

const session = require("express-session");

router.route("/getAssets").get(async (req, res) => {
  const { cutoffList_id, cutoff_fromdate, cutoff_todate } = req.query;

  // Query configurations
  const dateRange = {
    [Op.between]: [cutoff_fromdate, cutoff_todate],
  };

  // Helper function to calculate total with currency rate
  const calculateTotal = (items, amountField = "amount") => {
    return (
      items?.reduce(
        (total, item) =>
          total + item[amountField] * (item.currency?.currency_rate || 1),
        0
      ) || 0
    );
  };

  // Separate query functions for better maintainability
  const queryFunctions = {
    async getFunds() {
      const funds = await accountlist_sub3.findAll({
        where: {
          isDeleted: false,
        },
        include: [
          {
            model: accountlist_base_subject,
            required: true,
            where: {
              isDeleted: false,
              [Op.or]: [
                // { module_type: "Owner's Equity Account" },
                { module_type: "Account-List" },
              ],
            },
          },
          {
            model: currency_sub,
            required: true,
          },
        ],
      });
      return calculateTotal(funds);
    },

    async getAccountsReceivable() {
      const receivables = await SalesInvoice.findAll({
        where: {
          status: "Approved",
          isDeleted: false,
          payAdded: false,
          invoice_date: dateRange,
        },
        // include: [
        //   {
        //     model: currency_sub,
        //     required: true,
        //   },
        // ],
      });
      return calculateTotal(receivables, "total_amount");
    },

    async getStockManagement() {
      const stocks = await StockManagement.findAll({
        where: { date_in: dateRange, isDeleted: false },
        attributes:
          // [[sequelize.fn("SUM", sequelize.col("price")), "total"]],
          [
            "product_id",
            [sequelize.fn("SUM", sequelize.col("stock")), "total_stock"],
            [sequelize.fn("SUM", sequelize.col("price")), "total_price"],
            [sequelize.fn("AVG", sequelize.col("price")), "average_price"],
          ],
        group: ["product_id"],

        // raw: true,
      });
      // return stocks[0]?.total || 0;
      return stocks;
    },

    async getPrepaidExpenses() {
      const prepaid = await accountlist_sub3.findAll({
        where: {
          isDeleted: false,
        },
        include: [
          {
            model: accountlist_base_subject,
            required: true,
            where: { id: "22222222-2222-2222-2222-222222222222" },
          },
          {
            model: currency_sub,
            required: true,
          },
        ],
      });
      return calculateTotal(prepaid);
    },

    async getOtherCurrentAssets() {
      const others = await accountlist_sub3.findAll({
        where: {
          isDeleted: false,
        },
        include: [
          {
            model: accountlist_base_subject,
            required: true,
            where: { module_type: "Asset Account" },
          },
          {
            model: currency_sub,
            required: true,
          },
        ],
      });
      return calculateTotal(others);
    },

    async getFixedAssets() {
      const assets = await FixedAsset.findAll({
        where: { status: "Approved" },
        include: [
          {
            model: FixedAssetForecast,
            required: true,
          },
          {
            model: Currency,
            required: true,
          },
          // {
          //   model: Expenses,
          //   required: true,
          // },
        ],
      });

      const totals = {
        originalValues: 0,
        cummulativeDiscount: 0,
        impairment: 0,
      };

      assets?.forEach((asset) => {
        totals.originalValues +=
          asset.total_cost * asset.currency.currency_rate;
        asset.fixed_asset_forecasts?.forEach((forecast) => {
          if (forecast.isPaid) {
            totals.cummulativeDiscount +=
              forecast.amount * asset.currency.currency_rate;
          } else {
            totals.impairment += forecast.amount * asset.currency.currency_rate;
          }
        });
      });

      return totals;
    },
  };

  try {
    // Execute all queries in parallel
    const [
      totalFundsAmount,
      totalAccountsReceivable,
      totalStockManagement,
      totalPrepaidExpenses,
      totalOtherCurrentAssets,
      fixedAssetTotals,
    ] = await Promise.all([
      queryFunctions.getFunds(),
      queryFunctions.getAccountsReceivable(),
      queryFunctions.getStockManagement(),
      queryFunctions.getPrepaidExpenses(),
      queryFunctions.getOtherCurrentAssets(),
      queryFunctions.getFixedAssets(),
    ]);

    res.status(200).json({
      totalFundsAmount,
      totalAccountsReceivable,
      totalStockManagement,
      totalPrepaidExpenses,
      totalOtherCurrentAssets,
      totalFixedAssetOriginalValues: fixedAssetTotals.originalValues,
      totalFixedAssetCummulativeDiscount: fixedAssetTotals.cummulativeDiscount,
      totalFixedAssetImpairment: fixedAssetTotals.impairment,
    });
  } catch (error) {
    console.error("Error in getAssets:", error);
    res.status(500).json({
      message: "Failed to fetch assets data",
      error: error.message,
    });
  }
});

router.route("/getLiabilities").get(async (req, res) => {
  const { cutoffList_id, cutoff_fromdate, cutoff_todate } = req.query;

  // Query configurations
  const dateRange = {
    [Op.between]: [cutoff_fromdate, cutoff_todate],
  };

  console.log(cutoff_fromdate, cutoff_todate);

  try {
    const bankTransactions = await bank_transaction.findAll({
      where: {
        transaction_date: dateRange,
        status: "Pending",
        account_list_id_bank_to: null,
        isDeleted: false,
      },
      include: [
        {
          model: accountlist_sub3,
          as: "account_list_id_bank_froms",
          required: true,
          include: [
            {
              model: currency_sub,
              required: true,
            },
          ],
        },
      ],
    });

    // console.log(bankTransactions);

    let totalBankTransactions = 0;
    bankTransactions?.forEach((bankTransaction) => {
      const amount = bankTransaction.amount;
      const currencyRate =
        bankTransaction.account_list_id_bank_froms?.currency?.currency_rate;
      totalBankTransactions += amount * currencyRate;
      // console.log("Currency Rate:", currencyRate, "Amount:", amount);
    });

    const issued_checks = await issued_check.findAll({
      where: {
        transaction_date: dateRange,
        status: "Pending",
        account_list_id_issued_to: null,
        isDeleted: false,
      },
      include: [
        {
          model: accountlist_sub3,
          as: "account_list_id_issued_froms",
          required: true,
          where: {
            isDeleted: false,
          },
          include: [
            {
              model: currency_sub,
              required: true,
            },
          ],
        },
      ],
    });

    // console.log(issued_checks);
    let totalIssuedCheck = 0;
    issued_checks?.forEach((issuedCheck) => {
      // The amount should come from the issued_check itself
      const amount = issuedCheck.amount;
      // Get the currency rate from the nested structure
      const currencyRate =
        issuedCheck.account_list_id_issued_froms?.currency?.currency_rate;

      totalIssuedCheck += amount * currencyRate;
      // console.log("Currency Rate:", currencyRate, "Amount:", amount);
    });

    let OverAllTotalBankTransactions = totalBankTransactions + totalIssuedCheck;

    const payable = await Payable.findAll({
      // need to add currency rate
      where: {
        status: "Approved",
        isAdded: false,
        purchaseDate: dateRange,
        isDeleted: false,
      },
    });

    let totalPayable = 0;
    payable?.forEach((payable) => {
      totalPayable += payable.totalPrice * payable.rate;
    });

    const totalExpensesFetch = await Expenses.findAll({
      where: {
        status: "Approved",
        isAdded: false,
        isDeleted: false,
        expenses_date: dateRange,
      },
      include: [
        {
          model: Currency,
          required: true,
        },
      ],
    });

    let totalExpenses = 0;
    totalExpensesFetch?.forEach((expense) => {
      totalExpenses += expense.totalAmount * expense.rate;
    });

    let totalPaidLoan = 0;
    let loanBalance = 0;

    const totalLoanFetch = await Loan_mother.findAll({
      where: {
        status: "Approved",
        amount: {
          [Op.ne]: 0,
        },
      },
      include: [
        {
          model: currency_sub,
          required: true,
        },
      ],
    });

    if (totalLoanFetch.length > 0) {
      totalLoanFetch?.forEach((loan) => {
        loanBalance += loan.static_amount * loan.currency?.currency_rate;
      });
    } else {
      loanBalance = 0;
    }

    const totalLoanPaidFetch = await Loan_history.findAll({
      where: {
        date_deducted: dateRange,
      },
      include: [
        {
          model: Loan_mother,
          required: true,
          where: {
            status: "Approved",
            amount: {
              [Op.ne]: 0,
            },
          },
        },
      ],
    });

    if (totalLoanPaidFetch.length > 0) {
      totalLoanPaidFetch?.forEach((loan) => {
        totalPaidLoan += loan.amount_deducted * loan.deduction_rate;
      });
    } else {
      totalPaidLoan = 0;
    }

    const totalLoanBalance = loanBalance - totalPaidLoan;

    console.log("Total Loan Balance:", loanBalance, totalPaidLoan);

    const totalOtherCurrentLiabilitiesFetch = await accountlist_sub3.findAll({
      include: [
        {
          model: accountlist_base_subject,
          required: true,
          where: { module_type: "Liabilities Account" },
        },
        {
          model: currency_sub,
          required: true,
        },
      ],
    });

    let totalOtherCurrentLiabilities = 0;
    totalOtherCurrentLiabilitiesFetch?.forEach((otherCurrentLiability) => {
      totalOtherCurrentLiabilities +=
        otherCurrentLiability.amount *
        otherCurrentLiability.currency?.currency_rate;
    });

    res.status(200).json({
      OverAllTotalBankTransactions,
      totalPayable,
      totalExpenses,
      totalOtherCurrentLiabilities,
      totalLoanBalance,
    });
  } catch (error) {
    console.error("Error in getLiabilities:", error);
    res.status(500).json({
      message: "Failed to fetch liabilities data",
      error: error.message,
    });
  }
});

router.route("/getOwnersEquity").get(async (req, res) => {
  const { cutoffList_id, cutoff_fromdate, cutoff_todate } = req.query;

  const dateRange = {
    [Op.between]: [cutoff_fromdate, cutoff_todate],
  };

  try {
    const ownersEquity = await accountlist_sub3.findAll({
      include: [
        {
          model: accountlist_base_subject,
          required: true,
          where: {
            module_type: "Owner's Equity Account",
          },
        },
        {
          model: currency_sub,
          required: true,
        },
      ],
      where: {
        isDeleted: false,
      },
    });

    let totalOwnersEquity = 0;
    ownersEquity?.forEach((owner) => {
      totalOwnersEquity +=
        owner.investment_amount * owner.currency?.currency_rate;
    });

    const transactions = await accountlist_transaction_subject.findAll({
      where: {
        date: dateRange,
        isDeleted: false,
        check_or_remarks: {
          [Op.or]: [{ [Op.ne]: "Funding Capital" }, { [Op.is]: null }],
        },
        isTransferOnly: false,
      },
      order: [["date", "DESC"]],
      include: [
        {
          model: accountlist_sub3,
          as: "transacteds",
          required: true,
          isDeleted: false,
          include: [
            {
              model: Currency,
              required: true,
            },
          ],
        },
      ],
    });

    // Group transactions by date and currency_id
    const groupedTransactions = transactions.reduce((acc, transaction) => {
      const date = transaction.date;
      const currencyId = transaction.transacteds.currency_id;
      const currencyName = transaction.transacteds.currency.currency_name;
      const currencyRate = transaction.transacteds.currency.currency_rate;
      const type = transaction.type; // Assuming 'type' is a field in the transaction

      // Initialize the group if it doesn't exist
      if (!acc[date]) {
        acc[date] = {};
      }
      if (!acc[date][currencyId]) {
        acc[date][currencyId] = {
          credit: 0,
          debit: 0,
          currencyName,
          currencyRate,
        }; // Store currencyName here
      }

      // Sum the amounts based on type
      if (type === "Credit") {
        acc[date][currencyId].credit += transaction.amount; // Assuming 'amount' is a field in the transaction
      } else if (type === "Debit") {
        acc[date][currencyId].debit += transaction.amount; // Assuming 'amount' is a field in the transaction
      }

      return acc;
    }, {});

    // Calculate net amounts
    const result = Object.entries(groupedTransactions)
      .map(([date, currencies]) => {
        return Object.entries(currencies).map(([currencyId, amounts]) => {
          return {
            date,
            currency_id: currencyId,
            currency_name: amounts.currencyName, // Use currencyName from amounts
            debit: amounts.debit,
            credit: amounts.credit,
            netAmount: amounts.debit - amounts.credit,
            currency_rate: amounts.currencyRate,
          };
        });
      })
      .flat();

    const sumNetAmount = result.reduce(
      (acc, curr) => acc + curr.netAmount * curr.currency_rate,
      0
    );

    res.status(200).json({
      totalOwnersEquity,
      retainedEarnings: sumNetAmount,
    });
  } catch (error) {
    console.error("Error in getOwnersEquity:", error);
    res.status(500).json({
      message: "Failed to fetch owners equity data",
      error: error.message,
    });
  }
});

module.exports = router;
