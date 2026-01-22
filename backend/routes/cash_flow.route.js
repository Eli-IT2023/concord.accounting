const router = require("express").Router();
const { where, Op, fn, col, literal } = require("sequelize");
const sequelize = require("../db/config/sequelize.config");
// const { CashFlow, AccountList } = require("../db/models/associations");
const {
  CashFlow,
  accountlist_sub3,
  accountlist_transaction_subject,
  PayBulkExpensesPayment,
  PayBulkExpensesTransaction,
} = require("../db/models/ModelsBySubject/associations_sub");
const session = require("express-session");
const BulkCollectionPayment = require("../db/models/bulk_collection_payment.model");
const Payable_Payment = require("../db/models/payable_payment.model");
const AccountListSub3 = require("../db/models/ModelsBySubject/accountlist_sub3.model");
const Currency = require("../db/models/currency.model");
const BulkCollection = require("../db/models/bulk_collection.model");
const BulkCollectionTransaction = require("../db/models/bulk_collection_transaction.model");
const SalesInvoice = require("../db/models/invoice.model");
const PayBulkExpenses = require("../db/models/pay-bulk-expenses.model");
const Expenses = require("../db/models/expenses.model");
const {
  PayableBulk,
  Payable_Bulk_Transaction,
  Payable,
} = require("../db/models/associations");

