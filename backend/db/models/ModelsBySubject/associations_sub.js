const accountlist_base_subject = require("./accountlist_base_sub.model");
const accountlist_sub3 = require("./accountlist_sub3.model");
const accountlist_transaction_subject = require("./accountlist_transaction_subject.model");
const currency_sub = require("../currency.model");
const issued_check = require("../issued_check.model");
const bank_transaction = require("../bank_transaction.model");
const CashFlow = require("../cash_flow.model");

const PayBulkExpensesPayment = require("../pay-bulk-expenses-payment.model");
const PayBulkExpensesTransaction = require("../pay-bulk-expenses-transaction.model");
const Equity = require("../ModelsBySubject/equity_type.model");
const EquitySub3 = require("../ModelsBySubject/equity_sub3.model");
const EquityTransaction = require("../ModelsBySubject/equity_transaction.model");
const BulkCollectionPayment = require("../bulk_collection_payment.model");
const assetaccountlist_base_subject = require("./assetaccountlist_base_sub.model");
const assetaccountlist_sub3 = require("./assetaccountlist_sub3.model");
const assetaccountlist_transaction_subject = require("./assetaccountlist_transaction_subject.model");

const payable_transaction_subject = require("../payable_transaction_subject.model");
const MasterList = require("../masterlist.model");
const ProfitLossReport = require("../profit_loss_report.model");
const ReceivingCheck = require("../receiving_check.model");

accountlist_base_subject.hasMany(accountlist_sub3, {
  foreignKey: "account_list_base_sub_id",
}); // ginamit
accountlist_sub3.belongsTo(accountlist_base_subject, {
  foreignKey: "account_list_base_sub_id",
}); // gumamit

currency_sub.hasMany(accountlist_sub3, {
  foreignKey: "currency_id",
}); // ginamit
accountlist_sub3.belongsTo(currency_sub, {
  foreignKey: "currency_id",
}); // gumamit

// ------------------Expenses_Payment x accountlist_sub3
// accountlist_sub3.hasMany(Expenses_Payment, {
//   foreignKey: "accountListSub_id",
// }); // ginamit
// Expenses_Payment.belongsTo(accountlist_sub3, {
//   foreignKey: "accountListSub_id",
// }); // gumamit
// ------------------Expenses_Payment x accountlist_sub3 END

// ------------------Expenses_Multiple x accountlist_sub3

// ------------------Expenses_Multiple x accountlist_sub3 END

accountlist_sub3.hasMany(BulkCollectionPayment, {
  foreignKey: "account_list_sub3_id",
}); // ginamit
BulkCollectionPayment.belongsTo(accountlist_sub3, {
  foreignKey: "account_list_sub3_id",
});
// accountlist_sub3.hasMany(accountlist_transaction_subject, {
//   foreignKey: "account_list_sub3_from",
//   as: "account_list_sub3_froms",
// }); // ginamit
// accountlist_transaction_subject.belongsTo(accountlist_sub3, {
//   foreignKey: "account_list_sub3_from",
//   as: "account_list_sub3_froms",
// }); // gumamit

// Receiving check
accountlist_sub3.hasMany(ReceivingCheck, {
  foreignKey: "account_list_sub3_id",
}); // ginamit
ReceivingCheck.belongsTo(accountlist_sub3, {
  foreignKey: "account_list_sub3_id",
}); // gumamit

accountlist_sub3.hasMany(accountlist_transaction_subject, {
  foreignKey: "sub_3_to",
  as: "sub3_tos",
}); // ginamit
accountlist_transaction_subject.belongsTo(accountlist_sub3, {
  foreignKey: "sub_3_to",
  as: "sub3_tos",
}); // gumamit

accountlist_sub3.hasMany(accountlist_transaction_subject, {
  foreignKey: "account_list_sub3_id_transacted",
  as: "transacteds",
}); // ginamit
accountlist_transaction_subject.belongsTo(accountlist_sub3, {
  foreignKey: "account_list_sub3_id_transacted",
  as: "transacteds",
}); // gumamit

// ------------------issued_check x accountlist_sub3
accountlist_sub3.hasMany(issued_check, {
  foreignKey: "account_list_id_issued_from",
  as: "account_list_id_issued_froms",
}); // ginamit
issued_check.belongsTo(accountlist_sub3, {
  foreignKey: "account_list_id_issued_from",
  as: "account_list_id_issued_froms",
}); // gumamit

accountlist_sub3.hasMany(issued_check, {
  foreignKey: "account_list_id_issued_to",
  as: "account_list_id_issued_tos",
}); // ginamit
issued_check.belongsTo(accountlist_sub3, {
  foreignKey: "account_list_id_issued_to",
  as: "account_list_id_issued_tos",
}); // gumamit
// --------------------issued_check x accountlist_sub3 END

// ------------------issued_check x masterlist
MasterList.hasMany(issued_check, {
  foreignKey: "confirmed_by",
  as: "issued_check_confirmed_by",
});
issued_check.belongsTo(MasterList, {
  foreignKey: "confirmed_by",
  as: "issued_check_ confirmed_by",
});

// --------------------issued_check x masterlist END

// ------------------issued_check x profit_loss_report
issued_check.hasMany(ProfitLossReport, {
  foreignKey: "issued_check_id",
});
ProfitLossReport.belongsTo(issued_check, {
  foreignKey: "issued_check_id",
});

// --------------------issued_check x profit_loss_report END

// ------------------bank_transaction x profit_loss_report
bank_transaction.hasMany(ProfitLossReport, {
  foreignKey: "bank_transaction_id",
});
ProfitLossReport.belongsTo(bank_transaction, {
  foreignKey: "bank_transaction_id",
});

