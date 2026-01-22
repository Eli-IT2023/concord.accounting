const router = require("express").Router();
const { where, Op, fn, col, literal } = require("sequelize");
const sequelize = require("../db/config/sequelize.config");
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

router.route("/payLocalExpensesTransactionCode").get(async (req, res) => {
  const currentDate = moment().tz("Asia/Manila").toDate();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const currentMonth = `${year}-${month}`;
  try {
    const lastPayCode = await PayBulkExpenses.findOne({
      where: {
        transaction_number: {
          [Op.like]: `PLE-${currentMonth}%`,
        },
      },
      order: [["createdAt", "DESC"]],
    });
    let newRefCode;
    if (lastPayCode && lastPayCode.transaction_number) {
      const latestRefCode = lastPayCode.transaction_number;
      const refCodeParts = latestRefCode.split("-");
      if (refCodeParts.length === 4 && !isNaN(refCodeParts[3])) {
        const latestSequence = parseInt(refCodeParts[3], 10);
        const newSequence = String(latestSequence + 1).padStart(5, "0");
        newRefCode = `PLE-${currentMonth}-${newSequence}`;
      } else {
        newRefCode = `PLE-${currentMonth}-00001`;
      }
    } else {
      console.log("No matching records found, initializing new sequence.");
      newRefCode = `PLE-${currentMonth}-00001`;
    }

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
      },
    });

    const isPosted = findCutoff.isPosted;

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
            is_completed: data.paymentMethod === "Cash" ? true : false,
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
router.route("/payLocalExpensesDataFetching").get(async (req, res) => {
  try {
    const { startDate, endDate, filterColumn, searchText } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    let payBulkExpenseWhereClause = {
      module_from: req.query.foreign_url,
      pay_date: {
        [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
      },
    };

    switch (filterColumn) {
      // Filter for transaction number
      case "transaction_id":
        payBulkExpenseWhereClause["transaction_number"] = {
          [Op.like]: `%${searchText}%`,
        };
        break;
      // Filter for date request
      case "date_requested":
        payBulkExpenseWhereClause = {
          [Op.and]: [
            {
              module_from: req.query.foreign_url,
            },
            {
              pay_date: {
                [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
              },
            },
            sequelize.where(literal(`CAST(pay_date AS CHAR)`), {
              [Op.like]: `%${searchText}%`,
            }),
          ],
        };
        break;
      // Filter for Status
      case "status":
        payBulkExpenseWhereClause["status"] = {
          [Op.like]: `%${searchText}%`,
        };
        break;
      // Filter for all
      default:
        payBulkExpenseWhereClause = {
          [Op.or]: [
            {
              module_from: req.query.foreign_url,
              pay_date: {
                [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
              },
              transaction_number: {
                [Op.like]: `%${searchText}%`,
              },
            },
            {
              [Op.and]: [
                {
                  module_from: req.query.foreign_url,
                },
                {
                  pay_date: {
                    [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
                  },
                },
                sequelize.where(literal(`CAST(pay_date AS CHAR)`), {
                  [Op.like]: `%${searchText}%`,
                }),
              ],
            },
            {
              module_from: req.query.foreign_url,
              pay_date: {
                [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
              },
              status: {
                [Op.like]: `%${searchText}%`,
              },
            },
          ],
        };
        break;
    }

    const { count, rows: data } = await PayBulkExpenses.findAndCountAll({
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
      subQuery: false,
      distinct: true,
      limit: limit,
      offset: offset,
      order: [["createdAt", "DESC"]],
      where: { ...payBulkExpenseWhereClause, isDeleted: false },
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
      const totalExpenses =
        totalAmountExpenses + totalAddition - totalDeductions;

      return {
        ...expenses.toJSON(),
        totalExpenses,
      };
    });

    // console.log(expensesWithTotal);

    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page || 1),
      data: expensesWithTotal,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
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
      ? "Approved"
      : hasCashPayment
      ? "Partial-Paid"
      : "Approved";
    await PayBulkExpenses.update(
      { status: finalStatus, approved_by: userLoggedID },
      { where: { id: id } }
    );

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
      addedIds,
      floatPayment,
      expenses,
      userLoggedID,
      foreign_url,
      removePaymentListId,
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
      },
    });

    const isPosted = findCutoff.isPosted;

    // addedIds = transactions.map((item) => parseInt(item?.id));
    addedIds = transactions.map((item) => String(item?.id));
    // Convert all items to number then filter those only needed ids to remove
    removedIds = removedIds
      // ?.map((item) => parseInt(item))
      ?.map((item) => String(item))
      ?.filter((item) => {
        return !addedIds?.includes(item);
      });

    //For Activity Log

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

    //For aactivity

    const updateExpenses = await PayBulkExpenses.update(
      {
        pay_date: payDate,
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

      if (Array.isArray(removedIds)) {
        for (const removedId of removedIds) {
          await Expenses.update(
            {
              isAdded: false,
            },
            {
              where: {
                id: removedId,
              },
            }
          );

          await PayBulkExpensesTransaction.destroy({
            where: {
              pay_bulk_id: id, // Use pay_bulk_id from the request
              expenses_id: removedId, // Use current removed ID
            },
          });

          console.log(
            `Removed transaction with expenses_id: ${removedId} for pay_bulk_id: ${id}`
          );
        }
      }
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
            loan_or_account: pay.LoanORAccount,
            rate: pay.rate,
          });
        }
      }
      // return res.status(200).json({ isPosted: isPosted });
    }

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
        },
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

    const dataPayment = await PayBulkExpensesPayment.findAll({
      where: {
        pay_bulk_id: req.query.id,
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
      },
    });

    const isPosted = findCutoff.isPosted;

    res.json({ data, dataTransaction, dataPayment, dataAddDeduct, isPosted });
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/getLocalExpensesData").get(async (req, res) => {
  try {
    const { foreign, currency_id, searchText, filterColumn } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    // Expense Where clause
    let expenseWhereClause = {
      foreign: foreign,
      status: "Approved",
      isAdded: false,
      currency_id: currency_id,
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

    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page || 1),
      data: data,
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
module.exports = router;
