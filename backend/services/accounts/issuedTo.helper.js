const {
  issued_check,
  accountlist_sub3,
  accountlist_transaction_subject,
  bank_transaction,
  accountlist_base_subject,
  CashFlow,
} = require("../../db/models/ModelsBySubject/associations_sub.js");

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
  Vendors,
} = require("../../db/models/associations.js");

async function getIssuedTo(transactionNumber, moduleType) {
  if (!transactionNumber || !moduleType) return null;

  if (moduleType === "Local Expenses" || moduleType === "Overseas Expenses") {
    return {
      transactionNumber,
      moduleType,
      issuedTo: "Payment from Expenses",
    };
  } else if (
    moduleType === "Local Payable" ||
    moduleType === "Overseas Payable"
  ) {
    const getName = await PayableBulk.findOne({
      where: { transaction_number: transactionNumber },
      include: [
        {
          model: Vendors,
          required: true,
        },
      ],
    });
    return {
      transactionNumber,
      moduleType,
      issuedTo:
        getName.vendor.company_name ||
        `${getName.vendor.fname} ${getName.vendor.lname}`,
    };
  } else {
    return {
      transactionNumber,
      moduleType,
      issuedTo: "Not Specified",
    };
  }
}

module.exports = {
  getIssuedTo,
};
