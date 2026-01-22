const Expenses = require("../../db/models/expenses.model");
const PayBulkExpensesTransaction = require("../../db/models/pay-bulk-expenses-transaction.model");
const PayBulkExpenses = require("../../db/models/pay-bulk-expenses.model");
const sequelize = require("../../db/config/sequelize.config");
const { where, Op, fn, col, literal } = require("sequelize");
const ExpenseJournal = require("../../db/models/expense_journal.model");
const { buildExpenseTransactions } = require("./expenseHelpers.js");

// Get all expenses that are not yet paid based on given PayBulkExpenses transaction number
const getUnpaidExpenses = async ({ transactionNumber, transaction }) => {
  const transactionList = await Expenses.findAll({
    attributes: [
      "expenses2_id",
      "client_transaction_id",
      "transaction_id",
      [
        sequelize.literal(`SUM(expenses.totalAmount - paid_amount)`),
        "totalAmount",
      ],
    ],
    include: [
      {
        model: PayBulkExpensesTransaction,
        required: true,
        attributes: [],
        include: [
          {
            model: PayBulkExpenses,
            required: true,
            attributes: [],
            where: {
              transaction_number: transactionNumber,
              isDeleted: false,
            },
          },
        ],
      },
    ],
    where: {
      status: {
        [Op.in]: ["Approved", "Partially-Paid"],
      },
      isDeleted: false,
    },
    group: ["expenses.id"],
    ...(transaction && { transaction }), // Optionally add sequelize transaction
  });

  return transactionList;
};

// Update expense status and paid amount
const updateExpenses = async ({
  transactionNumber,
  status,
  paidAmount,
  transaction, // For sequelize.transaction
}) => {
  await Expenses.update(
    {
      status,
      paid_amount: sequelize.literal(`paid_amount + ${paidAmount}`),
    },
    {
      where: {
        transaction_id: transactionNumber,
      },
      ...(transaction && { transaction }),
    }
  );
};

// For expense journal creation and update the paid_amount column per expense
const applyPayment = async ({
  paymentData,
  expenseTransactions,
  transaction, // For sequelize.transaction
}) => {
  let remainingAmount = paymentData.amount;
  const expenseJournal = [];

  // Apply the payment to each expense transaction in order,
  // reducing remainingAmount and recording applied amounts in the expense journal
  for (const [key, value] of Object.entries(expenseTransactions)) {
    if (remainingAmount === 0) break;

    const appliedAmount = Math.min(remainingAmount, value.amount); // Determine how much of the payment applies to this transaction

    const newAmount = value.amount - appliedAmount; // Calculate the new remaining amount for the transaction

    expenseTransactions[key] = { ...value, amount: newAmount }; // Update transaction with the new amount

    remainingAmount -= appliedAmount; // Subtract applied amount from the remaining payment

    // Expense journal datas
    expenseJournal.push({
      expenses2_id: value.expenses2Id,
      date: paymentData.date_issued,
      total_amount: appliedAmount,
      payment_type: "Credit",
      currency_name: paymentData.currencyName,
      currency_rate: paymentData.currencyRate,
    });

    const status = newAmount === 0 ? "Paid" : "Partially-Paid";
    await updateExpenses({
      transactionNumber: key,
      status,
      paidAmount: appliedAmount,
      transaction,
    });

    if (newAmount === 0) delete expenseTransactions[key]; // Remove the transaction from the list if its paid already
  }

  if (expenseJournal.length) {
    const options = transaction ? { transaction } : {};
    await ExpenseJournal.bulkCreate(expenseJournal, options);
  }
};

module.exports = {
  updateExpenses,
  getUnpaidExpenses,
  applyPayment,
};
