const getAccurateDate = require("../utils/accurate_date_time_today");
const router = require("express").Router();
const { where, Op, fn, col, literal } = require("sequelize");
const sequelize = require("../db/config/sequelize.config");
const express = require("express");
const {
  Expenses,
  PayBulkExpensesPayment,
  Expenses2,
  Expenses1,
  PayBulkExpensesTransaction,
  PayBulkAddDeductExpenses,
  PayBulkExpenses,
  Currency,
  Cutoff,
  Loan_mother,
  Activity_Log,
  Loan_history,
  ExpenseJournal,
} = require("../db/models/associations");
const {
  accountlist_base_subject,
  accountlist_sub3,
  currency_sub,
  issued_check,
  bank_transaction,
  CashFlow,
  accountlist_transaction_subject,
  ProfitLossReport,
} = require("../db/models/ModelsBySubject/associations_sub");

const session = require("express-session");
const moment = require("moment-timezone");
const AccountListSub3 = require("../db/models/ModelsBySubject/accountlist_sub3.model");
router.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

const { expense } = require("../services");
const CheckJournal = require("../db/models/check_journal.model");

router.route("/payLocalExpensesTransactionCode").get(async (req, res) => {
  const currentDate = moment().tz("Asia/Manila").toDate();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const currentMonth = `${year}${month}`;

  const generateTwoNum = Math.floor(10 + Math.random() * 90);
  const time = new Date()
    .toLocaleTimeString("en-GB", { hour12: false })
    .replace(/:/g, "");

  try {
    // const lastPayCode = await PayBulkExpenses.findOne({
    //   where: {
    //     transaction_number: {
    //       [Op.like]: `PLE-${currentMonth}%`,
    //     },
    //   },
    //   order: [["createdAt", "DESC"]],
    // });
    let newRefCode = `PLE-${currentMonth}${time}${generateTwoNum}`;
    // if (lastPayCode && lastPayCode.transaction_number) {
    //   const latestRefCode = lastPayCode.transaction_number;
    //   const refCodeParts = latestRefCode.split("-");
    //   if (refCodeParts.length === 4 && !isNaN(refCodeParts[3])) {
    //     const latestSequence = parseInt(refCodeParts[3], 10);
    //     const newSequence = String(latestSequence + 1).padStart(5, "0");
    //     newRefCode = `PLE-${currentMonth}-${newSequence}`;
    //   } else {
    //     newRefCode = `PLE-${currentMonth}-00001`;
    //   }
    // } else {
    //   console.log("No matching records found, initializing new sequence.");
    //   newRefCode = `PLE-${currentMonth}-00001`;
    // }

    res.json(newRefCode);
  } catch (error) {
    console.error("Error fetching last transaction_id:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.route("/addPayment").post(async (req, res) => {
  try {
    const {
      items,
      payExpensesDate,
      transactionNumber,
      floatPayment,
      expenses,
      foreign_url,
      userLoggedID,
      totalAmountSum,
      currencyId,
      currencyRate,
    } = req.body;

    const findCutoff = await Cutoff.findOne({
      where: {
        [Op.and]: [
          {
            from: { [Op.lte]: payExpensesDate },
          },
          {
            to: { [Op.gte]: payExpensesDate },
          },
        ],
        isDeleted: false,
      },
      order: [["createdAt", "DESC"]],
    });

    const isPosted = findCutoff?.isPosted || false;

    if (isPosted) {
      return res.status(409).json({ message: "Cutoff is already posted" });
    }

    const foreign_url_module =
      foreign_url === "local" ? "Local Expenses" : "Overseas Expenses";

    const createPayExpenses = await PayBulkExpenses.create({
      pay_date: payExpensesDate || null,
      transaction_number: transactionNumber,
      status: "For-Approval",
      module_from: foreign_url_module,
      created_by: userLoggedID,
      totalAmount: totalAmountSum,
      currency_id: currencyId,
      rate: currencyRate,
    });

    if (createPayExpenses) {
      for (const item of items) {
        const createPayTransaction = await PayBulkExpensesTransaction.create({
          expenses_id: item.id,
          pay_bulk_id: createPayExpenses.id,
        });

        await Expenses.update({ isAdded: true }, { where: { id: item.id } });
      }

      if (floatPayment && floatPayment.length > 0) {
        for (const data of floatPayment) {
          await PayBulkExpensesPayment.create({
            pay_bulk_id: createPayExpenses.id,
            account_list_sub3_id: data.subject3,
            payment_type: data.paymentMethod,
            check_number: data.checkNumber || null,
            online_name: data.remarks || null,
            online_ref_number: data.refNumber || null,
            date_issued: data.issuedDate,
            amount: data.amountInputted || 0,
            payment_status: "For-Approval",
          });
        }
      }

      await Activity_Log.create({
        masterlist_id: userLoggedID,
        action_taken: `${foreign_url_module}: User created ${
          foreign_url_module == "local" ? "local" : "overseas"
        } expenses with transaction number ${transactionNumber}`,
      });

      if (expenses && expenses.length > 0) {
        const validExpenses = expenses.filter((pay) => pay.subject3 !== "");
        if (validExpenses.length > 0) {
          for (const pay of validExpenses) {
            await PayBulkAddDeductExpenses.create({
              pay_bulk_id: createPayExpenses.id,
              ...(pay.LoanORAccount === "loan"
                ? { loan_id: pay.subject3 }
                : { account_list_sub3_id: pay.subject3 }),
              amount: pay.amount,
              type_expenses: pay.type,
              loan_or_account: pay.LoanORAccount,
              rate: pay.rate,
            });
          }
        }
        return res.status(200).json();
      }
    }
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

//fetching sa local and overseas expenses table
// router.route("/payLocalExpensesDataFetching").get(async (req, res) => {
//   try {
//     const { startDate, endDate, filterColumn } = req.query;
//     let { searchText } = req.query;
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const offset = (page - 1) * limit;

//     const numericText = searchText.replace(/,/g, "");

//     if (!isNaN(numericText)) {
//       searchText = numericText;
//     }

//     let payBulkExpenseWhereClause = {
//       module_from: req.query.foreign_url,
//       pay_date: {
//         [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
//       },
//     };

//     switch (filterColumn) {
//       // Filter for transaction number
//       case "transaction_id":
//         payBulkExpenseWhereClause["transaction_number"] = {
//           [Op.like]: `%${searchText}%`,
//         };
//         break;
//       // Filter for date request
//       case "date_requested":
//         payBulkExpenseWhereClause = {
//           [Op.and]: [
//             {
//               module_from: req.query.foreign_url,
//             },
//             {
//               pay_date: {
//                 [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
//               },
//             },
//             sequelize.where(literal(`CAST(pay_date AS CHAR)`), {
//               [Op.like]: `%${searchText}%`,
//             }),
//           ],
//         };
//         break;
//       // Filter for Status
//       case "status":
//         payBulkExpenseWhereClause["status"] = {
//           [Op.like]: `%${searchText}%`,
//         };
//         break;
//       // Filter for all
//       default:
//         payBulkExpenseWhereClause = {
//           [Op.or]: [
//             {
//               module_from: req.query.foreign_url,
//               pay_date: {
//                 [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
//               },
//               transaction_number: {
//                 [Op.like]: `%${searchText}%`,
//               },
//             },
//             {
//               [Op.and]: [
//                 {
//                   module_from: req.query.foreign_url,
//                 },
//                 {
//                   pay_date: {
//                     [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
//                   },
//                 },
//                 sequelize.where(literal(`CAST(pay_date AS CHAR)`), {
//                   [Op.like]: `%${searchText}%`,
//                 }),
//               ],
//             },
//             {
//               module_from: req.query.foreign_url,
//               pay_date: {
//                 [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
//               },
//               status: {
//                 [Op.like]: `%${searchText}%`,
//               },
//             },
//           ],
//         };
//         break;
//     }

//     // const { count, rows: data } = await PayBulkExpenses.findAndCountAll({
//     //   include: [
//     //     {
//     //       model: PayBulkExpensesTransaction,
//     //       required: true,
//     //       include: [
//     //         {
//     //           model: Expenses,
//     //           required: true,
//     //           include: [
//     //             {
//     //               model: Currency,
//     //               required: true,
//     //             },
//     //           ],
//     //         },
//     //       ],
//     //     },
//     //     {
//     //       model: PayBulkExpensesPayment,
//     //       required: true,
//     //     },
//     //     {
//     //       model: PayBulkAddDeductExpenses,
//     //       required: false,
//     //     },
//     //   ],
//     //   subQuery: false,
//     //   distinct: true,
//     //   limit: limit,
//     //   offset: offset,
//     //   order: [["createdAt", "DESC"]],
//     //   where: { ...payBulkExpenseWhereClause, isDeleted: false },
//     // });

//     const { count, rows: paginatedExpenses } =
//       await PayBulkExpenses.findAndCountAll({
//         where: { ...payBulkExpenseWhereClause, isDeleted: false },
//         limit,
//         offset,
//         order: [["createdAt", "DESC"]],
//         attributes: ["id"], // Only get IDs for pagination
//       });

//     const whereClause =
//       paginatedExpenses.length > 0
//         ? { id: paginatedExpenses.map((e) => e.id) }
//         : undefined;

//     const havingClause =
//       (paginatedExpenses.length > 0 && filterColumn !== "Amount") ||
//       filterColumn !== "all"
//         ? undefined
//         : {
//             totalExpenses: {
//               [Op.like]: `%${searchText}%`,
//             },
//           };

//     // if (
//     //   (paginatedExpenses.length > 0 && filterColumn !== "Amount") ||
//     //   filterColumn !== "all"
//     // ) {
//     //   havingClause = undefined;
//     // } else if (paginatedExpenses.length === 0) {
//     //   havingClause = sequelize.literal("1 = 0");
//     // } else {
//     //   havingClause = {
//     //     totalExpenses: {
//     //       [Op.like]: `%${searchText}%`,
//     //     },
//     //   };
//     // }

//     const data = await PayBulkExpenses.findAll({
//       where: whereClause,
//       // where: {
//       //   id: paginatedExpenses.map((item) => item.id),
//       // },
//       where: undefined,
//       include: [
//         {
//           model: PayBulkExpensesTransaction,
//           required: true,
//           include: [
//             {
//               model: Expenses,
//               required: true,
//               include: [{ model: Currency, required: true }],
//             },
//           ],
//         },
//         {
//           model: PayBulkExpensesPayment,
//           required: true,
//         },
//         {
//           model: PayBulkAddDeductExpenses,
//           required: false,
//         },
//       ],
//       attributes: [
//         "id",
//         "transaction_number",
//         "pay_date",
//         "status",
//         [
//           fn("SUM", col("pay_bulk_expenses_transactions.expense.totalAmount")),
//           "totalExpenses",
//         ],
//       ],
//       group: [
//         "pay_bulk_expenses.id",
//         "pay_bulk_expenses_transactions.id",
//         "pay_bulk_expenses_transactions.expense.id",
//         "pay_bulk_expenses_transactions.expense.currency.id",
//         "pay_bulk_expenses_payments.id",
//         "pay_bulk_add_deduct_expenses.id",
//       ],
//       having: havingClause,
//       order: [["createdAt", "DESC"]],
//     });

//     const expensesWithTotal = data.map((expenses) => {
//       // Sum totalAmount from Expenses
//       const totalAmountExpenses =
//         expenses.pay_bulk_expenses_transactions.reduce(
//           (sum, transaction) => sum + transaction.expense.totalAmount,
//           0
//         );

//       // Sum amount from PayBulkAddDeductExpenses where type_expenses is "deduction"
//       const totalDeductions = expenses.pay_bulk_add_deduct_expenses.reduce(
//         (sum, addDeduct) => {
//           if (addDeduct.type_expenses === "deduction") {
//             return sum + addDeduct.amount;
//           }
//           return sum;
//         },
//         0
//       );

//       const totalAddition = expenses.pay_bulk_add_deduct_expenses.reduce(
//         (sum, addDeduct) => {
//           if (addDeduct.type_expenses === "additional") {
//             return sum + addDeduct.amount;
//           }
//           return sum;
//         },
//         0
//       );

//       // Combine totalAmount from Expenses and totalDeductions
//       const totalExpenses = totalAmountExpenses;
//       //  + totalAddition - totalDeductions;

//       return {
//         ...expenses.toJSON(),
//         totalExpenses,
//       };
//     });

//     const pageCount =
//       count === 0 && data.length > 0 && searchText !== "" ? data.length : count;

//     res.json({
//       totalItems: pageCount,
//       totalPages: Math.ceil(pageCount / limit),
//       currentPage: parseInt(page || 1),
//       data: data,
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json("Error");
//   }
// });

router.route("/payLocalOverseasExpensesTable").get(async (req, res) => {
  try {
    const { startDate, endDate, currencyId, foreign_url } = req.query;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let payBulkExpenseWhereClause = {
      ...(foreign_url && { module_from: foreign_url }),
      pay_date: {
        [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
      },
    };

    const { count, rows: paginatedExpenses } =
      await PayBulkExpenses.findAndCountAll({
        where: { ...payBulkExpenseWhereClause, isDeleted: false },
        include: [
          {
            model: PayBulkExpensesTransaction,
            required: true,
            attributes: [],
            include: [
              {
                model: Expenses,
                required: true,
                attributes: [],
                include: [
                  {
                    model: Currency,
                    required: true,
                    attributes: [],
                    where: {
                      ...(currencyId &&
                        currencyId !== "All" && { id: currencyId }),
                    },
                  },
                ],
              },
            ],
          },
        ],
        limit,
        offset,
        subQuery: false,
        distinct: true,
        order: [["createdAt", "DESC"]],
        attributes: ["id"], // Only get IDs for pagination
      });

    const data = await PayBulkExpenses.findAll({
      where: {
        id: paginatedExpenses.map((item) => item.id),
      },
      include: [
        {
          model: PayBulkExpensesTransaction,
          required: true,
          include: [
            {
              model: Expenses,
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
        {
          model: PayBulkExpensesPayment,
          required: true,
        },
        {
          model: PayBulkAddDeductExpenses,
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const expensesWithTotal = data.map((expenses) => {
      // Sum totalAmount from Expenses
      const totalAmountExpenses =
        expenses.pay_bulk_expenses_transactions.reduce(
          (sum, transaction) => sum + transaction.expense.totalAmount,
          0
        );

      // Sum amount from PayBulkAddDeductExpenses where type_expenses is "deduction"
      const totalDeductions = expenses.pay_bulk_add_deduct_expenses.reduce(
        (sum, addDeduct) => {
          if (addDeduct.type_expenses === "deduction") {
            return sum + addDeduct.amount;
          }
          return sum;
        },
        0
      );

      const totalAddition = expenses.pay_bulk_add_deduct_expenses.reduce(
        (sum, addDeduct) => {
          if (addDeduct.type_expenses === "additional") {
            return sum + addDeduct.amount;
          }
          return sum;
        },
        0
      );

      // Combine totalAmount from Expenses and totalDeductions
      const totalExpenses = totalAmountExpenses;
      //  + totalAddition - totalDeductions;

      return {
        ...expenses.toJSON(),
        totalExpenses,
      };
    });

    res.json({
      totalItems: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: parseInt(page || 1),
      data: expensesWithTotal,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.route("/payLocalOverseasExpensesForSearch").get(async (req, res) => {
  try {
    const { startDate, endDate, filterColumn, currencyId } = req.query;
    let { searchText } = req.query;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const numericText = searchText.replace(/,/g, "");
    if (!isNaN(numericText)) {
      searchText = numericText;
    }

    let payBulkExpenseWhereClause = {
      module_from: req.query.foreign_url,
      pay_date: {
        [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
      },
    };

    let havingClause = undefined;

    if (searchText && searchText.trim() !== "") {
      switch (filterColumn) {
        case "transaction_number":
        case "status":
          payBulkExpenseWhereClause[filterColumn] = {
            [Op.like]: `%${searchText}%`,
          };
          break;

        case "date_requested":
          payBulkExpenseWhereClause = {
            [Op.and]: [
              payBulkExpenseWhereClause,
              sequelize.where(literal(`CAST(pay_date AS CHAR)`), {
                [Op.like]: `%${searchText}%`,
              }),
            ],
          };
          break;

        case "Amount":
          havingClause = sequelize.where(
            sequelize.cast(
              fn(
                "SUM",
                literal(
                  "DISTINCT `pay_bulk_expenses_transactions->expense`.`totalAmount`"
                )
              ),
              "CHAR"
            ),
            {
              [Op.like]: `%${searchText}%`,
            }
          );
          break;

        case "all":
          // Filter WHERE for all base columns
          payBulkExpenseWhereClause = {
            [Op.and]: [
              payBulkExpenseWhereClause,
              {
                [Op.or]: [
                  { transaction_number: { [Op.like]: `%${searchText}%` } },
                  { status: { [Op.like]: `%${searchText}%` } },
                  sequelize.where(literal("CAST(pay_date AS CHAR)"), {
                    [Op.like]: `%${searchText}%`,
                  }),
                ],
              },
            ],
          };

          // And also filter the aggregated total
          // havingClause = sequelize.where(
          //   sequelize.cast(
          //     fn(
          //       "SUM",
          //       literal(
          //         "DISTINCT `pay_bulk_expenses_transactions->expense`.`totalAmount`"
          //       )
          //     ),
          //     "CHAR"
          //   ),
          //   {
          //     [Op.like]: `%${searchText}%`,
          //   }
          // );
          break;
      }
    }

    // const { count, rows: paginatedExpenses } =
    //   await PayBulkExpenses.findAndCountAll({
    //     where: { ...payBulkExpenseWhereClause, isDeleted: false },
    //     limit,
    //     offset,
    //     order: [["createdAt", "DESC"]],
    //     attributes: ["id"], // Only get IDs for pagination
    //   });

    // const data = await PayBulkExpenses.findAll({
    //   where: {
    //     id: paginatedExpenses.map((item) => item.id),
    //   },
    //   include: [
    //     {
    //       model: PayBulkExpensesTransaction,
    //       required: true,
    //       include: [
    //         {
    //           model: Expenses,
    //           required: true,
    //           include: [{ model: Currency, required: true }],
    //         },
    //       ],
    //     },
    //     {
    //       model: PayBulkExpensesPayment,
    //       required: true,
    //     },
    //     {
    //       model: PayBulkAddDeductExpenses,
    //       required: false,
    //     },
    //   ],
    //   order: [["createdAt", "DESC"]],
    // });

    const { count, rows: data } = await PayBulkExpenses.findAndCountAll({
      where: {
        ...payBulkExpenseWhereClause,
        isDeleted: false,
      },
      include: [
        {
          model: PayBulkExpensesTransaction,
          required: true,
          attributes: [],
          include: [
            {
              model: Expenses,
              required: true,
              attributes: [],
              include: [
                {
                  model: Currency,
                  required: true,
                  attributes: [],
                  where: {
                    ...(currencyId !== "All" && { id: currencyId }),
                  },
                },
              ],
            },
          ],
        },
        {
          model: PayBulkExpensesPayment,
          required: true,
          attributes: [],
        },
        {
          model: PayBulkAddDeductExpenses,
          required: false,
          attributes: [],
        },
      ],
      attributes: [
        "id",
        "transaction_number",
        "pay_date",
        "status",
        [
          fn(
            "SUM",
            literal(
              "DISTINCT `pay_bulk_expenses_transactions->expense`.`totalAmount`"
            )
          ),
          "totalExpenses",
        ],
        [
          col("pay_bulk_expenses_transactions.expense.currency.currency_name"),
          "currencyName",
        ],
      ],
      group: [
        "pay_bulk_expenses.id",
        "pay_bulk_expenses_transactions.expense.currency.currency_name",
      ],
      having: havingClause,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
      subQuery: false,
      distinct: true,
    });

    // const expensesWithTotal = data.map((expenses) => {
    //   // Sum totalAmount from Expenses
    //   const totalAmountExpenses =
    //     expenses.pay_bulk_expenses_transactions.reduce(
    //       (sum, transaction) => sum + transaction.expense.totalAmount,
    //       0
    //     );

    //   // Sum amount from PayBulkAddDeductExpenses where type_expenses is "deduction"
    //   const totalDeductions = expenses.pay_bulk_add_deduct_expenses.reduce(
    //     (sum, addDeduct) => {
    //       if (addDeduct.type_expenses === "deduction") {
    //         return sum + addDeduct.amount;
    //       }
    //       return sum;
    //     },
    //     0
    //   );

    //   const totalAddition = expenses.pay_bulk_add_deduct_expenses.reduce(
    //     (sum, addDeduct) => {
    //       if (addDeduct.type_expenses === "additional") {
    //         return sum + addDeduct.amount;
    //       }
    //       return sum;
    //     },
    //     0
    //   );

    //   // Combine totalAmount from Expenses and totalDeductions
    //   const totalExpenses = totalAmountExpenses;
    //   //  + totalAddition - totalDeductions;

    //   return {
    //     ...expenses.toJSON(),
    //     totalExpenses,
    //   };
    // });

    res.json({
      totalItems: count.length,
      totalPages: Math.ceil(count.length / limit),
      currentPage: parseInt(page || 1),
      data: data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.route("/approved").post(async (req, res) => {
  try {
    const {
      id,
      foreign_url,
      processedPayments,
      transactions_number,
      addDeducts,
      date_transacted,
      userLoggedID,
      transactions,
    } = req.query;
    let module =
      foreign_url === "local" ? "Local Expenses" : "Overseas Expenses";
    let hasCashPayment = false; // Flag to check if there's any Cash payment

    // console.log(processedPayments.payment_type);

    for (const pay of processedPayments) {
      if (pay.payment_type === "Bank" && pay.check_number !== "") {
        console.log("sa issued check papasok");
        await issued_check.create({
          account_list_id_issued_from: pay.account_list_sub3_id,
          transaction_date: pay.date_issued,
          check_number: pay.check_number,
          transaction_number: transactions_number,
          account_list_id_issued_to: null,
          module_from: module,
          description: "Payments",
          amount: pay.amount,
          status: "Pending",
        });
      } else if (pay.payment_type === "Bank" && pay.check_number === "") {
        console.log("sa bank enter");
        await bank_transaction.create({
          account_list_id_bank_from: pay.account_list_sub3_id,
          transaction_date: pay.date_issued,
          check_number: pay.check_number || pay.online_ref_number,
          transaction_number: transactions_number,
          account_list_id_bank_to: null,
          module_from: module,
          description: "Payments",
          amount: pay.amount,
          status: "Pending",
        });
      }

      if (pay.payment_type === "Cash") {
        hasCashPayment = true;
        console.log("cash enter");
        await CashFlow.create({
          account_list_id_cash_from: pay.account_list_sub3_id,
          transaction_date: pay.date_issued,
          transaction_number: transactions_number,
          account_list_id_cash_to: null,
          module_from: module,
          description: "Payments",
          amount: pay.amount,
          status: "Paid",
        });

        await accountlist_sub3.decrement("amount", {
          by: parseFloat(pay.amount),
          where: { id: pay.account_list_sub3_id },
        });

        await accountlist_transaction_subject.create({
          account_list_sub3_id_transacted: pay.account_list_sub3_id,
          payment_method: pay.payment_type,
          amount: pay.amount,
          date: pay.date_issued,
          check_or_remarks: "",
          type: "Credit",
          module_from: module,
          transaction_number: transactions_number,
        });

        const updatePayBulkExpenses = await PayBulkExpenses.findOne({
          where: { id: id },
        });

        if (updatePayBulkExpenses) {
          await updatePayBulkExpenses.update({
            status: "Partial-Paid",
          });
        }
      }
    }

    // if all payments are cash deduct agad sa accounts additional and deduction saexpenses

    const allCash = processedPayments.every(
      (payment) => payment.payment_type === "Cash"
    );

    if (allCash) {
      console.log("All payments are Cash");
      if (addDeducts && addDeducts.length > 0) {
        addDeducts.forEach(async (payment) => {
          console.log(date_transacted);

          if (payment.loan_or_account === "loan") {
            await Loan_mother.decrement("amount", {
              by: parseFloat(payment.amount),
              where: { id: payment.loan_id },
            });

            await Loan_history.create({
              loan_id: payment.loan_id,
              transaction_number: transactions_number,
              module: module,
              amount_deducted: payment.amount,
              date_deducted: date_transacted,
              deduction_rate: payment.rate,
            });
          } else {
            await accountlist_sub3.decrement("amount", {
              by: parseFloat(payment.amount),
              where: { id: payment.account_list_sub3_id },
            });

            await accountlist_transaction_subject.create({
              account_list_sub3_id_transacted: payment.account_list_sub3_id,
              payment_method: "--",
              amount: payment.amount,
              date: date_transacted,
              check_or_remarks: payment.check_number,
              type: "Credit",
              module_from: module,
              transaction_number: transactions_number,
              transferred_by: userLoggedID,
            });
          }
        });
      }
    }

    // comment muna dko alam bakit dalawa meron din sa issued check, bank transaction
    // if (addDeducts && addDeducts.length > 0) {
    //   addDeducts.forEach(async (payment) => {
    //     console.log(date_transacted);

    //     if (payment.loan_or_account === "loan") {
    //       await Loan_mother.decrement("amount", {
    //         by: parseFloat(payment.amount),
    //         where: { id: payment.loan_id },
    //       });

    //       await Loan_history.create({
    //         loan_id: payment.loan_id,
    //         transaction_number: transactions_number,
    //         module: module,
    //         amount_deducted: payment.amount,
    //          date_deducted: date_transacted,
    //          deduction_rate: payment.rate,
    //       });
    //     } else {
    //       await accountlist_sub3.decrement("amount", {
    //         by: parseFloat(payment.amount),
    //         where: { id: payment.account_list_sub3_id },
    //       });

    //       await accountlist_transaction_subject.create({
    //         account_list_sub3_id_transacted: payment.account_list_sub3_id,
    //         payment_method: "--",
    //         amount: payment.amount,
    //         date: date_transacted,
    //         check_or_remarks: payment.check_number,
    //         type: "Credit",
    //         module_from: module,
    //         transaction_number: transactions_number,
    //         transferred_by: userLoggedID,
    //       });
    //     }
    //   });
    // }

    const finalStatus = allCash
      ? "Paid"
      : hasCashPayment
      ? "Partial-Paid"
      : "Approved";
    await PayBulkExpenses.update(
      {
        status: finalStatus,
        approved_by: userLoggedID,
        date_approved: await getAccurateDate(),
      },
      { where: { id: id } }
    );

    // If payment type is All Cash update status to Paid also for Expense module
    if (allCash) {
      await Expenses.update(
        {
          status: "Paid",
        },
        {
          where: {
            transaction_number: {
              [Op.in]: transactions.map((item) => item.transaction_id),
            },
          },
        }
      );
    }

    await Activity_Log.create({
      masterlist_id: userLoggedID,
      action_taken: `${module}: User approved ${module.toLowerCase()} with transaction ID ${transactions_number}`,
    });

    return res.status(200).json({ message: "Updates successful" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Endpoint for bulk expense approval (PayBulkExpenses)
router.route("/bulk/approve").post(async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      id,
      foreign_url,
      processedPayments,
      transactions_number,
      transaction_date,
      addDeducts,
      date_transacted,
      userLoggedID,
      transactions,
      balance,
      currencyName,
      currencyRate,
    } = req.body;

    const isLocal = foreign_url === "local";
    let module = isLocal ? "Local Expenses" : "Overseas Expenses";

    // For Expense Journal: List of expense transactions with their expense2 id and amount
    const expenseTransactions =
      expense.expenseHelpers.buildExpenseTransactions(transactions);

    // Update payment status
    await PayBulkExpensesPayment.update(
      {
        payment_status: "Approved",
      },
      {
        where: {
          pay_bulk_id: id,
        },
        transaction,
      }
    );

    // Distribute payments to (Bank/Check/Cash)
    if (processedPayments?.length) {
      for (const pay of processedPayments) {
        if (pay.payment_type === "Bank" && pay.check_number !== "") {
          console.log("sa issued check papasok");
          await issued_check.create(
            {
              account_list_id_issued_from: pay.account_list_sub3_id,
              transaction_date: pay.date_issued,
              check_number: pay.check_number,
              transaction_number: transactions_number,
              account_list_id_issued_to: null,
              module_from: module,
              description: "Payments",
              amount: pay.amount,
              status: "Pending",
            },
            { transaction }
          );

          // Create a check journal "Debit" entry for trial balance
          await CheckJournal.create(
            {
              module_from: module,
              transaction_number: transactions_number,
              transaction_date,
              issued_date: pay.date_issued,
              type: "Debit",
              amount: pay.amount,
              check_number: pay.check_number,
              currency_name: currencyName,
              currency_rate: currencyRate,
            },
            { transaction }
          );
        } else if (pay.payment_type === "Bank" && pay.check_number === "") {
          console.log("sa bank enter");
          await bank_transaction.create(
            {
              account_list_id_bank_from: pay.account_list_sub3_id,
              transaction_date: pay.date_issued,
              check_number: pay.check_number || pay.online_ref_number,
              transaction_number: transactions_number,
              account_list_id_bank_to: null,
              module_from: module,
              description: "Payments",
              amount: pay.amount,
              status: "Pending",
            },
            { transaction }
          );
        }

        if (pay.payment_type === "Cash") {
          console.log("cash enter");
          await CashFlow.create(
            {
              account_list_id_cash_from: pay.account_list_sub3_id,
              transaction_date: pay.date_issued,
              transaction_number: transactions_number,
              account_list_id_cash_to: null,
              module_from: module,
              description: "Payments",
              amount: pay.amount,
              status: "Paid",
            },
            { transaction }
          );

          await accountlist_sub3.decrement("amount", {
            by: parseFloat(pay.amount),
            where: { id: pay.account_list_sub3_id },
            transaction,
          });

          await accountlist_transaction_subject.create(
            {
              account_list_sub3_id_transacted: pay.account_list_sub3_id,
              payment_method: pay.payment_type,
              amount: pay.amount,
              date: pay.date_issued,
              check_or_remarks: "",
              type: "Credit",
              module_from: module,
              transaction_number: transactions_number,
              rate: currencyRate,
            },
            { transaction }
          );

          // --- For the creation of expense journal record for expense report ---

          // Create an expense journal record for expense report
          await expense.expenseService.applyPayment({
            paymentData: { ...pay, currencyName, currencyRate },
            expenseTransactions,
            transaction,
          });
        }
      }
    }

    // if all payments are cash deduct agad sa accounts additional and deduction sa expenses
    const allCash = processedPayments?.every(
      (payment) => payment.payment_type === "Cash"
    );

    if (allCash) {
      if (addDeducts && addDeducts.length > 0) {
        addDeducts.forEach(async (payment) => {
          await accountlist_sub3.decrement("amount", {
            by: parseFloat(payment.amount),
            where: { id: payment.account_list_sub3_id },
            transaction,
          });

          await accountlist_transaction_subject.create(
            {
              account_list_sub3_id_transacted: payment.account_list_sub3_id,
              payment_method: "--",
              amount: payment.amount,
              date: date_transacted,
              check_or_remarks: payment.check_number,
              type: "Credit",
              module_from: module,
              transaction_number: transactions_number,
              transferred_by: userLoggedID,
              rate: currencyRate,
            },
            { transaction }
          );
        });
      }
    }

    // Get total payment
    const paymentSummary = async ({ transactionNumber, transaction }) => {
      const [issuedTotal = 0, bankTotal = 0, cashTotal = 0] = await Promise.all(
        [
          issued_check.sum("amount", {
            where: {
              transaction_number: transactionNumber,
              status: "Paid",
              isDeleted: false,
            },
            transaction,
          }),

          bank_transaction.sum("amount", {
            where: {
              transaction_number: transactionNumber,
              module_from: {
                [Op.in]: ["Local Expenses", "Overseas Expenses"],
              },
              status: "Confirmed",
              isDeleted: false,
            },
            transaction,
          }),

          CashFlow.sum("amount", {
            where: {
              transaction_number: transactionNumber,
              status: "Paid",
              isDeleted: false,
            },
            transaction,
          }),
        ]
      );

      return issuedTotal + bankTotal + cashTotal;
    };

    // Get total payment and balance
    const totalPayment = await paymentSummary({ transactionNumber: transactions_number, transaction }); // prettier-ignore
    const numericBalance = parseFloat(String(balance || 0).replace(/,/g, ""));

    // Determine the final status
    const getStatus = ({ totalPayment, balance }) => {
      const isPaid = totalPayment === balance;
      if (totalPayment === 0) return "Approved";
      if (isPaid) return "Paid";
      return "Partially-Paid";
    };
    const finalStatus = getStatus({ totalPayment, balance: numericBalance });

    // Update PayBulkExpenses/Expenses status
    const approvedDate = await getAccurateDate();
    await Promise.all([
      PayBulkExpenses.update(
        {
          status: finalStatus,
          approved_by: userLoggedID,
          date_approved: approvedDate,
        },
        { where: { id }, transaction }
      ),
      // Expenses.update(
      //   {
      //     status: finalStatus,
      //   },
      //   {
      //     where: {
      //       transaction_id: {
      //         [Op.in]: transactions.map((item) => item.transaction_id),
      //       },
      //     },
      //     transaction,
      //   }
      // ),
    ]);

    // Create activity log record
    await Activity_Log.create(
      {
        masterlist_id: userLoggedID,
        action_taken: `${module}: User approved ${module.toLowerCase()} with transaction ID ${transactions_number}`,
      },
      { transaction }
    );

    await transaction.commit();
    res.status(200).json({ message: "Transaction successfully approved." });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint that allows adding payment for approved bulk expense transactions
router.route("/bulk/payments").post(async (req, res) => {
  try {
    const {
      newPayment: {
        paymentMethod,
        subject1,
        subject2,
        subject3,
        accountName,
        amountInputted,
        issuedDate,
        checkNumber,
        refNumber,
        remarks,
      },
      payBulkId,
    } = req.body;

    await PayBulkExpensesPayment.create({
      pay_bulk_id: payBulkId,
      account_list_sub3_id: subject3,
      payment_type: paymentMethod,
      check_number: checkNumber,
      online_name: remarks,
      online_ref_number: refNumber,
      amount: amountInputted,
      date_issued: issuedDate,
      payment_status: "For-Approval",
    });

    res.status(200).json({ message: "Payment added successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.route("/rejected").post(async (req, res) => {
  try {
    const { id, transactions, userLoggedID, foreign_url, transaction_number } =
      req.query;

    const updateExpenses = await PayBulkExpenses.update(
      {
        status: "Rejected",
        approved_by: userLoggedID,
      },
      {
        where: {
          id: id,
        },
      }
    );

    if (updateExpenses) {
      for (const transaction of transactions) {
        await Expenses.update(
          {
            isAdded: false,
          },
          {
            where: { id: transaction.id },
          }
        );
      }

      const module = foreign_url == "local" ? "Local" : "Overseas";

      await Activity_Log.create({
        masterlist_id: userLoggedID,
        action_taken: `${module} Expenses: User rejected ${module.toLowerCase()} expenses with transaction number ${transaction_number}`,
      });

      return res.status(200).json({ message: "Updates successful" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/update").post(async (req, res) => {
  try {
    let {
      id,
      transactions,
      payDate,
      removedIds,
      // addedIds,
      floatPayment,
      expenses,
      userLoggedID,
      foreign_url,
      removePaymentListId,
      totalAmountSum,
      currencyRate,
    } = req.query;

    const findCutoff = await Cutoff.findOne({
      where: {
        [Op.and]: [
          {
            from: { [Op.lte]: payDate },
          },
          {
            to: { [Op.gte]: payDate },
          },
        ],
        isDeleted: false,
      },
      order: [["createdAt", "DESC"]],
    });

    const isPosted = findCutoff?.isPosted || false;

    // addedIds = transactions.map((item) => parseInt(item?.id));
    let addedIds = transactions.map((item) => String(item?.id));

    // Convert all items to number then filter those only needed ids to remove
    removedIds = removedIds
      // ?.map((item) => parseInt(item))
      ?.map((item) => String(item))
      ?.filter((item) => {
        return !addedIds?.includes(item);
      });

    // For Activity Log
    const getDataPayBulk = await PayBulkExpenses.findAll({
      include: [
        {
          model: PayBulkExpensesTransaction,
          required: true,
          include: [
            {
              model: Expenses,
              required: true,
            },
          ],
        },
        {
          model: PayBulkAddDeductExpenses,
          required: false,
          include: [
            {
              model: AccountListSub3,
              required: false,
            },
            {
              model: Loan_mother,
              required: false,
            },
          ],
        },
        {
          model: PayBulkExpensesPayment,
          required: false,
          include: [
            {
              model: AccountListSub3,
              required: true,
            },
          ],
        },
      ],
      where: {
        id: id,
      },
    });

    // Helper
    const parseNumber = (num) => parseFloat(String(num || 0).replace(/,/g, ""));

    const getTotalAmount = () => {
      // Separate total of additional and deduction expense
      const { totalAdditionalExpense, totalDeductionExpense } = expenses.reduce(
        (acc, value) => {
          const isAdditional = value.type === "additional";
          const isDeduction = value.type === "deduction";
          const amount = parseNumber(value.amount);

          if (isAdditional) acc.totalAdditionalExpense += amount;
          if (isDeduction) acc.totalDeductionExpense += amount;

          return acc;
        },
        { totalAdditionalExpense: 0, totalDeductionExpense: 0 }
      );

      // Net expense with addition and deductions
      const totalAmount =
        parseNumber(totalAmountSum) +
        totalAdditionalExpense -
        totalDeductionExpense;

      return totalAmount;
    };

    const totalAmount = getTotalAmount();

    const updateExpenses = await PayBulkExpenses.update(
      {
        pay_date: payDate,
        totalAmount,
        rate: currencyRate,
      },
      {
        where: {
          id: id,
        },
      }
    );

    if (Array.isArray(removePaymentListId)) {
      for (const paymentListId of removePaymentListId) {
        await PayBulkExpensesPayment.destroy({
          where: {
            id: paymentListId,
          },
        });
      }
    }

    if (Array.isArray(transactions)) {
      const remainingIds = [];

      transactions.forEach((transaction) => {
        const expenseId = transaction.id;
        remainingIds.push(expenseId);
      });

      if (Array.isArray(addedIds)) {
        for (const addedId of addedIds) {
          const existingId = await PayBulkExpensesTransaction.findOne({
            where: {
              expenses_id: addedId,
              isDeleted: false,
            },
          });

          if (!existingId) {
            await PayBulkExpensesTransaction.create({
              pay_bulk_id: id,
              expenses_id: addedId,
            });

            await Expenses.update(
              {
                isAdded: true,
              },
              {
                where: { id: addedId },
              }
            );
          }
        }
      } else {
        console.log("No addedIds provided or addedIds is not an array.");
      }

      // if (Array.isArray(removedIds)) {
      //   for (const removedId of removedIds) {
      //     await Expenses.update(
      //       {
      //         isAdded: false,
      //       },
      //       {
      //         where: {
      //           id: removedId,
      //         },
      //       }
      //     );

      //     await PayBulkExpensesTransaction.destroy({
      //       where: {
      //         pay_bulk_id: id, // Use pay_bulk_id from the request
      //         expenses_id: removedId, // Use current removed ID
      //       },
      //     });

      //     console.log(
      //       `Removed transaction with expenses_id: ${removedId} for pay_bulk_id: ${id}`
      //     );
      //   }
      // }
    } else {
      console.log("No transactions provided or transactions is not an array.");
    }

    if (floatPayment && floatPayment.length > 0) {
      for (const data of floatPayment) {
        await PayBulkExpensesPayment.create({
          pay_bulk_id: id,
          account_list_sub3_id: data.subject3,
          payment_type: data.paymentMethod,
          check_number: data.checkNumber || null,
          online_name: data.remarks || null,
          online_ref_number: data.refNumber || null,
          date_issued: data.issuedDate,
          amount: data.amountInputted || 0,
          is_completed: data.paymentMethod === "Cash" ? true : false,
        });
      }
    }

    if (expenses && expenses.length > 0) {
      const validExpenses = expenses.filter((pay) => pay.subject3 !== "");
      if (validExpenses.length > 0) {
        for (const pay of validExpenses) {
          // console.log(
          //   "***************************-----------******************payamount: ",
          //   pay.amount
          // );
          await PayBulkAddDeductExpenses.create({
            pay_bulk_id: id,
            ...(pay.LoanORAccount === "loan"
              ? { loan_id: pay.subject3 }
              : { account_list_sub3_id: pay.subject3 }),
            amount: pay.amount,
            type_expenses: pay.type,
            description: pay.remarks,
            loan_or_account: pay.LoanORAccount,
            rate: pay.rate,
          });
        }
      }
      // return res.status(200).json({ isPosted: isPosted });
    }

    // For activity log
    const updatedPayBulkExpense = await PayBulkExpenses.findAll({
      include: [
        {
          model: PayBulkExpensesTransaction,
          required: true,
          include: [
            {
              model: Expenses,
              required: true,
            },
          ],
        },
        {
          model: PayBulkAddDeductExpenses,
          required: false,
          include: [
            {
              model: AccountListSub3,
              required: false,
            },
            {
              model: Loan_mother,
              required: false,
            },
          ],
        },
        {
          model: PayBulkExpensesPayment,
          required: false,
          include: [
            {
              model: AccountListSub3,
              required: true,
            },
          ],
        },
      ],
      where: {
        id: id,
      },
    });

    const moduleFrom = foreign_url == "local" ? "Local" : "Overseas";

    const idPayBulkExTrans = getDataPayBulk
      .flatMap(
        (record) =>
          record.pay_bulk_expenses_transactions?.map(
            (trans) => trans.expense?.transaction_id
          ) || []
      )
      .filter(Boolean)
      .join(", ");

    const updatedIdPayBulkExTrans = updatedPayBulkExpense
      .flatMap(
        (record) =>
          record.pay_bulk_expenses_transactions?.map(
            (trans) => trans.expense?.transaction_id
          ) || []
      )
      .filter(Boolean)
      .join(", ");

    const payBulkPayment = getDataPayBulk
      .flatMap(
        (record) =>
          record.pay_bulk_expenses_payments?.map(
            (trans) => trans.account_list_sub3?.account_name
          ) || []
      )
      .filter(Boolean)
      .join(", ");

    const updatedPayBulkPayment = updatedPayBulkExpense
      .flatMap(
        (record) =>
          record.pay_bulk_expenses_payments?.map(
            (trans) => trans.account_list_sub3?.account_name
          ) || []
      )
      .filter(Boolean)
      .join(", ");

    const addDeductExpense = getDataPayBulk
      .flatMap(
        (record) =>
          record.pay_bulk_add_deduct_expenses?.map((trans) =>
            trans.loan_or_account == "account"
              ? trans.account_list_sub3.account_name
              : trans.loan_mother.loan_name
          ) || []
      )
      .filter(Boolean)
      .join(", ");

    const updatedAddDeductExpense = updatedPayBulkExpense
      .flatMap(
        (record) =>
          record.pay_bulk_add_deduct_expenses?.map((trans) =>
            trans.loan_or_account == "account"
              ? trans.account_list_sub3.account_name
              : trans.loan_mother.loan_name
          ) || []
      )
      .filter(Boolean)
      .join(", ");

    await Activity_Log.create({
      masterlist_id: userLoggedID,
      action_taken: `${moduleFrom} Expenses: User updated information about ${moduleFrom.toLowerCase()} expense with transaction ID ${
        getDataPayBulk[0].transaction_number
      }
      Transactions: [${idPayBulkExTrans}] to [${updatedIdPayBulkExTrans}]
      Payments: [${payBulkPayment}] to [${updatedPayBulkPayment}]
      Additional and Deduct Expenses: [${addDeductExpense}] to [${updatedAddDeductExpense}]
      `,
    });

    return res
      .status(200)
      .json({ isPosted: isPosted, message: "Update processed" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router
  .route("/deleteLocalOverseasExpenses/:localExpensesId/:localExpensesDate")
  .delete(async (req, res) => {
    try {
      const id = req.params.localExpensesId;
      const localExpenses_Date = req.params.localExpensesDate;
      const { userLoggedID, moduleFrom, transaction_id } = req.body;

      const getCutoff = await Cutoff.findOne({
        where: {
          [Op.and]: [
            {
              from: {
                [Op.lte]: localExpenses_Date,
              },
            },
            {
              to: {
                [Op.gte]: localExpenses_Date,
              },
            },
          ],
          isDeleted: false,
        },
        order: [["createdAt", "DESC"]],
      });

      const {
        from: dateFrom,
        to: dateTo,
        isPosted: postedCutoff,
        name: CutoffName,
      } = getCutoff;

      const getLocalExpenses = await PayBulkExpenses.findOne({
        where: { id: id },
      });

      const expensesLocalDate = new Date(getLocalExpenses.pay_date);
      const cutoffFrom = new Date(dateFrom);
      const cutoffTo = new Date(dateTo);

      if (postedCutoff == true) {
        if (expensesLocalDate >= cutoffFrom && expensesLocalDate <= cutoffTo) {
          return res.status(202).json({
            success: false,
            expensesLocalDate: getLocalExpenses.pay_date,
            CutoffName: CutoffName,
          });
        }
      }

      const checkBulk = await PayBulkExpenses.findOne({
        where: {
          id: id,
        },
      });

      const {
        status: bulkStatus,
        transaction_number: transactionNumber,
        id: payBulkId,
      } = checkBulk;

      const expensesBulkTransaction = await PayBulkExpensesTransaction.findAll({
        where: { pay_bulk_id: id },
        attributes: ["expenses_id"],
      });

      if (bulkStatus == "For-Approval") {
        // await PayBulkExpensesPayment.destroy({
        //   where: { pay_bulk_id: id },
        // });

        await PayBulkExpensesPayment.update(
          { isDeleted: true },
          {
            where: { pay_bulk_id: id },
          }
        );

        if (expensesBulkTransaction.length > 0) {
          for (const expense of expensesBulkTransaction) {
            const { expenses_id } = expense;
            await Expenses.update(
              { isAdded: false },
              { where: { id: expenses_id } }
            );
          }
        }

        // await PayBulkExpensesTransaction.destroy({
        //   where: { pay_bulk_id: id },
        // });

        await PayBulkExpensesTransaction.update(
          {
            isDeleted: true,
          },
          {
            where: { pay_bulk_id: id },
          }
        );
        await PayBulkExpenses.update(
          {
            isDeleted: true,
          },
          { where: { id: id } }
        );
        // await PayBulkExpenses.destroy({ where: { id: id } });

        await Activity_Log.create({
          masterlist_id: userLoggedID,
          action_taken: `$${moduleFrom} Expenses: User deleted a ${moduleFrom.toLowerCase()} with transaction ID ${transactionNumber}`,
        });

        return res.status(200).json({
          success: true,
          message: "Local expenses deleted successfully, and records cleared.",
        });
      }

      // Data to Delete
      // const profitLossReportData = await ProfitLossReport.findAll({
      //   include: [
      //     {
      //       model: issued_check,
      //     },
      //     {
      //       model: bank_transaction,
      //     },
      //   ],
      //   where: {
      //     [Op.or]: [
      //       { "$issued_check.transaction_number$": transaction_id },
      //       { "$bank_transaction.transaction_number$": transaction_id },
      //     ],
      //   },
      // });

      // for (const item of profitLossReportData) {
      //   // Delete Profit Loss Report
      //   await ProfitLossReport.destroy({
      //     where: {
      //       [Op.and]: [
      //         { issued_check_id: item.issued_check_id },
      //         { bank_transaction_id: item.bank_transaction_id },
      //       ],
      //     },
      //   });
      // }

      const getPaymentsBank = await bank_transaction.findAll({
        where: {
          transaction_number: transactionNumber,
        },
      });
      const getPaymentsCheck = await issued_check.findAll({
        where: {
          transaction_number: transactionNumber,
        },
      });
      const getPaymentsCAsh = await CashFlow.findAll({
        where: {
          transaction_number: transactionNumber,
        },
      });

      const getAddDeductExpenses = await PayBulkAddDeductExpenses.findAll({
        where: {
          pay_bulk_id: payBulkId,
        },
      });

      if (getAddDeductExpenses) {
        for (const expense of getAddDeductExpenses) {
          if (expense.loan_or_account === "loan") {
            await Loan_mother.increment(
              { amount: expense.amount },
              { where: { id: expense.loan_id } }
            );
          } else {
            await accountlist_sub3.increment(
              { amount: expense.amount },
              {
                where: {
                  id: expense.account_list_sub3_id,
                },
              }
            );
          }
        }
      }

      // issued_check data
      if (getPaymentsCheck) {
        for (const payment of getPaymentsCheck) {
          if (payment.status === "Paid") {
            await accountlist_sub3.increment(
              { amount: payment.amount },
              {
                where: {
                  id: payment.account_list_id_issued_from,
                },
              }
            );
            // await issued_check.destroy({
            //   where: { id: payment.id },
            // });
            await issued_check.update(
              { isDeleted: true },
              {
                where: { id: payment.id },
              }
            );
          } else if (payment.status === "Pending") {
            // await issued_check.destroy({
            //   where: { id: payment.id },
            // });
            await issued_check.update(
              { isDeleted: true },
              {
                where: { id: payment.id },
              }
            );
          }
        }
      }

      // bank_transaction data
      if (getPaymentsBank) {
        for (const payment of getPaymentsBank) {
          if (payment.status === "Confirmed") {
            await accountlist_sub3.increment(
              { amount: payment.amount },
              {
                where: {
                  id: payment.account_list_id_bank_from,
                },
              }
            );
            // await bank_transaction.destroy({
            //   where: { id: payment.id },
            // });
            await bank_transaction.update(
              { isDeleted: true },
              {
                where: { id: payment.id },
              }
            );
          } else if (payment.status === "Pending") {
            // await bank_transaction.destroy({
            //   where: { id: payment.id },
            // });
            await bank_transaction.update(
              { isDeleted: true },
              {
                where: { id: payment.id },
              }
            );
          }
        }
      }

      if (getPaymentsCAsh) {
        for (const data of getPaymentsCAsh) {
          await accountlist_sub3.increment(
            { amount: data.amount },
            {
              where: {
                id: data.account_list_id_cash_from,
              },
            }
          );

          // await CashFlow.destroy({
          //   where: {
          //     id: data.id,
          //   },
          // });
          await CashFlow.update(
            {
              isDeleted: true,
            },
            {
              where: {
                id: data.id,
              },
            }
          );
        }
      }

      const bulkTransaction = await PayBulkExpensesTransaction.findAll({
        where: { pay_bulk_id: id },
        attributes: ["expenses_id"],
      });

      if (bulkTransaction.length > 0) {
        for (const expense of bulkTransaction) {
          const { expenses_id } = expense;
          await Expenses.update(
            { isAdded: false, status: "Approved" },
            { where: { id: expenses_id } }
          );
        }
      }

      // await PayBulkExpensesPayment.destroy({
      //   where: { pay_bulk_id: id },
      // });

      await PayBulkExpensesPayment.update(
        { isDeleted: true },
        {
          where: { pay_bulk_id: id },
        }
      );

      // await PayBulkExpensesTransaction.destroy({
      //   where: { pay_bulk_id: id },
      // });

      await PayBulkExpensesTransaction.update(
        { isDeleted: true },
        {
          where: { pay_bulk_id: id },
        }
      );

      // await PayBulkExpenses.destroy({
      //   where: { id: id },
      // });

      await PayBulkExpenses.update(
        { isDeleted: true },
        {
          where: { id: id },
        }
      );

      // await accountlist_transaction_subject.destroy({
      //   where: {
      //     transaction_number: transactionNumber,
      //   },
      // });

      await accountlist_transaction_subject.update(
        { isDeleted: true },
        {
          where: {
            transaction_number: transactionNumber,
          },
        }
      );

      await Loan_history.destroy({
        where: {
          transaction_number: transactionNumber,
        },
      });

      await Activity_Log.create({
        masterlist_id: userLoggedID,
        action_taken: `${moduleFrom} Expenses: User deleted a ${moduleFrom.toLowerCase()}expenses with transaction ID ${transactionNumber}`,
      });

      return res
        .status(200)
        .json({ success: true, message: "Process completed successfully." });
      // }
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ success: false, error: "Internal server error" });
    }
  });

//fetching ng specific data para ma-approve
router.route("/localExpensesSpecificDataFetching").get(async (req, res) => {
  try {
    const data = await PayBulkExpenses.findOne({
      where: {
        id: req.query.id,
      },
    });

    const dataTransaction = await PayBulkExpensesTransaction.findAll({
      where: {
        pay_bulk_id: req.query.id,
        isDeleted: false,
      },
      include: [
        {
          model: Expenses,
          required: true,
          include: [
            {
              model: Expenses2,
              required: true,
              include: [
                {
                  model: Expenses1,
                  required: true,
                },
              ],
            },
          ],
        },
      ],
    });

    const uniqueByExpenseId = [];
    const seen = new Set();

    for (const data of dataTransaction) {
      if (!seen.has(data.expense.id)) {
        seen.add(data.expense.id);
        uniqueByExpenseId.push(data);
      }
    }

    const dataPayment = await PayBulkExpensesPayment.findAll({
      where: {
        pay_bulk_id: req.query.id,
        isDeleted: false,
      },
      include: [
        {
          model: accountlist_sub3,
          required: true,
        },
      ],
    });

    const dataAddDeduct = await PayBulkAddDeductExpenses.findAll({
      where: {
        pay_bulk_id: req.query.id,
      },
      include: [
        {
          model: accountlist_sub3,
          required: false,
          include: [
            {
              model: accountlist_base_subject,
              required: true,
            },
          ],
        },
        {
          model: Loan_mother,
          required: false,
        },
      ],
    });

    const findCutoff = await Cutoff.findOne({
      where: {
        [Op.and]: [
          {
            from: { [Op.lte]: data.pay_date },
          },
          {
            to: { [Op.gte]: data.pay_date },
          },
        ],
        isDeleted: false,
      },
      order: [["createdAt", "DESC"]],
    });

    const isPosted = findCutoff?.isPosted || false;
    const cutoffExists = findCutoff;

    res.json({
      data,
      dataTransaction: uniqueByExpenseId,
      dataPayment,
      dataAddDeduct,
      isPosted,
      cutoffExists,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/getLocalExpensesData").get(async (req, res) => {
  try {
    const {
      foreign,
      currency_id,
      // searchText,
      filterColumn,
      selectedTransactions,
    } = req.query;

    let { searchText } = req.query;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const numericText = searchText?.replace(/,/g, "");

    if (!isNaN(numericText)) {
      // const [integer, decimal] = searchText.split(".");
      searchText = numericText;
      // decimal?.length >= 3 ? numericText : Number(numericText).toString();
    }

    // Expense Where clause
    let expenseWhereClause = {
      ...(foreign && { foreign: foreign }),
      status: "Approved",
      isAdded: false,
      ...(currency_id && { currency_id: currency_id }),
    };

    const expenseTableColumn = [
      "transaction_id",
      "desc",
      "expenses_date",
      "totalAmount",
      "expenses_type",
    ];

    // Handle Search
    if (searchText && searchText.trim() !== "") {
      const baseConditions = {
        foreign: foreign,
        status: "Approved",
        isAdded: false,
        currency_id: currency_id,
      };

      const generateCondition = (column) => {
        switch (column) {
          case "transaction_id":
          case "desc":
            return { [column]: { [Op.like]: `%${searchText}%` } };
          case "expenses_date":
          case "totalAmount":
            return sequelize.where(literal(`CAST(${column} AS CHAR)`), {
              [Op.like]: `%${searchText}%`,
            });
          case "expenses_type":
            return sequelize.where(
              fn(
                "concat",
                col("expenses2.expenses_one.expenses_type_one"),
                " ",
                "(",
                col("expenses2.sub_type"),
                ")"
              ),
              {
                [Op.like]: `%${searchText}%`,
              }
            );
        }
      };

      const condition = generateCondition(filterColumn);

      if (condition) {
        expenseWhereClause = {
          [Op.and]: [baseConditions, condition],
        };
      } else {
        // Default case: search across all columns
        expenseWhereClause = {
          [Op.and]: [
            baseConditions,
            {
              [Op.or]: expenseTableColumn
                .map((col) => {
                  const colCondition = generateCondition(col);
                  return colCondition ?? null;
                })
                .filter(Boolean), // Filter out null values
            },
          ],
        };
      }
    }

    if (
      Array.isArray(selectedTransactions) &&
      selectedTransactions.length > 0
    ) {
      expenseWhereClause.transaction_id = {
        [Op.notIn]: selectedTransactions,
      };
    }

    // console.log(selectedTransactions, "selectedtransactions");

    const { count, rows: data } = await Expenses.findAndCountAll({
      include: [
        {
          model: Expenses2,
          as: "expenses2",
          required: true,
          include: [
            {
              model: Expenses1,
              as: "expenses_one",
              required: true,
            },
          ],
        },
      ],
      where: { ...expenseWhereClause, isDeleted: false },
      order: [["createdAt", "DESC"]],
      limit: limit,
      offset: offset,
    });

    const items = await Expenses.findAll({
      include: [
        {
          model: Expenses2,
          as: "expenses2",
          required: true,
          include: [
            {
              model: Expenses1,
              as: "expenses_one",
              required: true,
            },
          ],
        },
      ],
      where: {
        transaction_id: {
          [Op.in]: selectedTransactions?.length > 0 ? selectedTransactions : [],
        },
        isDeleted: false,
      },
      order: [["createdAt", "DESC"]],
    });

    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page || 1),
      data: { data, items },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

//pay local expenses kapag nagchange ang dropdown ng subject 1 sa payment method
router.route("/getSubject1LocalExpenses").get(async (req, res) => {
  const { account_selected, selectedPayment } = req.query;
  try {
    const subjects = await accountlist_base_subject.findAll({
      where: {
        module_type: account_selected,
        subject_type: selectedPayment,
        isDeleted: false,
      },
      include: [
        {
          model: accountlist_sub3,
          attributes: ["amount"],
          required: false,
          include: [
            {
              model: currency_sub,
              attributes: ["currency_rate"],
              required: true,
            },
          ],
        },
      ],
    });

    const subjectsWithTotal = subjects.map((subject) => {
      const totalAmount = subject.account_list_sub3s.reduce((sum, sub3) => {
        return sum + parseFloat(sub3.amount * sub3.currency.currency_rate || 0);
      }, 0);

      return {
        ...subject.toJSON(),
        totalAmount: totalAmount,
      };
    });

    res.status(200).json(subjectsWithTotal);
  } catch (error) {
    console.log(error);
    res.status(500).json();
  }
});

//for local pay expenses pag change ng dropdown sa subject 2 sa payment method

//used jsx:
//payLocalExpenses.jsx
router.route("/getSubject3LocalExpenses").get(async (req, res) => {
  const { subjectId, totalAmountSum, selected_currency_id } = req.query;

  try {
    const subject3List = await accountlist_sub3.findAll({
      where: {
        account_list_base_sub_id: subjectId,
        currency_id: selected_currency_id,
        isDeleted: false,
        amount: {
          [Op.ne]: 0,
        },
      },
    });
    res.status(200).json(subject3List);
  } catch (error) {
    res.status(500).json();
  }
});

//for change dropdown ng subject 1 sa add or deduct expenses tab
router.route("/getSubjectAddDeductExpenses").get(async (req, res) => {
  const { account_selected } = req.query;
  try {
    const subjects = await accountlist_base_subject.findAll({
      where: { module_type: account_selected, isDeleted: false },
      include: [
        {
          model: accountlist_sub3,
          attributes: ["amount"],
          required: false,
          include: [
            {
              model: currency_sub,
              attributes: ["currency_rate"],
              required: true,
            },
          ],
        },
      ],
    });

    const subjectsWithTotal = subjects.map((subject) => {
      const totalAmount = subject.account_list_sub3s.reduce((sum, sub3) => {
        return sum + parseFloat(sub3.amount * sub3.currency.currency_rate || 0);
      }, 0);

      return {
        ...subject.toJSON(),
        totalAmount: totalAmount,
      };
    });

    res.status(200).json(subjectsWithTotal);
  } catch (error) {
    console.log(error);
    res.status(500).json();
  }
});

//for add or deduct expenses tab sa pagchange ng dropdown sa subject 2
router.route("/getSubject3AddDeductExpenses").get(async (req, res) => {
  const { subjectId, totalAmountSum, selected_currency_id } = req.query;
  try {
    const subject3List = await accountlist_sub3.findAll({
      include: [
        {
          model: currency_sub,
          attributes: ["currency_name", "currency_rate"],
          required: true,
        },
      ],
      where: {
        account_list_base_sub_id: subjectId,
        currency_id: selected_currency_id,
        isDeleted: false,
        amount: {
          [Op.ne]: 0,
        },
      },
    });
    res.status(200).json(subject3List);
  } catch (error) {
    console.log(error);
    res.status(500).json();
  }
});

router.route("/getSubject3AddDeductExpensesFORLOAN").get(async (req, res) => {
  const { selected_currency_id } = req.query;
  try {
    const fetchData = await Loan_mother.findAll({
      where: {
        currency_id: selected_currency_id,
        amount: {
          [Op.gt]: 0,
        },
        status: "Approved",
      },
    });

    return res.status(200).json(fetchData);
  } catch (error) {
    console.log(error);
    res.status(500).json();
  }
});

router.route("/deleteOrderListTransaction").put(async (req, res) => {
  try {
    const { id, idToRemove } = req.body;

    await Expenses.update(
      {
        isAdded: false,
      },
      {
        where: {
          id: idToRemove,
        },
      }
    );

    await PayBulkExpensesTransaction.update(
      { isDeleted: true },
      {
        where: {
          pay_bulk_id: id, // Use pay_bulk_id from the request
          expenses_id: idToRemove, // Use current removed ID
        },
      }
    );

    res
      .status(200)
      .json({ message: "Order List Transaction Successfully Deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router
  .route("/getBackOrderListTransaction")
  .post(express.text({ type: "*/*" }), async (req, res) => {
    try {
      const { id, idToAdd } = req.body;

      await Expenses.update(
        {
          isAdded: true,
        },
        {
          where: {
            id: {
              [Op.in]: idToAdd,
            },
          },
        }
      );

      await PayBulkExpensesTransaction.update(
        { isDeleted: false },
        {
          where: {
            pay_bulk_id: id, // Use pay_bulk_id from the request
            expenses_id: {
              [Op.in]: idToAdd,
            }, // Use current removed ID
          },
        }
      );

      res
        .status(200)
        .json({ message: "Order List Transaction Successfully Updated" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

router.route("/syncStatus").put(async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const approvedTransactions = await PayBulkExpenses.findAll({
      include: [
        {
          model: PayBulkExpensesTransaction,
          required: true,
          include: [
            {
              model: Expenses,
              required: true,
            },
          ],
        },
        {
          model: PayBulkExpensesPayment,
          required: true,
        },
      ],
      where: {
        status: "Approved",
        isDeleted: false,
      },
      order: [["createdAt", "DESC"]],
    });

    // Transactions to update
    const dataToUpdate = approvedTransactions.filter((item) => {
      const totalPayment = item.pay_bulk_expenses_payments.reduce(
        (total, num) => {
          return total + num.amount;
        },
        0
      );

      const balance = item.pay_bulk_expenses_transactions.reduce(
        (total, num) => {
          return total + num.expense.totalAmount;
        },
        0
      );

      return balance === totalPayment;
    });

    // Update Transaction
    const updatePayBulkExpenses = await PayBulkExpenses.update(
      {
        status: "Paid",
      },
      {
        where: {
          id: dataToUpdate.map((item) => item.id),
        },
        transaction,
      }
    );

    if (updatePayBulkExpenses) {
      await transaction.commit();
      res.status(200).json({
        approvedTransactions,
        dataToUpdate: dataToUpdate.map((item) => item.transaction_number),
        updatePayBulkExpenses: updatePayBulkExpenses.transaction_number,
      });
    }
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
module.exports = router;