router.route("/getCashflow").get(async (req, res) => {
  try {
    const { startDate, endDate, accountsName, filterColumn, searchText } =
      req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    // Initialize the where clause
    let whereClause = {
      transaction_date: {
        [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
      },
    };

    let accountListSub3WhereClause = {};
    const cashFlowTableColumn = [
      "transaction_date",
      "transaction_number",
      "account_list_id_cash_tos",
      "account_list_id_cash_froms",
      "module_from",
      "description",
      "amount",
    ];

    switch (filterColumn) {
      // Filter date
      case "date":
        whereClause = {
          [Op.and]: [
            {
              transaction_date: {
                [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
              },
            },
            sequelize.where(literal(`CAST (transaction_date AS CHAR)`), {
              [Op.like]: `%${searchText}%`,
            }),
          ],
        };
        break;
      // Filter transaction number
      case "transaction_number":
        whereClause["transaction_number"] = {
          [Op.like]: `%${searchText}%`,
        };
        break;
      // Filter Issued to
      case "issued_to":
        whereClause["$account_list_id_cash_tos.account_name$"] = {
          [Op.like]: `%${searchText}%`,
        };
        break;
      // Filter subject from
      case "subject_from":
        whereClause["module_from"] = {
          [Op.like]: `%${searchText}%`,
        };
        break;
      // Filter Description
      case "description":
        whereClause["description"] = {
          [Op.like]: `%${searchText}%`,
        };
        break;
      // Filter Amount
      case "amount":
        whereClause = {
          [Op.and]: [
            {
              transaction_date: {
                [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
              },
            },
            sequelize.where(literal(`CAST (cash_flow.amount AS CHAR)`), {
              [Op.like]: `%${searchText}%`,
            }),
          ],
        };
        break;
      // Filter Account Name
      case "account_name":
        whereClause["$account_list_id_cash_froms.account_name$"] = {
          [Op.like]: `%${searchText}%`,
        };
        break;
      // Filter for all except "issued_to"
      default:
        whereClause = {
          [Op.and]: [
            {
              transaction_date: {
                [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
              },
            },
            {
              [Op.or]: cashFlowTableColumn.map((col) => {
                if (col === "transaction_date") {
                  return sequelize.where(
                    literal(`CAST (transaction_date AS CHAR)`),
                    {
                      [Op.like]: `%${searchText}%`,
                    }
                  );
                } else if (col === "amount") {
                  return sequelize.where(
                    literal(`CAST (cash_flow.amount AS CHAR)`),
                    {
                      [Op.like]: `%${searchText}%`,
                    }
                  );
                } else if (
                  col === "account_list_id_cash_tos" ||
                  col === "account_list_id_cash_froms"
                ) {
                  return {
                    [`$${col}.account_name$`]: {
                      [Op.like]: `%${searchText}%`,
                    },
                  };
                } else {
                  return {
                    [col]: {
                      [Op.like]: `%${searchText}%`,
                    },
                  };
                }
              }),
            },
          ],
        };
        break;
    }

    let accountListSub3IDClause = {
      payment_type: "Cash",
      date_issued: {
        [Op.between]: [startDate, endDate],
      },
    };

    let totalOutPayableBulkPaymentClause = {
      payment_type: "Cash",
      date_issued: {
        [Op.between]: [startDate, endDate],
      },
    };

    // Conditionally add account_list_id_cash_from if accountsName is provided
    if (accountsName) {
      whereClause.account_list_id_cash_from = accountsName;
      accountListSub3IDClause.account_list_sub3_id = accountsName;
      totalOutPayableBulkPaymentClause.accountList_id = accountsName;
    }

    // const totalIn = await BulkCollectionPayment.sum("amount", {
    //   where: accountListSub3IDClause,
    // });

    let data = await BulkCollectionPayment.findAll({
      include: [
        {
          model: BulkCollection,
          required: false,
          include: [
            {
              model: BulkCollectionTransaction,
              required: true,
              include: [
                {
                  model: SalesInvoice,
                  required: true,
                  include: [
                    {
                      model: Currency,
                      required: true,
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          model: AccountListSub3,
          include: [
            {
              model: Currency,
            },
          ],
        },
      ],
      where: accountListSub3IDClause,
    });

    const transferData = await CashFlow.findAll({
      include: [
        {
          model: accountlist_sub3,
          required: false,
          as: "account_list_id_cash_froms",
          attributes: ["account_name"],
          foreignKey: "account_list_id_cash_from",
          include: [
            {
              model: Currency,
              required: true,
            },
          ],
        },
        {
          model: accountlist_sub3,
          required: false,
          as: "account_list_id_cash_tos",
          foreignKey: "account_list_id_cash_to",
          include: [
            {
              model: Currency,
              required: true,
            },
          ],
        },
      ],
      where: { ...whereClause, isDeleted: false },
    });

    const totalIn = transferData
      .filter(
        (data) =>
          data.module_from == "Local Collection" ||
          data.module_from == "Overseas Collection" ||
          (data.transaction_number.includes("TRANSFER-") &&
            data.account_list_id_cash_to == null)
      )
      .reduce((total, transfer) => {
        let amount = transfer.amount;
        let exchangeRate = transfer.account_list_id_cash_froms
          ? transfer.account_list_id_cash_froms.currency.currency_rate
          : transfer.account_list_id_cash_tos.currency.currency_rate;

        let convertedAmount = amount * exchangeRate;

        return total + convertedAmount;
      }, 0);

    const totalOut = transferData
      .filter(
        (data) =>
          data.module_from !== "Local Collection" &&
          (!data.transaction_number.includes("TRANSFER") ||
            data.account_list_id_cash_to !== null)
      )
      .reduce((total, transfer) => {
        let amount = transfer.amount;
        let exchangeRate = transfer.account_list_id_cash_froms
          ? transfer.account_list_id_cash_froms.currency.currency_rate
          : transfer.account_list_id_cash_froms.currency.currency_rate;

        let convertedAmount = amount * exchangeRate;

        return total + convertedAmount;
      }, 0);

    // const totalIn = data.reduce((total, payment) => {
    //   let paymentAmount = payment.amount || 0;
    //   let exchangeRate =
    //     payment.account_list_sub3?.currency?.currency_rate || 1;
    //   let convertedAmount = paymentAmount * exchangeRate;

    //   return total + convertedAmount;
    // }, 0);

    // const totalOutPayBulkExpensesPayment = await PayBulkExpensesPayment.sum(
    //   "amount",
    //   {
    //     where: accountListSub3IDClause,
    //   }
    // );

    // const totalOutPayableBulkPayment = await Payable_Payment.sum("amount", {
    //   where: totalOutPayableBulkPaymentClause,
    // });

    // const totalOutExpenses = await PayBulkExpensesPayment.findAll({
    //   include: [
    //     {
    //       model: PayBulkExpenses,
    //       required: false,
    //       include: [
    //         {
    //           model: PayBulkExpensesTransaction,
    //           required: true,
    //           include: [
    //             {
    //               model: Expenses,
    //             },
    //           ],
    //         },
    //       ],
    //     },
    //     {
    //       model: AccountListSub3,
    //       include: [
    //         {
    //           model: Currency,
    //         },
    //       ],
    //     },
    //   ],
    //   where: accountListSub3IDClause,
    // });

    // const totalOutPayables = await Payable_Payment.findAll({
    //   include: [
    //     {
    //       model: PayableBulk,
    //       required: false,
    //       include: [
    //         {
    //           model: Payable_Bulk_Transaction,
    //           required: true,
    //           include: [
    //             {
    //               model: Payable,
    //             },
    //           ],
    //         },
    //       ],
    //     },
    //     {
    //       model: AccountListSub3,
    //       include: [
    //         {
    //           model: Currency,
    //         },
    //       ],
    //     },
    //   ],
    //   where: totalOutPayableBulkPaymentClause,
    // });

    // const totalOutPayableBulkPayment = totalOutPayables.reduce(
    //   (total, payment) => {
    //     let paymentAmount = payment.amount || 0;
    //     let exchangeRate =
    //       payment.account_list_sub3?.currency?.currency_rate || 1;
    //     console.log("AMT", payment.amount, exchangeRate);
    //     let convertedAmount = paymentAmount * exchangeRate;

    //     return total + convertedAmount;
    //   },
    //   0
    // );

    // const totalOutPayBulkExpensesPayment = totalOutExpenses.reduce(
    //   (total, payment) => {
    //     let paymentAmount = payment.amount || 0;
    //     let exchangeRate =
    //       payment.account_list_sub3?.currency?.currency_rate || 1;

    //     console.log("AMT", payment.amount, exchangeRate);
    //     let convertedAmount = paymentAmount * exchangeRate;

    //     return total + convertedAmount;
    //   },
    //   0
    // );

    // let totalOutCombinedAmount =
    //   (totalOutPayBulkExpensesPayment || 0) + (totalOutPayableBulkPayment || 0);

    let { count, rows: cashFlow } = await CashFlow.findAndCountAll({
      include: [
        {
          model: accountlist_sub3,
          required: false,
          as: "account_list_id_cash_froms",
          attributes: ["account_name"],
          foreignKey: "account_list_id_cash_from",
          include: [
            {
              model: Currency,
              required: true,
            },
          ],
        },
        {
          model: accountlist_sub3,
          required: false,
          as: "account_list_id_cash_tos",
          attributes: ["account_name"],
          foreignKey: "account_list_id_cash_to",
          where: accountListSub3WhereClause,
          include: [
            {
              model: Currency,
              required: true,
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: limit,
      offset: offset,
      where: { ...whereClause, isDeleted: false },
    });

    // if (filterColumn === "issued_to" && searchText !== "") {
    //   const filteredCashflow = cashFlow.filter((col) => {
    //     return col.account_list_id_cash_tos !== null;
    //   });
    //   return res.json(filteredCashflow);
    // }

    // Filter for all // if cashFlow is empty search for "issued to"
    // if (filterColumn === "all" && cashFlow.length === 0 && searchText !== "") {
    //   accountListSub3WhereClause = {};
    //   whereClause = {
    //     transaction_date: {
    //       [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
    //     },
    //   };
    //   accountListSub3WhereClause["account_name"] = {
    //     [Op.like]: `%${searchText}%`,
    //   };
    //   // Conditionally add account_list_id_cash_from if accountsName is provided
    //   if (accountsName) {
    //     whereClause.account_list_id_cash_from = accountsName;
    //   }

    //   cashFlow = await CashFlow.findAll({
    //     include: [
    //       {
    //         model: accountlist_sub3,
    //         required: false,
    //         as: "account_list_id_cash_froms",
    //         attributes: ["account_name"],
    //         foreignKey: "account_list_id_cash_from",
    //       },
    //       {
    //         model: accountlist_sub3,
    //         required: false,
    //         as: "account_list_id_cash_tos",
    //         attributes: ["account_name"],
    //         foreignKey: "account_list_id_cash_to",
    //         where: accountListSub3WhereClause,
    //       },
    //     ],
    //     where: whereClause,
    //   });
    //   const filteredCashflow = cashFlow.filter((col) => {
    //     return col.account_list_id_cash_tos !== null;
    //   });
    //   return res.json(filteredCashflow);
    // }

    // Add Exchange Rate Used and Converted Amount to Data Table
    cashFlow = cashFlow.map((item) => {
      const exchangeRate =
        item.account_list_id_cash_froms?.currency?.currency_rate ||
        item.account_list_id_cash_tos?.currency.currency_rate;
      const convertedAmount = item.amount * exchangeRate;
      return {
        ...item.toJSON(),
        exchangeRate,
        convertedAmount,
      };
    });

    if (cashFlow) {
      return res.json({
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page || 1),
        data: { cashFlow, totalIn, totalOutCombinedAmount: totalOut },
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

module.exports = router;
