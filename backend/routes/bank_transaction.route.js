const router = require("express").Router();
const { where, Op, fn, col, literal } = require("sequelize");
const sequelize = require("../db/config/sequelize.config");
const {
  bank_transaction,
  accountlist_sub3,
  accountlist_transaction_subject,
  issued_check,
} = require("../db/models/ModelsBySubject/associations_sub");
const {
  PayBulkExpenses,
  PayBulkExpensesPayment,
  PayBulkAddDeductExpenses,
  BulkCollectionPayment,
  Payable_Payment,
  Payable_Bulk_Transaction,
  PayableBulk,
  Payable,
  Activity_Log,
  PayBulkExpensesTransaction,
  Expenses,
  Cutoff,
  Loan_mother,
  Loan_history,
  Currency,
  BulkCollection,
  BulkCollectionTransaction,
  SalesInvoice,
  AccountList,
} = require("../db/models/associations");
const session = require("express-session");
const ProfitLossReport = require("../db/models/profit_loss_report.model");
const AccountListSub3 = require("../db/models/ModelsBySubject/accountlist_sub3.model");
const BankTransaction = require("../db/models/bank_transaction.model");

router.route("/getBankTransaction").get(async (req, res) => {
  const { startDate, endDate, accountsName, filterColumn, searchText } =
    req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  // Initialize the where clause
  // const whereClause = {
  //   transaction_date: {
  //     [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
  //   },
  // };

  // // Conditionally add account_list_id_bank_from if accountsName is provided
  // if (accountsName) {
  //   whereClause.account_list_id_bank_from = accountsName;
  // }

  // try {
  //   const bankTransaction = await bank_transaction.findAll({
  //     include: [
  //       {
  //         model: accountlist_sub3,
  //         required: false,
  //         as: "account_list_id_bank_froms",
  //         attributes: ["account_name"],
  //         foreignKey: "account_list_id_bank_from",
  //       },
  //       {
  //         model: accountlist_sub3,
  //         required: false,
  //         as: "account_list_id_bank_tos",
  //         attributes: ["account_name"],
  //         foreignKey: "account_list_id_bank_to",
  //       },
  //     ],
  //     where: whereClause,
  //   });
  try {
    // Initialize the where clause
    let whereClause = {
      transaction_date: {
        [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
      },
    };

    let accountListSub3WhereClause = {};
    const bankTransactionTableColumn = [
      "transaction_date",
      "transaction_number",
      "module_from",
      "description",
      "amount",
      "account_list_id_bank_froms",
      "account_list_id_bank_tos",
      "status",
    ];

    if (searchText && searchText.trim() !== "") {
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
          whereClause["$account_list_id_bank_tos.account_name$"] = {
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
              sequelize.where(
                literal(`CAST (bank_transaction.amount AS CHAR)`),
                {
                  [Op.like]: `%${searchText}%`,
                }
              ),
            ],
          };
          break;
        // Filter Status
        case "status":
          whereClause["status"] = {
            [Op.like]: `%${searchText}%`,
          };
          break;
        // Filter Account Name
        case "account_name":
          whereClause["$account_list_id_bank_froms.account_name$"] = {
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
                [Op.or]: bankTransactionTableColumn.map((col) => {
                  switch (col) {
                    case "transaction_date":
                      return sequelize.where(
                        literal(`CAST (transaction_date AS CHAR)`),
                        {
                          [Op.like]: `%${searchText}%`,
                        }
                      );
                    case "amount":
                      return sequelize.where(
                        literal(`CAST (bank_transaction.amount AS CHAR)`),
                        {
                          [Op.like]: `%${searchText}%`,
                        }
                      );
                    case "account_list_id_bank_froms":
                    case "account_list_id_bank_tos":
                      return {
                        [`$${col}.account_name$`]: {
                          [Op.like]: `%${searchText}%`,
                        },
                      };

                    default:
                      return {
                        [col]: {
                          [Op.like]: `%${searchText}%`,
                        },
                      };
                      break;
                  }
                  // if (col === "transaction_date") {
                  //   return sequelize.where(
                  //     literal(`CAST (transaction_date AS CHAR)`),
                  //     {
                  //       [Op.like]: `%${searchText}%`,
                  //     }
                  //   );
                  // } else if (col === "amount") {
                  //   return sequelize.where(
                  //     literal(`CAST (bank_transaction.amount AS CHAR)`),
                  //     {
                  //       [Op.like]: `%${searchText}%`,
                  //     }
                  //   );
                  // } else if (
                  //   col === "account_list_id_bank_froms" ||
                  //   col === "account_list_id_bank_tos"
                  // ) {
                  //   return {
                  //     [`$${col}.account_name$`]: {
                  //       [Op.like]: `%${searchText}%`,
                  //     },
                  //   };
                  // } else {
                  //   return {
                  //     [col]: {
                  //       [Op.like]: `%${searchText}%`,
                  //     },
                  //   };
                  // }
                }),
              },
            ],
          };
          break;
      }
    }

    // Clause condition for Total In and Total Out
    let accountListSub3IDClause = {
      payment_type: "Bank",
      date_issued: {
        [Op.between]: [startDate, endDate],
      },
    };

    let totalOutPayableBulkPaymentClause = {
      payment_type: "Bank",
      date_issued: {
        [Op.between]: [startDate, endDate],
      },
    };

    // Conditionally add account_list_id__from if accountsName is provided
    if (accountsName) {
      whereClause.account_list_id_bank_from = accountsName;
      accountListSub3IDClause.account_list_sub3_id = accountsName;
      totalOutPayableBulkPaymentClause.accountList_id = accountsName;
    }

    // Total In: Amount in Bulk Collection Payment table, Bank Only
    // Total Out: Payable Bulk Payment Bank Only, pay_bulk expenses payments, issuedCheck/check_number should be null

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

    // Code for multiplying the amount to the currency rate inside Sales Invoice
    // const totalIn = data
    //   .filter((item) => {
    //     return item.status === "Claimed";
    //   })
    //   .reduce((total, value) => {
    //     const currencyRate =
    //       value.bulk_collection?.bulk_collection_transactions?.[0]
    //         ?.sales_invoice?.rate;

    //     return (
    //       total + parseFloat((value.amount || 0) * parseFloat(currencyRate))
    //     );
    //   }, 0);

    const transferData = await BankTransaction.findAll({
      include: [
        {
          model: accountlist_sub3,
          required: false,
          as: "account_list_id_bank_froms",
          attributes: ["account_name"],
          foreignKey: "account_list_id_bank_from",
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
          as: "account_list_id_bank_tos",
          attributes: ["account_name"],
          foreignKey: "account_list_id_bank_to",
          include: [
            {
              model: Currency,
              required: true,
            },
          ],
        },
      ],
      where: { ...whereClause, status: "Confirmed", isDeleted: false },
    });

    const totalIn = transferData
      .filter(
        (data) =>
          data.module_from == "Collection Check" ||
          (data.transaction_number.includes("TRANSFER-") &&
            data.account_list_id_bank_to == null)
      )
      .reduce((total, transfer) => {
        let amount = transfer.amount;
        let exchangeRate = transfer.account_list_id_bank_froms
          ? transfer.account_list_id_bank_froms.currency.currency_rate
          : transfer.account_list_id_bank_tos.currency.currency_rate;

        let convertedAmount = amount * exchangeRate;

        return total + convertedAmount;
      }, 0);

    const totalOut = transferData
      .filter(
        (data) =>
          data.module_from !== "Collection Check" &&
          (!data.transaction_number.includes("TRANSFER") ||
            data.account_list_id_bank_to !== null)
      )
      .reduce((total, transfer) => {
        let amount = transfer.amount;
        let exchangeRate = transfer.account_list_id_bank_froms
          ? transfer.account_list_id_bank_froms.currency.currency_rate
          : transfer.account_list_id_bank_tos.currency.currency_rate;

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

    // Old Code
    // const totalIn = await BulkCollectionPayment.sum("amount", {
    //   where: {
    //     ...accountListSub3IDClause,
    //     status: "Claimed",
    //   },
    // });
    // const totalOutPayBulkExpensesPayment = await PayBulkExpensesPayment.sum(
    //   "amount",
    //   {
    //     where: accountListSub3IDClause,
    //   }
    // );

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

    // const totalOutPayableBulkPayment = totalOutPayables.reduce(
    //   (total, value) => {
    //     const currencyRate =
    //       value.payable_bulk?.payable_bulk_transactions?.[0]?.payable?.rate;

    //     console.log("Valie", value.amount, currencyRate);
    //     return (
    //       total + parseFloat((value.amount || 0) * parseFloat(currencyRate))
    //     );
    //   },
    //   0
    // );

    // const totalOutPayBulkExpensesPayment = totalOutExpenses.reduce(
    //   (total, value) => {
    //     const currencyRate =
    //       value.pay_bulk_expense?.pay_bulk_expenses_transactions?.[0]?.expense
    //         ?.rate;

    //     return (
    //       total + parseFloat((value.amount || 0) * parseFloat(currencyRate))
    //     );
    //   },
    //   0
    // );

    // let totalOutCombinedAmount =
    //   (totalOutPayBulkExpensesPayment || 0) + (totalOutPayableBulkPayment || 0);

    let { count, rows } = await bank_transaction.findAndCountAll({
      include: [
        {
          model: accountlist_sub3,
          required: false,
          as: "account_list_id_bank_froms",
          attributes: ["account_name"],
          foreignKey: "account_list_id_bank_from",
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
          as: "account_list_id_bank_tos",
          attributes: ["account_name"],
          foreignKey: "account_list_id_bank_to",
          // where: accountListSub3WhereClause,
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
    //   const filteredBankTransaction = bankTransaction.filter((col) => {
    //     return col.account_list_id_bank_tos !== null;
    //   });
    //   return res.json(filteredBankTransaction);
    // }

    // Filter for all // if bankTransaction is empty search for "issued to"
    // if (
    //   filterColumn === "all" &&
    //   bankTransaction.length === 0 &&
    //   searchText !== ""
    // ) {
    //   accountListSub3WhereClause = {};
    //   whereClause = {
    //     transaction_date: {
    //       [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
    //     },
    //   };
    //   accountListSub3WhereClause["account_name"] = {
    //     [Op.like]: `%${searchText}%`,
    //   };
    //   // Conditionally add account_list_id_bank_from if accountsName is provided
    //   if (accountsName) {
    //     whereClause.account_list_id_bank_from = accountsName;
    //   }

    //   bankTransaction = await bank_transaction.findAll({
    //     include: [
    //       {
    //         model: accountlist_sub3,
    //         required: false,
    //         as: "account_list_id_bank_froms",
    //         attributes: ["account_name"],
    //         foreignKey: "account_list_id_bank_from",
    //       },
    //       {
    //         model: accountlist_sub3,
    //         required: false,
    //         as: "account_list_id_bank_tos",
    //         attributes: ["account_name"],
    //         foreignKey: "account_list_id_bank_to",
    //         where: accountListSub3WhereClause,
    //       },
    //     ],
    //     where: whereClause,
    //   });
    //   const filteredBankTransaction = bankTransaction.filter((col) => {
    //     return col.account_list_id_bank_tos !== null;
    //   });
    //   return res.json(filteredBankTransaction);
    // }

    // Add Exchange Rate Used and Converted Amount to Data Table
    rows = rows.map((item) => {
      const exchangeRate =
        item.account_list_id_bank_froms?.currency?.currency_rate ||
        item.account_list_id_bank_tos?.currency?.currency_rate;
      const convertedAmount = item.amount * exchangeRate;
      return {
        ...item.toJSON(),
        exchangeRate,
        convertedAmount,
      };
    });

    if (rows) {
      return res.json({
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page || 1),
        data: {
          bankTransaction: rows,
          totalIn,
          totalOutCombinedAmount: totalOut,
        },
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/validateBankTransaction/:id").get(async (req, res) => {
  try {
    const data = await accountlist_sub3.findOne({
      where: {
        id: req.params.id,
      },
    });
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json("Error");
  }
});

router.route("/confirmBankTransaction").post(async (req, res) => {
  try {
    const {
      id,
      account_list_id_bank_from,
      amount,
      date,
      transaction_number,
      module_from,
      description,
      userLoggedID,
      bankTransactionRowData,
      currencyRate,
      amountToDeduct,
      account_list_id_bank_to,
    } = req.body;

    const otherAmount = amountToDeduct != 0 ? amountToDeduct : amount;

    const findCutoff = await Cutoff.findOne({
      where: {
        [Op.and]: [
          {
            from: { [Op.lte]: date },
          },
          {
            to: { [Op.gte]: date },
          },
        ],
      },
    });

    const isPosted = findCutoff.isPosted;

    if (isPosted) {
      return res.status(202).json({ message: "Cutoff is already posted" });
    }

    await bank_transaction.update(
      {
        confirmed_by: userLoggedID,
      },
      {
        where: {
          id: id,
        },
      }
    );

    let bankTransactionData, issuedCheckData, payableBulkTransactionData;
    if (description !== "Transfer") {
      [
        bankTransactionData,
        issuedCheckData,
        payableBulkTransactionData,
        payBulkExpensesTransactionData,
      ] = await Promise.all([
        bank_transaction.findAll({
          where: {
            transaction_number: transaction_number,
            id: {
              [Op.ne]: id,
            },
          },
        }),
        issued_check.findAll({
          where: {
            transaction_number: transaction_number,
          },
        }),
        Payable_Bulk_Transaction.findAll({
          include: [
            {
              model: PayableBulk,
              where: {
                transaction_number: transaction_number,
              },
            },
            {
              model: Payable,
            },
          ],
        }),
        PayBulkExpensesTransaction.findAll({
          include: [
            {
              model: PayBulkExpenses,
              where: {
                transaction_number: transaction_number,
              },
            },
            {
              model: Expenses,
            },
          ],
        }),
      ]);
      console.log(
        bankTransactionData?.some((item) => {
          return item.status == "Confirmed";
        })
      );

      const isAllOtherBankTransactionConfirmed = bankTransactionData?.some(
        (item) => {
          return item.status == "Confirmed";
        }
      );

      const isAllOtherIssuedCheckConfirmed = issuedCheckData?.some((item) => {
        return item.status == "Paid";
      });
      console.log(
        issuedCheckData?.some((item) => {
          return item.status == "Paid";
        })
      );
      if (
        isAllOtherBankTransactionConfirmed ||
        isAllOtherIssuedCheckConfirmed ||
        (bankTransactionData.length == 0 && issuedCheckData.length == 0)
      ) {
        if (payableBulkTransactionData.length > 0) {
          for (
            let index = 0;
            index < payableBulkTransactionData.length;
            index++
          ) {
            if (payableBulkTransactionData[index]?.payable?.id !== undefined) {
              await Payable.update(
                {
                  status: "Paid",
                },
                {
                  where: {
                    id: payableBulkTransactionData[index]?.payable?.id,
                  },
                }
              );
            }
          }
        }

        if (payBulkExpensesTransactionData.length > 0) {
          for (
            let index = 0;
            index < payBulkExpensesTransactionData.length;
            index++
          ) {
            if (
              payBulkExpensesTransactionData[index]?.expense?.id !== undefined
            ) {
              await Expenses.update(
                {
                  status: "Paid",
                },
                {
                  where: {
                    id: payBulkExpensesTransactionData[index]?.expense?.id,
                  },
                }
              );
            }
          }
        }
      }
    }

    const [fetchExpensesPayment, checkToUpdate, updateTo] = await Promise.all([
      PayBulkExpensesPayment.findAll({
        include: [
          {
            model: PayBulkExpenses,
            required: true,
            where: { transaction_number },
          },
        ],
        where: {
          is_completed: false,
          account_list_sub3_id: { [Op.ne]: account_list_id_bank_from },
        },
      }),
      accountlist_sub3.findOne({ where: { id: account_list_id_bank_from } }),

      accountlist_sub3.findOne({ where: { id: account_list_id_bank_to } }),
    ]);

    if (!checkToUpdate) {
      return res
        .status(404)
        .json({ success: false, message: "Check not found" });
    }

    const statusToUpdate =
      fetchExpensesPayment.length > 0 ? "Partially-Paid" : "Paid";

    if (module_from == "Liabilities Account") {
      await accountlist_sub3.update(
        { amount: parseFloat(checkToUpdate.amount) - parseFloat(otherAmount) },
        { where: { id: account_list_id_bank_from } }
      ),
        await accountlist_sub3.update(
          {
            amount: parseFloat(updateTo.amount) - parseFloat(otherAmount),
          },
          { where: { id: account_list_id_bank_to } }
        ),
        await bank_transaction.update(
          { status: "Confirmed" },
          { where: { id } }
        );

      accountlist_transaction_subject.create({
        account_list_sub3_id_transacted: account_list_id_bank_from,
        payment_method: "Bank",
        amount,
        date,
        check_or_remarks: "",
        type: "--",
        isTransferOnly: false,
        module_from: module_from,
        transaction_number: "",
        transferred_by: userLoggedID,
        sub_3_to: account_list_id_bank_to,
      });

      accountlist_transaction_subject.create({
        account_list_sub3_id_transacted: account_list_id_bank_to,
        payment_method: "Bank",
        amount,
        date,
        check_or_remarks: "",
        type: "--",
        isTransferOnly: false,
        module_from: module_from,
        transaction_number: "",
        transferred_by: userLoggedID,
        sub_3_to: account_list_id_bank_from,
      });

      return res.status(200).json({});
    }

    const [
      updatedCheck,
      updatedBankTransaction,
      createdTransaction,
      fetchExpensesPaymentToUpdate,
    ] = await Promise.all([
      accountlist_sub3.update(
        { amount: parseFloat(checkToUpdate.amount) - parseFloat(otherAmount) },
        { where: { id: account_list_id_bank_from }, returning: true }
      ),
      bank_transaction.update({ status: "Confirmed" }, { where: { id } }),
      accountlist_transaction_subject.create({
        account_list_sub3_id_transacted: account_list_id_bank_from,
        payment_method: "Bank",
        amount,
        date,
        check_or_remarks: "",
        type: "Credit",
        isTransferOnly:
          module_from === "Account-List" ||
          module_from === "Owner's Equity Account"
            ? true
            : false,
        module_from: module_from,
        transaction_number: transaction_number,
        transferred_by: userLoggedID,
        sub_3_to:
          module_from === "Account-List" ||
          module_from === "Owner's Equity Account"
            ? account_list_id_bank_from
            : null,
      }),
      PayBulkExpensesPayment.findOne({
        include: [
          {
            model: PayBulkExpenses,
            required: true,
            where: { transaction_number },
          },
        ],
        where: { account_list_sub3_id: account_list_id_bank_from },
      }),
    ]);

    if (updatedCheck[0] === 0 || updatedBankTransaction[0] === 0) {
      return res.status(404).json({
        success: false,
        message: "Check or bank transaction not found",
      });
    }

    if (fetchExpensesPaymentToUpdate) {
      await Promise.all([
        fetchExpensesPaymentToUpdate.update({ is_completed: true }),
        PayBulkExpenses.update(
          { status: statusToUpdate },
          { where: { id: fetchExpensesPaymentToUpdate.pay_bulk_id } }
        ),
      ]);

      if (statusToUpdate === "Paid") {
        const fetchtoDeductsAccounts = await PayBulkAddDeductExpenses.findAll({
          include: [
            {
              model: PayBulkExpenses,
              required: true,
              where: { id: fetchExpensesPaymentToUpdate.pay_bulk_id },
            },
          ],
        });

        await Promise.all(
          fetchtoDeductsAccounts.map((expense) =>
            Promise.all([
              ...(expense.loan_or_account === "loan"
                ? [
                    Loan_mother.decrement("amount", {
                      by: parseFloat(expense.amount),
                      where: { id: expense.loan_id },
                    }),
                    Loan_history.create({
                      loan_id: expense.loan_id,
                      transaction_number: transaction_number,
                      module: module_from,
                      amount_deducted: expense.amount,
                      date_deducted: date,
                      deduction_rate: expense.rate,
                    }),
                  ]
                : [
                    accountlist_sub3.decrement("amount", {
                      by: parseFloat(expense.amount),
                      where: { id: expense.account_list_sub3_id },
                    }),
                    accountlist_transaction_subject.create({
                      account_list_sub3_id_transacted:
                        expense.account_list_sub3_id,
                      payment_method: "",
                      amount: expense.amount,
                      date,
                      check_or_remarks: "",
                      type: "Credit",
                      isTransferOnly:
                        module_from === "Account-List" ||
                        module_from === "Owner's Equity Account"
                          ? true
                          : false,
                      module_from: module_from,
                      transaction_number: transaction_number,
                      transferred_by: userLoggedID,
                      sub_3_to:
                        module_from === "Account-List" ||
                        module_from === "Owner's Equity Account"
                          ? account_list_id_bank_from
                          : null,
                    }),
                  ]),
            ])
          )
        );
      }
    }

    // if (description !== "Transfer") {
    //   if (
    //     bankTransactionData.length == 0 &&
    //     issuedCheckData.length == 0 &&
    //     payableBulkTransactionData[0].payable.id !== undefined
    //   ) {
    //     await Payable.update(
    //       {
    //         status: "Paid",
    //       },
    //       {
    //         where: {
    //           id: payableBulkTransactionData[0].payable.id,
    //         },
    //       }
    //     );
    //   }
    // }

    if (bankTransactionRowData && currencyRate) {
      await ProfitLossReport.create({
        bank_transaction_id: bankTransactionRowData.id,
        currency_id:
          bankTransactionRowData.account_list_id_bank_froms.currency.id,
        currency_rate: currencyRate,
        transaction_date: bankTransactionRowData.transaction_date,
      });
    }

    const action =
      description == "Transfer"
        ? "confirmed fund transfer"
        : description == "Payments"
        ? `confirmed a bank transaction with transaction number ${transaction_number}`
        : description == "Returning Capital"
        ? "confirmed a return of capital"
        : `confirmed a bank transaction with transaction number ${transaction_number}`;

    await Activity_Log.create({
      masterlist_id: userLoggedID,
      action_taken: `Bank Transaction: User ${action}`,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// router.route("/confirmBankTransactionxx").post(async (req, res) => { // not optimize
//   try {
//     const { id, account_list_id_bank_from, amount, date, transaction_number } =
//       req.body;
//     // console.log(id, account_list_id_issued_from, amount);

//     let statusToUpdate = "--";

//     const fetchExpensesPayment = await PayBulkExpensesPayment.findAll({
//       include: [
//         {
//           model: PayBulkExpenses,
//           required: true,
//           where: {
//             transaction_number: transaction_number,
//           },
//         },
//       ],
//       where: {
//         is_completed: false,
//         account_list_sub3_id: {
//           [Op.ne]: [account_list_id_bank_from],
//         },
//       },
//     });

//     if (fetchExpensesPayment && fetchExpensesPayment.length > 0) {
//       // if meron pang pending sa issued check na kasama sa transaction

//       statusToUpdate = "Partially-Paid";
//     } else {
//       //if WALA na pending sa issued check na kasama sa transaction

//       statusToUpdate = "Paid";
//     }

//     // Fetch the check first to get its current amount
//     const checkToUpdate = await accountlist_sub3.findOne({
//       where: { id: account_list_id_bank_from },
//     });

//     if (!checkToUpdate) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Check not found" });
//     }

//     const [updatedCheck, updatedIssuedCheck] = await Promise.all([
//       accountlist_sub3.update(
//         { amount: parseFloat(checkToUpdate.amount) - parseFloat(amount) },
//         { where: { id: account_list_id_bank_from }, returning: true }
//       ),
//       bank_transaction.update({ status: "Confirmed" }, { where: { id: id } }),
//     ]);

//     if (updatedCheck[0] === 0 || updatedIssuedCheck[0] === 0) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Check or issued check not found" });
//     }

//     await accountlist_transaction_subject.create({
//       account_list_sub3_id_transacted: account_list_id_bank_from,
//       payment_method: "Bank",
//       amount: amount,
//       date: date,
//       check_or_remarks: "",
//       type: "Credit",
//     });

//     const fetchExpensesPaymentToUpdate = await PayBulkExpensesPayment.findOne({
//       include: [
//         {
//           model: PayBulkExpenses,
//           required: true,
//           where: {
//             transaction_number: transaction_number,
//           },
//         },
//       ],
//       where: {
//         account_list_sub3_id: account_list_id_bank_from,
//       },
//     });

//     if (fetchExpensesPaymentToUpdate) {
//       await fetchExpensesPaymentToUpdate.update({ is_completed: true });
//     }

//     await PayBulkExpenses.update(
//       { status: statusToUpdate },
//       { where: { id: fetchExpensesPaymentToUpdate.pay_bulk_id } }
//     );

//     if (statusToUpdate === "Paid") {
//       const fetchtoDeductsAccounts = await PayBulkAddDeductExpenses.findAll({
//         include: [
//           {
//             model: PayBulkExpenses,
//             required: true,
//             where: {
//               id: fetchExpensesPaymentToUpdate.pay_bulk_id,
//             },
//           },
//         ],
//       });

//       fetchtoDeductsAccounts.forEach(async (expense) => {
//         await accountlist_sub3.decrement("amount", {
//           by: parseFloat(expense.amount),
//           where: { id: expense.account_list_sub3_id },
//         });

//         await accountlist_transaction_subject.create({
//           account_list_sub3_id_transacted: expense.account_list_sub3_id,
//           payment_method: "",
//           amount: expense.amount,
//           date: date,
//           check_or_remarks: "",
//           type: "Credit",
//         });
//       });
//     }

//     return res.status(200).json({ success: true });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false });
//   }
// });
//for claiming bank transaction local collections
// router.route("/claimBankTransaction").post(async (req, res) => {
//   try {
//     const { id, account_list_id_bank_to, amount } = req.body;
//     const checkAccount = await accountlist_sub3.findOne({
//       where: { id: account_list_id_bank_to },
//     });

//     if (!checkAccount) {
//       return res.status(400).json({ success: false, message: "Bank transaction not found" });
//     }

//     checkAccount.amount += amount;

//     await checkAccount.save();

//     const bankTransac = await bank_transaction.findOne({
//       where: { id: id },
//     });

//     if (!bankTransac) {
//       return res.status(404).json({ success: false, message: "Bank transaction not found" });
//     }

//     bankTransac.status = "Claimed";

//     await bankTransac.save();

//     return res.status(200).json({
//       success: true,
//       message: "Amount and status updated successfully",
//       data: { checkAccount, bankTransac }
//     });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// });

module.exports = router;