// --------------------bank_transaction x profit_loss_report END

// ------------------bank_transaction x accountlist_sub3
accountlist_sub3.hasMany(bank_transaction, {
  foreignKey: "account_list_id_bank_from",
  as: "account_list_id_bank_froms",
}); // ginamit
bank_transaction.belongsTo(accountlist_sub3, {
  foreignKey: "account_list_id_bank_from",
  as: "account_list_id_bank_froms",
}); // gumamit

accountlist_sub3.hasMany(bank_transaction, {
  foreignKey: "account_list_id_bank_to",
  as: "account_list_id_bank_tos",
}); // ginamit
bank_transaction.belongsTo(accountlist_sub3, {
  foreignKey: "account_list_id_bank_to",
  as: "account_list_id_bank_tos",
}); // gumamit

// ------------------bank_transaction x accountlist_sub3 END

// ------------------bank_transaction x masterlist
MasterList.hasMany(bank_transaction, {
  foreignKey: "confirmed_by",
  as: "bank_confirmed_by",
});
bank_transaction.belongsTo(MasterList, {
  foreignKey: "confirmed_by",
  as: "bank_confirmed_by",
});

// ------------------bank_transaction x masterlist END

// ------------------cash_flow x accountlist_sub3
accountlist_sub3.hasMany(CashFlow, {
  foreignKey: "account_list_id_cash_from",
  as: "account_list_id_cash_froms",
}); // ginamit
CashFlow.belongsTo(accountlist_sub3, {
  foreignKey: "account_list_id_cash_from",
  as: "account_list_id_cash_froms",
}); // gumamit

accountlist_sub3.hasMany(CashFlow, {
  foreignKey: "account_list_id_cash_to",
  as: "account_list_id_cash_tos",
}); // ginamit
CashFlow.belongsTo(accountlist_sub3, {
  foreignKey: "account_list_id_cash_to",
  as: "account_list_id_cash_tos",
}); // gumamit
// ------------------cash_flow x accountlist_sub3 END

Equity.hasMany(EquitySub3, {
  foreignKey: "equity_id",
});
EquitySub3.belongsTo(Equity, {
  foreignKey: "equity_id",
});

EquitySub3.hasMany(EquityTransaction, {
  foreignKey: "equity_sub3_from",
  as: "equity_sub3_money_from",
}); // ginamit
EquityTransaction.belongsTo(EquitySub3, {
  foreignKey: "equity_sub3_from",
  as: "equity_sub3_money_from",
}); // gumamit

EquitySub3.hasMany(EquityTransaction, {
  foreignKey: "equity_sub3_to",
  as: "equity_sub3_money_to",
}); // ginamit
EquityTransaction.belongsTo(EquitySub3, {
  foreignKey: "equity_sub3_to",
  as: "equity_sub3_money_to",
}); // gumamit
assetaccountlist_base_subject.hasMany(assetaccountlist_sub3, {
  foreignKey: "assetaccount_list_base_sub_id",
});
assetaccountlist_sub3.belongsTo(assetaccountlist_base_subject, {
  foreignKey: "assetccount_list_base_sub_id",
});

assetaccountlist_sub3.hasMany(assetaccountlist_transaction_subject, {
  foreignKey: "assetaccount_list_sub3_from",
  as: "assetaccount_list_sub3_froms",
});
assetaccountlist_transaction_subject.belongsTo(assetaccountlist_sub3, {
  foreignKey: "assetaccount_list_sub3_from",
  as: "assetaccount_list_sub3_froms",
});

assetaccountlist_sub3.hasMany(assetaccountlist_transaction_subject, {
  foreignKey: "assetaccount_list_sub3_to",
  as: "assetaccount_list_sub3_tos",
});
assetaccountlist_transaction_subject.belongsTo(assetaccountlist_sub3, {
  foreignKey: "assetaccount_list_sub3_to",
  as: "assetaccount_list_sub3_tos",
});

// assetaccountlist_sub3.hasMany(issued_check, {
//   foreignKey: "assetaccount_list_id_issued_from",
//   as: "assetaccount_list_id_issued_froms",
// });
// issued_check.belongsTo(assetaccountlist_sub3, {
//   foreignKey: "assetaccount_list_id_issued_from",
//   as: "assetaccount_list_id_issued_froms",
// });

// assetaccountlist_sub3.hasMany(issued_check, {
//   foreignKey: "assetaccount_list_id_issued_to",
//   as: "assetaccount_list_id_issued_tos",
// });
// issued_check.belongsTo(assetaccountlist_sub3, {
//   foreignKey: "assetaccount_list_id_issued_to",
//   as: "assetaccount_list_id_issued_tos",
// });

accountlist_base_subject.hasMany(payable_transaction_subject, {
  foreignKey: "payble_list_sub3_id_transacted",
});
payable_transaction_subject.belongsTo(accountlist_base_subject, {
  foreignKey: "payble_list_sub3_id_transacted",
});

module.exports = {
  accountlist_base_subject,
  accountlist_sub3,
  accountlist_transaction_subject,
  currency_sub,

  issued_check,
  bank_transaction,
  CashFlow,
  Equity,
  EquitySub3,
  EquityTransaction,

  assetaccountlist_base_subject,
  assetaccountlist_sub3,
  assetaccountlist_transaction_subject,

  PayBulkExpensesPayment,
  PayBulkExpensesTransaction,
  payable_transaction_subject,

  ProfitLossReport,
};
