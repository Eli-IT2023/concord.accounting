// For Expense Journal: List of expense transactions with their expense2 id and amount
const buildExpenseTransactions = (transactionList) => {
  const expenseTransactions = transactionList?.reduce((acc, value) => {
    acc[value.transaction_id] = {
      expenses2Id: value.expenses2_id,
      amount: value.totalAmount,
    };

    return acc;
  }, {});

  return expenseTransactions;
};

module.exports = {
  buildExpenseTransactions,
};
