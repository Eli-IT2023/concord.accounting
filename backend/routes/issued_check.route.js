const router = require("express").Router();
const { where, Op, fn, col, literal } = require("sequelize");
const sequelize = require("../db/config/sequelize.config");
const { getIssuedTo } = require("../services/accounts/issuedTo.helper");
const {
  issued_check,
  accountlist_sub3,
  accountlist_transaction_subject,
  bank_transaction,
  accountlist_base_subject,
  CashFlow,
} = require("../db/models/ModelsBySubject/associations_sub");
const {
  PayBulkExpenses,
  PayBulkExpensesPayment,
  PayBulkAddDeductExpenses,
  Payable_Bulk_Transaction,
  PayableBulk,
  Payable,
  Cutoff,
  Payable_Payment,
  Activity_Log,
  PayBulkExpensesTransaction,
  Expenses,
  Loan_mother,
  Loan_history,
  Currency,
} = require("../db/models/associations");

const session = require("express-session");
const ProfitLossReport = require("../db/models/profit_loss_report.model");
const BankTransaction = require("../db/models/bank_transaction.model");
const IssuedCheck = require("../db/models/issued_check.model");
const PayableJournal = require("../db/models/payable_journal.model");
const { expense } = require("../services");
const CheckJournal = require("../db/models/check_journal.model");

router.route("/getFilteredIssuedCheck").get(async (req, res) => {
  try {
    const { startDate, endDate, accountsName, filterColumn, searchText } =
      req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    let whereClause = {
      transaction_date: {
        [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
      },
    };
    let accountListSub3WhereClause = {};
    const issuedCheckTableColumn = [
      "transaction_date",
      "check_number",
      "transaction_number",
      "createdAt",
      "module_from",
      "description",
      "amount",
      "account_list_id_issued_froms",
      "account_list_id_issued_tos",
      "status",
    ];
    if (searchText && searchText.trim() !== "") {
      switch (filterColumn) {
        // Filter Issued date
        case "issued_date":
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
        // Filter check number
        case "check_number":
          whereClause["check_number"] = {
            [Op.like]: `%${searchText}%`,
          };
          break;
        // Filter transaction number
        case "transaction_number":
          whereClause["transaction_number"] = {
            [Op.like]: `%${searchText}%`,
          };
          break;
        // Filter created date
        case "created_date":
          whereClause = {
            [Op.and]: [
              {
                transaction_date: {
                  [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
                },
              },
              sequelize.where(
                literal(`CAST (issued_check.createdAt AS CHAR)`),
                {
                  [Op.like]: `%${searchText}%`,
                }
              ),
            ],
          };
          break;
        // Filter issued to
        case "issued_to":
          whereClause["$account_list_id_issued_tos.account_name$"] = {
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
              sequelize.where(literal(`CAST (issued_check.amount AS CHAR)`), {
                [Op.like]: `%${searchText}%`,
              }),
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
          whereClause["$account_list_id_issued_froms.account_name$"] = {
            [Op.like]: `%${searchText}%`,
          };
          break;
        default:
          whereClause = {
            [Op.and]: [
              {
                transaction_date: {
                  [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
                },
              },
              {
                [Op.or]: issuedCheckTableColumn.map((col) => {
                  switch (col) {
                    case "transaction_date":
                      return sequelize.where(
                        literal(`CAST (transaction_date AS CHAR)`),
                        {
                          [Op.like]: `%${searchText}%`,
                        }
                      );
                    case "createdAt":
                      return sequelize.where(
                        literal(`CAST (issued_check.createdAt AS CHAR)`),
                        {
                          [Op.like]: `%${searchText}%`,
                        }
                      );
                    case "amount":
                      return sequelize.where(
                        literal(`CAST (issued_check.amount AS CHAR)`),
                        {
                          [Op.like]: `%${searchText}%`,
                        }
                      );
                    case "account_list_id_issued_froms":
                    case "account_list_id_issued_tos":
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
                  }
                }),
              },
            ],
          };
          break;
      }
    }
    if (accountsName) {
      whereClause.account_list_id_issued_from = accountsName;
    }
    let { count, rows: issuedCheck } = await issued_check.findAndCountAll({
      attributes: {
        include: [
          // Subquery: Get the bulk expense transaction date
          [
            sequelize.literal(`(
              SELECT pbe.pay_date
              FROM pay_bulk_expenses as pbe
              WHERE pbe.transaction_number = issued_check.transaction_number
              LIMIT 1
            )`),
            "expense_transaction_date",
          ],
          // Subquery: Get the bulk payable transaction date
          [
            sequelize.literal(`(
              SELECT pb.payable_date
              FROM payable_bulks as pb
              WHERE pb.transaction_number = issued_check.transaction_number
              LIMIT 1
            )`),
            "payable_transaction_date",
          ],
        ],
      },
      include: [
        {
          model: accountlist_sub3,
          required: false,
          as: "account_list_id_issued_froms",
          attributes: ["account_name"],
          foreignKey: "account_list_id_issued_from",
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
          as: "account_list_id_issued_tos",
          attributes: ["account_name"],
          foreignKey: "account_list_id_issued_to",
          // where: accountListSub3WhereClause,
        },
      ],
      where: { ...whereClause, isDeleted: false },
      order: [["createdAt", "DESC"]],
      subQuery: false,
      limit: limit,
      offset: offset,
    });

    // if (filterColumn === "issued_to" && searchText !== "") {
    //   const filteredCashflow = issuedCheck.filter((col) => {
    //     return col.account_list_id_issued_tos !== null;
    //   });
    //   return res.json(filteredCashflow);
    // }

    // if (issuedCheck.length === 0 && filterColumn === "all") {
    //   accountListSub3WhereClause = {};
    //   whereClause = {
    //     transaction_date: {
    //       [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
    //     },
    //   };
    //   accountListSub3WhereClause["account_name"] = {
    //     [Op.like]: `%${searchText}%`,
    //   };
    //   // Conditionally add account_list_id_issued_from if accountsName is provided
    //   if (accountsName) {
    //     whereClause.account_list_id_issued_from = accountsName;
    //   }

    //   issuedCheck = await issued_check.findAll({
    //     include: [
    //       {
    //         model: accountlist_sub3,
    //         required: false,
    //         as: "account_list_id_issued_froms",
    //         attributes: ["account_name"],
    //         foreignKey: "account_list_id_issued_from",
    //       },
    //       {
    //         model: accountlist_sub3,
    //         required: false,
    //         as: "account_list_id_issued_tos",
    //         attributes: ["account_name"],
    //         foreignKey: "account_list_id_issued_to",
    //         where: accountListSub3WhereClause,
    //       },
    //     ],
    //     where: whereClause,
    //   });
    //   const filteredCashflow = issuedCheck.filter((col) => {
    //     return col.account_list_id_issued_tos !== null;
    //   });
    //   return res.json(filteredCashflow);
    // }

    // Add Exchange Rate Used and Converted Amount to Data Table
    // commented kasi nag add ako service para ma fetch ang issuedto if from supplier or expenses
    // issuedCheck = issuedCheck.map((item) => {
    //   const exchangeRate =
    //     item.account_list_id_issued_froms?.currency?.currency_rate;
    //   const convertedAmount = item.amount * exchangeRate;
    //   const currencyName =
    //     item.account_list_id_issued_froms?.currency?.currency_name;

    //   const transactionNumber = item.transaction_number;
    //   const module_type = item.module_from;

    //   return {
    //     ...item.toJSON(),
    //     exchangeRate,
    //     currencyName,
    //     convertedAmount,
    //   };
    // });

    issuedCheck = await Promise.all(
      issuedCheck.map(async (item) => {
        const exchangeRate =
          item.account_list_id_issued_froms?.currency?.currency_rate;

        const convertedAmount = item.amount * exchangeRate;

        const currencyName =
          item.account_list_id_issued_froms?.currency?.currency_name;

        const transactionNumber = item.transaction_number;
        const module_type = item.module_from;

        // ✅ ONE LINE CALL
        const getInfos = await getIssuedTo(transactionNumber, module_type);
        // console.log("ISSUED TO", getInfos);

        return {
          ...item.toJSON(),
          exchangeRate,
          currencyName,
          convertedAmount,
          issuedTo: getInfos.issuedTo || "N/A",
        };
      })
    );

    // console.log("ISSUED CHECK", issuedCheck);

    if (issuedCheck) {
      return res.json({
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page || 1),
        data: issuedCheck,
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/getAccountListSub3").get(async (req, res) => {
  try {
    const data = await accountlist_sub3.findAll({
      include: [
        {
          model: accountlist_base_subject,
          required: true,
        },
      ],
      where: {
        isDeleted: false,
      },
    });
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.route("/validateIssuedCheck/:id").get(async (req, res) => {
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

router.route("/payIssuedCheck").post(async (req, res) => {
  try {
    const {
      id,
      account_list_id_issued_from,
      amount,
      checkNo,
      date,
      transaction_number,
      module_from,
      description,
      userLoggedID,
      issuedCheckRowData,
      currencyRate,
      amountToDeduct,
      account_list_id_issued_to,
    } = req.body;

    const otherAmount = amountToDeduct != 0 ? amountToDeduct : amount;

    console.log("IDD", id);

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

    const isPosted = findCutoff?.isPosted || false;

    if (isPosted) {
      return res.status(409).json({ message: "Cutoff is already posted" });
    }

    await issued_check.update(
      {
        confirmed_by: userLoggedID,
      },
      {
        where: {
          id: id,
        },
      }
    );
    console.log(transaction_number);

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
          },
        }),
        issued_check.findAll({
          where: {
            transaction_number: transaction_number,
            id: {
              [Op.ne]: id,
            },
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

    // Fetch the check and expenses payment in parallel
    const [checkToUpdate, fetchExpensesPayment, updateTo] = await Promise.all([
      accountlist_sub3.findOne({
        where: { id: account_list_id_issued_from },
      }),
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
          account_list_sub3_id: { [Op.ne]: account_list_id_issued_from },
        },
      }),
      accountlist_sub3.findOne({ where: { id: account_list_id_issued_to } }),
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
        { where: { id: account_list_id_issued_from } }
      ),
        await accountlist_sub3.update(
          {
            amount: parseFloat(updateTo.amount) - parseFloat(otherAmount),
          },
          { where: { id: account_list_id_issued_to } }
        ),
        await issued_check.update({ status: "Confirmed" }, { where: { id } });

      await accountlist_transaction_subject.create({
        account_list_sub3_id_transacted: account_list_id_issued_from,
        payment_method: "Bank",
        amount,
        date,
        check_or_remarks: "",
        type: "--",
        isTransferOnly: false,
        module_from: module_from,
        transaction_number: "",
        transferred_by: userLoggedID,
        sub_3_to: account_list_id_issued_to,
        rate: currencyRate,
      });

      accountlist_transaction_subject.create({
        account_list_sub3_id_transacted: account_list_id_issued_to,
        payment_method: "Bank",
        amount,
        date,
        check_or_remarks: "",
        type: "--",
        isTransferOnly: false,
        module_from: module_from,
        transaction_number: "",
        transferred_by: userLoggedID,
        sub_3_to: account_list_id_issued_from,
        rate: currencyRate,
      });

      await BankTransaction.create({
        transaction_date: date,
        transaction_number: transaction_number,
        account_list_id_bank_from: account_list_id_issued_from,
        account_list_id_bank_to: account_list_id_issued_to,
        module_from: "Issued Check",
        amount: amount,
        status: "Confirmed",
        confirmed_by: userLoggedID,
      });

      return res.status(200).json({});
    }

    // Update check, issued check, and create transaction in parallel
    const [updatedCheck, updatedIssuedCheck, createdTransaction] =
      await Promise.all([
        accountlist_sub3.update(
          {
            amount: parseFloat(checkToUpdate.amount) - parseFloat(otherAmount),
          },
          { where: { id: account_list_id_issued_from }, returning: true }
        ),
        issued_check.update({ status: "Paid" }, { where: { id } }),
        accountlist_transaction_subject.create({
          account_list_sub3_id_transacted: account_list_id_issued_from,
          payment_method: "Bank",
          amount,
          date,
          check_or_remarks: checkNo,
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
              ? account_list_id_issued_to
              : null,
          rate: currencyRate,
        }),
        BankTransaction.create({
          transaction_date: date,
          transaction_number: transaction_number,
          account_list_id_bank_from: account_list_id_issued_from,
          module_from: "Issued Check",
          amount: amount,
          status: "Confirmed",
          confirmed_by: userLoggedID,
          description: module_from === "Account-List" ? "Transfer" : null,
          account_list_id_bank_to: transaction_number.includes("TRANSFER-")
            ? account_list_id_issued_to
            : module_from === "Account-List" ||
              module_from === "Owner's Equity Account"
            ? account_list_id_issued_from
            : null,
          amount_to_deduct:
            module_from === "Account-List" && issuedCheckRowData
              ? issuedCheckRowData.amount_to_deduct
              : null,
          rate:
            module_from === "Account-List" && issuedCheckRowData
              ? issuedCheckRowData.rate
              : null,
          orig_rate:
            module_from === "Account-List" && issuedCheckRowData
              ? issuedCheckRowData.orig_rate
              : null,
        }),
      ]);

    console.log(account_list_id_issued_from, "issuedfrom=======");

    if (updatedCheck[0] === 0 || updatedIssuedCheck[0] === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Check or issued check not found" });
    }

    const fetchExpensesPaymentToUpdate = await PayBulkExpensesPayment.findOne({
      include: [
        {
          model: PayBulkExpenses,
          required: true,
          where: { transaction_number },
        },
      ],
      where: { account_list_sub3_id: account_list_id_issued_from },
    });

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
        // New to deduct additional/deduction expenses
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
                          ? account_list_id_issued_from
                          : null,
                      rate: currencyRate,
                    }),
                  ]),
            ])
          )
        );
        // old to deduct additional/deduction expenses
        // await Promise.all(
        //   fetchtoDeductsAccounts.map(async (expense) => {
        //     await Promise.all([
        //       accountlist_sub3.decrement("amount", {
        //         by: parseFloat(expense.amount),
        //         where: { id: expense.account_list_sub3_id },
        //       }),
        //       accountlist_transaction_subject.create({
        //         account_list_sub3_id_transacted: expense.account_list_sub3_id,
        //         payment_method: "",
        //         amount: expense.amount,
        //         date,
        //         check_or_remarks: "",
        //         type: "Credit",
        //         isTransferOnly:
        //           module_from === "Account-List" ||
        //           module_from === "Owner's Equity Account"
        //             ? true
        //             : false,
        //         module_from: module_from,
        //         transaction_number: transaction_number,
        //       }),
        //     ]);
        //   })
        // );
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

    if (issuedCheckRowData && currencyRate) {
      await ProfitLossReport.create({
        issued_check_id: issuedCheckRowData.id,
        currency_id:
          issuedCheckRowData.account_list_id_issued_froms.currency.id,
        currency_rate: currencyRate,
        transaction_date: issuedCheckRowData.transaction_date,
      });
    }

    const action =
      description == "Transfer"
        ? `confirmed fund transfer with a check number ${checkNo}`
        : description == "Payments"
        ? `confirmed payment with issued check number ${checkNo} and transaction number ${transaction_number}`
        : description == "Returning Capital"
        ? `confirmed a return of capital with a check number ${checkNo}`
        : `confirmed issued check number ${checkNo} with transaction number ${transaction_number}`;

    await Activity_Log.create({
      masterlist_id: userLoggedID,
      action_taken: `Issued Check : User ${action}`,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

router.route("/v2/payIssuedCheck").post(async (req, res) => {
  try {
    const {
      id,
      account_list_id_issued_from,
      amount,
      checkNo,
      date,
      transaction_number,
      module_from,
      description,
      userLoggedID,
      issuedCheckRowData,
      amountToDeduct,
      account_list_id_issued_to,
      currencyName,
      currencyRate,
      rowData,
    } = req.body;

    const otherAmount = amountToDeduct != 0 ? amountToDeduct : amount;

    console.log("IDD", id);

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

    const isPosted = findCutoff?.isPosted || false;

    if (isPosted) {
      return res.status(409).json({ message: "Cutoff is already posted" });
    }

    await issued_check.update(
      {
        confirmed_by: userLoggedID,
      },
      {
        where: {
          id: id,
        },
      }
    );

    // Fetch the check and expenses payment in parallel
    const [checkToUpdate, fetchExpensesPayment, updateTo] = await Promise.all([
      accountlist_sub3.findOne({
        where: { id: account_list_id_issued_from },
      }),
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
          account_list_sub3_id: { [Op.ne]: account_list_id_issued_from },
        },
      }),
      accountlist_sub3.findOne({ where: { id: account_list_id_issued_to } }),
    ]);

    if (!checkToUpdate) {
      return res
        .status(404)
        .json({ success: false, message: "Check not found" });
    }

    const statusToUpdate = fetchExpensesPayment?.length
      ? "Partially-Paid"
      : "Paid";

    if (module_from == "Liabilities Account") {
      await accountlist_sub3.update(
        { amount: parseFloat(checkToUpdate.amount) - parseFloat(otherAmount) },
        { where: { id: account_list_id_issued_from } }
      ),
        await accountlist_sub3.update(
          {
            amount: parseFloat(updateTo.amount) - parseFloat(otherAmount),
          },
          { where: { id: account_list_id_issued_to } }
        ),
        await issued_check.update({ status: "Confirmed" }, { where: { id } });

      // Account destination of the payment
      const recipient = await accountlist_sub3.findOne({
        attributes: [[sequelize.col("module_type"), "moduleType"]],
        include: [
          {
            model: accountlist_base_subject,
            required: true,
          },
        ],
        where: {
          id: account_list_id_issued_from,
          isDeleted: false,
        },
        raw: true,
      });

      await accountlist_transaction_subject.create({
        account_list_sub3_id_transacted: account_list_id_issued_from,
        payment_method: "Bank",
        amount,
        date,
        check_or_remarks: "",
        type: "Credit",
        isTransferOnly: false,
        module_from: recipient.moduleType,
        transaction_number: "",
        transferred_by: userLoggedID,
        sub_3_to: account_list_id_issued_to,
        rate: currencyRate,
      });

      accountlist_transaction_subject.create({
        account_list_sub3_id_transacted: account_list_id_issued_to,
        payment_method: "Bank",
        amount,
        date,
        check_or_remarks: "",
        type: "Credit",
        isTransferOnly: false,
        module_from: module_from,
        transaction_number: "",
        transferred_by: userLoggedID,
        sub_3_to: account_list_id_issued_from,
        rate: currencyRate,
      });

      await BankTransaction.create({
        transaction_date: date,
        transaction_number: transaction_number,
        account_list_id_bank_from: account_list_id_issued_from,
        account_list_id_bank_to: account_list_id_issued_to,
        module_from: "Issued Check",
        amount: amount,
        status: "Confirmed",
        confirmed_by: userLoggedID,
      });

      return res.status(200).json({});
    }

    // Update check, issued check, and create transaction in parallel
    const [updatedCheck, updatedIssuedCheck, createdTransaction] =
      await Promise.all([
        accountlist_sub3.update(
          {
            amount: parseFloat(checkToUpdate.amount) - parseFloat(otherAmount),
          },
          { where: { id: account_list_id_issued_from }, returning: true }
        ),
        issued_check.update({ status: "Paid" }, { where: { id } }),
        accountlist_transaction_subject.create({
          account_list_sub3_id_transacted: account_list_id_issued_from,
          payment_method: "Bank",
          amount,
          date,
          check_or_remarks: checkNo,
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
              ? account_list_id_issued_to
              : null,
          rate: currencyRate,
        }),
        BankTransaction.create({
          transaction_date: date,
          transaction_number: transaction_number,
          account_list_id_bank_from: account_list_id_issued_from,
          module_from: "Issued Check",
          amount: amount,
          status: "Confirmed",
          confirmed_by: userLoggedID,
          description: module_from === "Account-List" ? "Transfer" : null,
          account_list_id_bank_to: transaction_number.includes("TRANSFER-")
            ? account_list_id_issued_to
            : module_from === "Account-List" ||
              module_from === "Owner's Equity Account"
            ? account_list_id_issued_from
            : null,
          amount_to_deduct:
            module_from === "Account-List" && issuedCheckRowData
              ? issuedCheckRowData.amount_to_deduct
              : null,
          rate:
            module_from === "Account-List" && issuedCheckRowData
              ? issuedCheckRowData.rate
              : null,
          orig_rate:
            module_from === "Account-List" && issuedCheckRowData
              ? issuedCheckRowData.orig_rate
              : null,
        }),
      ]);

    if (updatedCheck[0] === 0 || updatedIssuedCheck[0] === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Check or issued check not found" });
    }

    const fetchExpensesPaymentToUpdate = await PayBulkExpensesPayment.findOne({
      include: [
        {
          model: PayBulkExpenses,
          required: true,
          where: { transaction_number },
        },
      ],
      where: { account_list_sub3_id: account_list_id_issued_from },
    });

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
        // New to deduct additional/deduction expenses
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
                          ? account_list_id_issued_from
                          : null,
                      rate: currencyRate,
                    }),
                  ]),
            ])
          )
        );
        // old to deduct additional/deduction expenses
        // await Promise.all(
        //   fetchtoDeductsAccounts.map(async (expense) => {
        //     await Promise.all([
        //       accountlist_sub3.decrement("amount", {
        //         by: parseFloat(expense.amount),
        //         where: { id: expense.account_list_sub3_id },
        //       }),
        //       accountlist_transaction_subject.create({
        //         account_list_sub3_id_transacted: expense.account_list_sub3_id,
        //         payment_method: "",
        //         amount: expense.amount,
        //         date,
        //         check_or_remarks: "",
        //         type: "Credit",
        //         isTransferOnly:
        //           module_from === "Account-List" ||
        //           module_from === "Owner's Equity Account"
        //             ? true
        //             : false,
        //         module_from: module_from,
        //         transaction_number: transaction_number,
        //       }),
        //     ]);
        //   })
        // );
      }
    }

    // --- Update Payable/PayableBulk/Expense Status to "Paid" or "Partially-Paid"
    if (description === "" || description !== "Transfer") {
      // Payable/PayableBulk: Get total amount to be paid and identify all Payables for status update
      const getPayableTotalAndIds = async () => {
        const payableBulk = await PayableBulk.findOne({
          attributes: ["id", "total_amount", "vendor_id"],
          where: { transaction_number, isDeleted: false },
          include: [
            {
              model: Payable_Bulk_Transaction,
              attributes: ["payable_id"],
              where: { isDeleted: false },
              required: true,
            },
          ],
        });

        const payableIdList = payableBulk.payable_bulk_transactions.map(
          (item) => item.payable_id
        );

        return {
          totalAmount: payableBulk.total_amount || 0,
          payableIdList,
          payableBulkId: payableBulk.id,
          vendorId: payableBulk.vendor_id,
        };
      };

      // Expenses: Get total amount to be paid, identify all Expenses and get PayBulkExpenses id for status update
      const getExpenseTotalAndIds = async () => {
        const { id, totalAmount } = await PayBulkExpenses.findOne({
          attributes: ["id", "totalAmount"],
          where: {
            transaction_number,
            isDeleted: false,
          },
          raw: true,
        });

        const [totalPayment, expensesIds] = await Promise.all([
          PayBulkExpensesPayment.sum("amount", {
            where: {
              pay_bulk_id: id,
              isDeleted: false,
            },
          }),
          PayBulkExpensesTransaction.findAll({
            attributes: ["expenses_id"],
            where: {
              pay_bulk_id: id,
              isDeleted: false,
            },
            raw: true,
          }),
        ]);

        return {
          totalAmount,
          expenseIdList: expensesIds.map((item) => item.expenses_id),
          expenseBulkId: id,
        };
      };

      // Status update
      const updateStatus = async (Model, isPaid, ids) => {
        const idList = Array.isArray(ids) ? ids : [ids];
        await Model.update(
          {
            status: isPaid ? "Paid" : "Partially-Paid",
          },
          {
            where: {
              id: {
                [Op.in]: idList,
              },
            },
          }
        );
      };

      // Check Payments to determine the status if "Partially-Paid" or "Paid"
      const calculateTotalPayment = async () => {
        const [issuedTotal = 0, bankTotal = 0, cashTotal = 0] =
          await Promise.all([
            issued_check.sum("amount", {
              where: {
                transaction_number,
                status: "Paid",
                isDeleted: false,
              },
            }),

            bank_transaction.sum("amount", {
              where: {
                transaction_number,
                module_from: {
                  [Op.ne]: "Issued Check",
                },
                status: "Confirmed",
                isDeleted: false,
              },
            }),

            CashFlow.sum("amount", {
              where: {
                transaction_number,
                status: "Paid",
                isDeleted: false,
              },
            }),
          ]);

        return issuedTotal + bankTotal + cashTotal;
      };

      const confirmPaymentStatus = async (module_from) => {
        const totalPayment = await calculateTotalPayment();

        const type = module_from?.toLowerCase() || "";

        // For Payable/PayableBulk module
        if (type.includes("payable")) {
          const { totalAmount, payableIdList, payableBulkId, vendorId } = await getPayableTotalAndIds(); // prettier-ignore
          const isPaid = totalAmount === totalPayment;

          await Promise.all([
            updateStatus(Payable, isPaid, payableIdList),
            updateStatus(PayableBulk, isPaid, payableBulkId),
          ]);

          // Create a payable journal for purchase report
          await PayableJournal.create({
            transaction_number: transaction_number,
            vendor_id: vendorId,
            date,
            total_amount: amount,
            total_quantity: 0,
            avg_unit_price: 0,
            payment_type: "Credit",
            currency_name: currencyName,
            currency_rate: currencyRate,
          });

          // Create a check journal "Credit" entry for trial balance
          await CheckJournal.create({
            module_from,
            transaction_number,
            transaction_date: rowData.payable_transaction_date,
            issued_date: rowData.transaction_date,
            type: "Credit",
            amount,
            check_number: checkNo,
            currency_name: currencyName,
            currency_rate: currencyRate,
          });

          console.log("Payable: ");
          console.log("Amount to Pay", totalAmount);
          console.log("Total Payment", totalPayment);
        }

        // For Expense/PayBulkExpense module
        if (type.includes("expense")) {
          const { totalAmount, expenseIdList, expenseBulkId } = await getExpenseTotalAndIds(); // prettier-ignore
          const isPaid = totalAmount === totalPayment;

          await Promise.all([
            // updateStatus(Expenses, isPaid, expenseIdList),
            updateStatus(PayBulkExpenses, isPaid, expenseBulkId),
          ]);

          // --- For expense journal ---
          const transactionList =
            await expense.expenseService.getUnpaidExpenses({
              transactionNumber: transaction_number,
              transaction: null,
            });

          const expenseTransactions =
            expense.expenseHelpers.buildExpenseTransactions(transactionList);

          const paymentData = {
            amount: rowData.amount,
            date_issued: rowData.transaction_date,
            currencyName,
            currencyRate,
          };

          await expense.expenseService.applyPayment({
            paymentData,
            expenseTransactions,
            transaction: null,
          });

          // --- For check journal ---

          // Create a check journal "Credit" entry for trial balance
          await CheckJournal.create({
            module_from,
            transaction_number,
            transaction_date: rowData.expense_transaction_date,
            issued_date: rowData.transaction_date,
            type: "Credit",
            amount,
            check_number: checkNo,
            currency_name: currencyName,
            currency_rate: currencyRate,
          });

          console.log("Expense: ");
          console.log("Amount to Pay", totalAmount);
          console.log("Total Payment", totalPayment);
        }
      };

      await confirmPaymentStatus(module_from);
    }

    if (issuedCheckRowData && currencyRate) {
      await ProfitLossReport.create({
        issued_check_id: issuedCheckRowData.id,
        currency_id:
          issuedCheckRowData.account_list_id_issued_froms.currency.id,
        currency_rate: currencyRate,
        transaction_date: issuedCheckRowData.transaction_date,
      });
    }

    const action =
      description == "Transfer"
        ? `confirmed fund transfer with a check number ${checkNo}`
        : description == "Payments"
        ? `confirmed payment with issued check number ${checkNo} and transaction number ${transaction_number}`
        : description == "Returning Capital"
        ? `confirmed a return of capital with a check number ${checkNo}`
        : `confirmed issued check number ${checkNo} with transaction number ${transaction_number}`;

    await Activity_Log.create({
      masterlist_id: userLoggedID,
      action_taken: `Issued Check : User ${action}`,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// router.route("/deleteCollection/:issuedCheckId/:issuedCheckDate").delete(async (req, res) => {
//     try {
//       const id = req.params.issuedCheckId;
//       const checkIssuedDate = req.params.issuedCheckDate;

//       const getCutoff = await Cutoff.findOne({
//         where: {
//           [Op.and]: [
//             {
//               from: {
//                 [Op.lte]: checkIssuedDate,
//               },
//             },
//             {
//               to: {
//                 [Op.gte]: checkIssuedDate,
//               },
//             },
//           ],
//         },
//       });
//       const {
//         from: dateFrom,
//         to: dateTo,
//         isPosted: postedCutoff,
//         name: CutoffName,
//       } = getCutoff;

//       const getIssued = await issued_check.findOne({
//         where: { id: id },
//       });

//       const transacDate = new Date(getIssued.transaction_date);
//       const cutoffFrom = new Date(dateFrom);
//       const cutoffTo = new Date(dateTo);

//       if (postedCutoff == true) {
//         if (transacDate >= cutoffFrom && transacDate <= cutoffTo) {
//           return res.status(202).json({
//             success: false,
//             transacDate: getIssued.transaction_date,
//             CutoffName: CutoffName,
//           });
//         }
//       }

//       const getPaymentIssued = await issued_check.findOne({
//         where: { id: id },
//       });

//       const {
//         amount: amountToPay,
//         module_from: moduleType,
//         transaction_number: transactionNumber,
//         check_number: checkNumber,
//         transaction_date: transactionDate,
//         account_list_id_issued_from: accountlistId,
//         status: issuedStatus,
//       } = getPaymentIssued;

//       if (issuedStatus == "Paid") {
//         const increaseAmount = await accountlist_sub3.increment(
//           { amount: amountToPay },
//           { where: { id: accountlistId } }
//         );

//         if (increaseAmount) {
//           await accountlist_transaction_subject.destroy({
//             where: {
//               account_list_sub3_id_transacted: accountlistId,
//               date: transactionDate,
//               check_or_remarks: checkNumber,
//             },
//           });
//         }
//         if (
//           moduleType == "Local Expenses" ||
//           moduleType == "Overseas Expenses"
//         ) {
//           await PayBulkExpensesPayment.destroy({
//             where: {
//               account_list_sub3_id: accountlistId,
//               check_number: checkNumber,
//               date_issued: transactionDate,
//             },
//           });
//         } else if (
//           moduleType == "Local Payable" ||
//           moduleType == "Overseas Payable"
//         ) {
//           await Payable_Payment.destroy({
//             accountList_id: accountlistId,
//             check_number: checkNumber,
//             date_issued: transactionDate,
//           });
//         }
//         return res
//           .status(200)
//           .json({ success: true, message: "Deleted successfully" });
//       } else {
//         if (
//           moduleType == "Local Expenses" ||
//           moduleType == "Overseas Expenses"
//         ) {
//           await PayBulkExpensesPayment.destroy({
//             where: {
//               account_list_sub3_id: accountlistId,
//               check_number: checkNumber,
//               date_issued: transactionDate,
//             },
//           });
//         } else if (
//           moduleType == "Local Payable" ||
//           moduleType == "Overseas Payable"
//         ) {
//           await Payable_Payment.destroy({
//             accountList_id: accountlistId,
//             check_number: checkNumber,
//             date_issued: transactionDate,
//           });
//         }
//         return res
//           .status(200)
//           .json({ success: true, message: "Deleted successfully" });
//       }
//     } catch (error) {
//       console.error(error);
//       return res
//         .status(500)
//         .json({ success: false, error: "Internal server error" });
//     }
//   });

// router.route("/payIssuedCheckxx").post(async (req, res) => {
//   //not optimize
//   try {
//     const {
//       id,
//       account_list_id_issued_from,
//       amount,
//       checkNo,
//       date,
//       transaction_number,
//     } = req.body;

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
//           [Op.ne]: [account_list_id_issued_from],
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
//       where: { id: account_list_id_issued_from },
//     });

//     if (!checkToUpdate) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Check not found" });
//     }
//     const [updatedCheck, updatedIssuedCheck] = await Promise.all([
//       accountlist_sub3.update(
//         { amount: parseFloat(checkToUpdate.amount) - parseFloat(amount) },
//         { where: { id: account_list_id_issued_from }, returning: true }
//       ),
//       issued_check.update({ status: "Paid" }, { where: { id: id } }),
//     ]);

//     if (updatedCheck[0] === 0 || updatedIssuedCheck[0] === 0) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Check or issued check not found" });
//     }

//     await accountlist_transaction_subject.create({
//       account_list_sub3_id_transacted: account_list_id_issued_from,
//       payment_method: "Bank",
//       amount: amount,
//       date: date,
//       check_or_remarks: checkNo,
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
//         account_list_sub3_id: account_list_id_issued_from,
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

module.exports = router;
