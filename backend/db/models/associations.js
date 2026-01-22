const Expenses2 = require("./expenses2.model");
const Label = require("./label.model");
const Label_Tag = require("./label_tags.model");
const Expenses1 = require("./expenses1.model");
const ProductList = require("./product.model");
const ProductImages = require("./product_images.model");
const MasterList = require("./masterlist.model");
const UserRole = require("./userRole.model");
const AccountList = require("./account_list.model");
const Currency = require("./currency.model");
const Payable = require("./payable.model");
const Payable_Product = require("./payable_products.model");
const Payable_Fees = require("./payable_otherFees.model");
const Payable_Payment = require("./payable_payment.model");
const Warehouse = require("./warehouse.model");
const Vendors = require("./vendors.model");
const Customer = require("./customer.model");
const CustomerCashWallet = require("./customer_cash_wallet.model");
const Product_Tag_Vendor = require("./product_tag_vendor.model");
const StockManagement = require("./stock_management.model");
const Account_Transaction = require("./account_transaction.model");
const Balance_History = require("./balance_history.model");
const Production = require("./production.model");
const FixedAsset = require("./fixed_asset.model");
const FixedAssetForecast = require("./fixed_asset_forecast.model");
const SalesInvoice = require("./invoice.model");
const OtherIncome = require("./other_income.model");
const SalesInvoiceInventory = require("./sales_invoice_tag_inventory.model");
// const BankTransaction = require("./bank_transaction.model");
const InventoryCounting = require("./inventory_counting.model");
const InventoryCountingItemList = require("./inventory_counting_item_list.model");
const Production_Raw_Used = require("./production_raw_used.model");
const Production_Finish_Product = require("./production_finish_product.model");
const Production_finish_raw_used = require("./production_finish_raw_used.model");
const BulkCollection = require("./bulk_collection.model");
const BulkCollectionTransaction = require("./bulk_collection_transaction.model");
const BulkCollectionPayment = require("./bulk_collection_payment.model");
const Expenses = require("./expenses.model");
const PayBulkExpensesTransaction = require("./pay-bulk-expenses-transaction.model");
const PayBulkExpensesPayment = require("./pay-bulk-expenses-payment.model");
const PayBulkExpenses = require("./pay-bulk-expenses.model");
const PayBulkAddDeductExpenses = require("./pay-bulk-add-deduct-expenses.model");
const Notification = require("./notification.model");
const accountlist_sub3 = require("../models/ModelsBySubject/accountlist_sub3.model");
// const CashFlow = require("./cash_flow.model");
// const IssuedCheck = require("./issued_check.model");
const Loan_mother = require("./loan_mother.model");
const Loan_history = require("./loan_history.model");
const Other_Income_Payment = require("./other_income_payment.model");

// const Loan = require("./loan_type.model");
// const LoanPayment = require("./loan_payment.model");
const Lending = require("./lend_type.model");
const LendPayment = require("./lend_payment.model");
const Equity = require("./ModelsBySubject/equity_type.model");
const EquityPayment = require("./equity_payment.model");
const AssetAccount = require("./asset_account.model");
const Liability = require("./liabilities.model");
const Cutoff = require("./cutoff.model");
const ReturnEarnings = require("./return_earnings.model");
const ReturnEarningsCutoffs = require("./return_earnings_cutoffs.model");

const PayableBulk = require("./payable_bulk.model");
const Payable_Bulk_Transaction = require("./payable_bulk_transaction");

const ReturnCapitalMother = require("./return_capital_mother.model");
const ReturnChildRetained = require("./return_child_retained.model");
const ReturnOwnerList = require("./return_ownerlist.model");
const ReturnCapitalPayments = require("./return_capital_payments.model");

const Inventory_Report = require("./inventory_report.model"); // old  for inventory report
const Inventory_Journal = require("./inventory_journal.model"); // new for inventory report

const StockTransfer = require("./stock_transfer.model");
const StockTransferProducts = require("./stock_transfer_products.model");
const StockTransferApproveProducts = require("./stock_transfer_approve_prod.model");
const AccountListBaseSub = require("./ModelsBySubject/accountlist_base_sub.model");
const Activity_Log = require("./activity_log.model");
const AccountListSub3 = require("../models/ModelsBySubject/accountlist_sub3.model");
const TransactionSubject = require("./ModelsBySubject/accountlist_transaction_subject.model");
const ProfitLossReport = require("./profit_loss_report.model");
const Previous_Profit_Loss = require("./previous_profit_loss.model");
const P_L_v2_report = require("./P_L_v2_report.model");
const ReceivingCheck = require("./receiving_check.model");

const CompanySettings = require("./company_settings.model");
const Profile_Image = require("./profile.model");

//LION CHEM
const Parameter = require("./parameters.model");
const Source = require("./source.model");
const TaxSettings = require("./tax_settings.model");

// purchases
const PurchaseRequest = require("./LionChem/Purchase/purchase_request.model");
const PurchaseRequestOrderItem = require("./LionChem/Purchase/purchase_request_order_item.model");

// settings
const Packaging = require("./LionChem/Settings/packaging.model");
const ProductionConsumableUsed = require("./production_consumable_used.model");

// reports
const PayableJournal = require("./payable_journal.model");
const SalesJournal = require("./sales_journal.model");
const ExpenseJournal = require("./expense_journal.model");

const Production_History = require("./production_history.model");
const Production_History_Suffix = require("./production_history_suffix.model");

UserRole.hasMany(MasterList, { foreignKey: "userrole_id" }); // ginamit
MasterList.belongsTo(UserRole, { foreignKey: "userrole_id" }); // gumamit

Expenses1.hasMany(Expenses2, { foreignKey: "expenses_type" }); // ginamit
Expenses2.belongsTo(Expenses1, { foreignKey: "expenses_type" }); // gumamit

Label.hasMany(Label_Tag, { foreignKey: "label_id" }); // ginamit
Label_Tag.belongsTo(Label, { foreignKey: "label_id" }); // gumamit

MasterList.hasMany(AccountList, { foreignKey: "masterlist_id" });
AccountList.belongsTo(MasterList, { foreignKey: "masterlist_id" });

Currency.hasMany(AccountList, { foreignKey: "currency_id" });
AccountList.belongsTo(Currency, { foreignKey: "currency_id" });

// Payable Module
Warehouse.hasMany(Payable, { foreignKey: "warehouse_id" });
Payable.belongsTo(Warehouse, { foreignKey: "warehouse_id" });

Vendors.hasMany(Payable, { foreignKey: "vendor_id" });
Payable.belongsTo(Vendors, { foreignKey: "vendor_id" });

Payable.hasMany(Payable_Product, { foreignKey: "payable_id" });
Payable_Product.belongsTo(Payable, { foreignKey: "payable_id" });

Product_Tag_Vendor.hasMany(Payable_Product, {
  foreignKey: "product_vendor_id",
});
Payable_Product.belongsTo(Product_Tag_Vendor, {
  foreignKey: "product_vendor_id",
});

// ***Start payable bulk associations
Payable.hasMany(Payable_Bulk_Transaction, { foreignKey: "payable_id" });
Payable_Bulk_Transaction.belongsTo(Payable, { foreignKey: "payable_id" });

Currency.hasMany(Payable, { foreignKey: "currencyId" });
Payable.belongsTo(Currency, { foreignKey: "currencyId" });

Currency.hasMany(PayableBulk, { foreignKey: "currency_id" });
PayableBulk.belongsTo(Currency, { foreignKey: "currency_id" });

PayableBulk.hasMany(Payable_Bulk_Transaction, {
  foreignKey: "payable_bulk_id",
});
Payable_Bulk_Transaction.belongsTo(PayableBulk, {
  foreignKey: "payable_bulk_id",
});

Payable.hasMany(Payable_Fees, { foreignKey: "payable_id" });
Payable_Fees.belongsTo(Payable, { foreignKey: "payable_id" });

PayableBulk.hasMany(Payable_Payment, { foreignKey: "payable_id" });
Payable_Payment.belongsTo(PayableBulk, { foreignKey: "payable_id" });

accountlist_sub3.hasMany(Payable_Payment, {
  foreignKey: "accountList_id",
});
Payable_Payment.belongsTo(accountlist_sub3, {
  foreignKey: "accountList_id",
});

Vendors.hasMany(PayableJournal, { foreignKey: "vendor_id" });
PayableJournal.belongsTo(Vendors, { foreignKey: "vendor_id" });

Vendors.hasMany(PayableBulk, { foreignKey: "vendor_id" });
PayableBulk.belongsTo(Vendors, { foreignKey: "vendor_id" });

// ***End payable bulk associations

// Payable Module END
Customer.hasMany(CustomerCashWallet, { foreignKey: "customer_id" });
CustomerCashWallet.belongsTo(Customer, { foreignKey: "customer_id" });

//Product and Vendor
ProductList.hasMany(Product_Tag_Vendor, { foreignKey: "product_id" });
Product_Tag_Vendor.belongsTo(ProductList, { foreignKey: "product_id" });

Vendors.hasMany(Product_Tag_Vendor, { foreignKey: "vendor_id" });
Product_Tag_Vendor.belongsTo(Vendors, { foreignKey: "vendor_id" });
//Product and Vendor End

ProductList.hasMany(StockManagement, { foreignKey: "product_id" });
StockManagement.belongsTo(ProductList, { foreignKey: "product_id" });

Warehouse.hasMany(StockManagement, { foreignKey: "warehouse_id" });
StockManagement.belongsTo(Warehouse, { foreignKey: "warehouse_id" });

AccountList.hasMany(Account_Transaction, {
  foreignKey: "account_list_id",
  as: "transferor",
});
Account_Transaction.belongsTo(AccountList, {
  foreignKey: "account_list_id",
  as: "transferor",
});

AccountList.hasMany(Account_Transaction, {
  foreignKey: "receiver",
  as: "to_receiver",
});
Account_Transaction.belongsTo(AccountList, {
  foreignKey: "receiver",
  as: "to_receiver",
});

Currency.hasMany(Account_Transaction, { foreignKey: "currency_id" });
Account_Transaction.belongsTo(Currency, { foreignKey: "currency_id" });

AccountList.hasMany(Balance_History, { foreignKey: "account_list_id" });
Balance_History.belongsTo(AccountList, { foreignKey: "account_list_id" });

Customer.hasMany(SalesInvoice, { foreignKey: "customer_id" });
SalesInvoice.belongsTo(Customer, { foreignKey: "customer_id" });

Currency.hasMany(SalesInvoice, { foreignKey: "currency_id" });
SalesInvoice.belongsTo(Currency, { foreignKey: "currency_id" });

SalesInvoice.hasMany(SalesInvoiceInventory, { foreignKey: "sales_invoice_id" });
SalesInvoiceInventory.belongsTo(SalesInvoice, {
  foreignKey: "sales_invoice_id",
});

StockManagement.hasMany(SalesInvoiceInventory, {
  foreignKey: "stock_management_id",
});
SalesInvoiceInventory.belongsTo(StockManagement, {
  foreignKey: "stock_management_id",
});

Vendors.hasMany(StockManagement, { foreignKey: "vendor_id" });
StockManagement.belongsTo(Vendors, { foreignKey: "vendor_id" });

MasterList.hasMany(InventoryCounting, {
  foreignKey: "created_by",
  as: "inventory_counting_created_by",
});
InventoryCounting.belongsTo(MasterList, {
  foreignKey: "created_by",
  as: "inventory_counting_created_by",
});

MasterList.hasMany(InventoryCounting, {
  foreignKey: "approved_by",
  as: "inventory_counting_approved_by",
});
InventoryCounting.belongsTo(MasterList, {
  foreignKey: "approved_by",
  as: "inventory_counting_approved_by",
});

InventoryCounting.hasMany(InventoryCountingItemList, {
  foreignKey: "inventory_counting_id",
});
InventoryCountingItemList.belongsTo(InventoryCounting, {
  foreignKey: "inventory_counting_id",
});

StockManagement.hasMany(InventoryCountingItemList, {
  foreignKey: "stock_management_id",
});
InventoryCountingItemList.belongsTo(StockManagement, {
  foreignKey: "stock_management_id",
});

ProductList.hasMany(InventoryCountingItemList, {
  foreignKey: "product_id",
});
InventoryCountingItemList.belongsTo(ProductList, {
  foreignKey: "product_id",
});

Warehouse.hasMany(InventoryCountingItemList, {
  foreignKey: "warehouse_id",
});
InventoryCountingItemList.belongsTo(Warehouse, {
  foreignKey: "warehouse_id",
});

/// PRODUCTIONS ASSOCIATIONS

ProductionConsumableUsed.belongsTo(Production, { foreignKey: "production_id" });
Production.hasMany(ProductionConsumableUsed, { foreignKey: "production_id" });

ProductionConsumableUsed.belongsTo(ProductList, { foreignKey: "product_id" });
ProductList.hasMany(ProductionConsumableUsed, { foreignKey: "product_id" });

ProductionConsumableUsed.belongsTo(StockManagement, {
  foreignKey: "stock_management_id",
});
StockManagement.hasMany(ProductionConsumableUsed, {
  foreignKey: "stock_management_id",
});

MasterList.hasMany(Production, {
  foreignKey: "created_by",
  as: "production_createdy_by",
});
Production.belongsTo(MasterList, {
  foreignKey: "created_by",
  as: "production_created_by",
});

Warehouse.hasMany(Production, {
  foreignKey: "warehouse_id",
});
Production.belongsTo(Warehouse, {
  foreignKey: "warehouse_id",
});

Vendors.hasMany(Production_Raw_Used, {
  foreignKey: "vendor_id",
});
Production_Raw_Used.belongsTo(Vendors, {
  foreignKey: "vendor_id",
});

Production.hasMany(Production_Raw_Used, {
  foreignKey: "production_id",
});
Production_Raw_Used.belongsTo(Production, {
  foreignKey: "production_id",
});

StockManagement.hasMany(Production_Raw_Used, {
  foreignKey: "stock_management_id",
});
Production_Raw_Used.belongsTo(StockManagement, {
  foreignKey: "stock_management_id",
});

ProductList.hasMany(Production_Raw_Used, {
  foreignKey: "product_id",
});
Production_Raw_Used.belongsTo(ProductList, {
  foreignKey: "product_id",
});

Production.hasMany(Production_Finish_Product, {
  foreignKey: "production_id",
});
Production_Finish_Product.belongsTo(Production, {
  foreignKey: "production_id",
});

ProductList.hasMany(Production_Finish_Product, {
  foreignKey: "product_id",
});
Production_Finish_Product.belongsTo(ProductList, {
  foreignKey: "product_id",
});

Production_Finish_Product.hasMany(Production_finish_raw_used, {
  foreignKey: "production_finish_product_id",
});
Production_finish_raw_used.belongsTo(Production_Finish_Product, {
  foreignKey: "production_finish_product_id",
});

Production_Raw_Used.hasMany(Production_finish_raw_used, {
  foreignKey: "production_raw_used_id",
});
Production_finish_raw_used.belongsTo(Production_Raw_Used, {
  foreignKey: "production_raw_used_id",
});

// AccountList.hasMany(BankTransaction, { foreignKey: "account_list_id" });
// BankTransaction.belongsTo(AccountList, { foreignKey: "account_list_id" });

// AccountList.hasMany(CashFlow, { foreignKey: "account_list_id" });
// CashFlow.belongsTo(AccountList, { foreignKey: "account_list_id" });

// AccountList.hasMany(IssuedCheck, { foreignKey: "account_list_id" });
// IssuedCheck.belongsTo(AccountList, { foreignKey: "account_list_id" });

Customer.hasMany(BulkCollection, {
  foreignKey: "customer_id",
});
BulkCollection.belongsTo(Customer, {
  foreignKey: "customer_id",
});

Customer.hasMany(SalesJournal, {
  foreignKey: "customer_id",
});
SalesJournal.belongsTo(Customer, {
  foreignKey: "customer_id",
});

Currency.hasMany(BulkCollection, {
  foreignKey: "currency_id",
});
BulkCollection.belongsTo(Currency, {
  foreignKey: "currency_id",
});

MasterList.hasMany(BulkCollection, {
  foreignKey: "created_by",
  as: "bulk_collection_created_by",
});
BulkCollection.belongsTo(MasterList, {
  foreignKey: "created_by",
  as: "bulk_collection_created_by",
});

MasterList.hasMany(BulkCollection, {
  foreignKey: "approved_by",
  as: "bulk_collection_approved_by",
});
BulkCollection.belongsTo(MasterList, {
  foreignKey: "approved_by",
  as: "bulk_collection_approved_by",
});

BulkCollection.hasMany(BulkCollectionTransaction, {
  foreignKey: "bulk_collection_id",
});
BulkCollectionTransaction.belongsTo(BulkCollection, {
  foreignKey: "bulk_collection_id",
});

BulkCollection.hasMany(BulkCollectionPayment, {
  foreignKey: "bulk_collection_id",
});
BulkCollectionPayment.belongsTo(BulkCollection, {
  foreignKey: "bulk_collection_id",
});

MasterList.hasMany(BulkCollectionPayment, {
  foreignKey: "collected_by",
  as: "bulk_collection_payment_collected_by",
});
BulkCollectionPayment.belongsTo(MasterList, {
  foreignKey: "collected_by",
  as: "bulk_collection_payment_collected_by",
});

BulkCollectionPayment.hasMany(ProfitLossReport, {
  foreignKey: "collection_check_id",
});
ProfitLossReport.belongsTo(BulkCollectionPayment, {
  foreignKey: "collection_check_id",
});

BulkCollectionPayment.hasMany(ReceivingCheck, {
  foreignKey: "bulk_collection_payment_id",
});
ReceivingCheck.belongsTo(BulkCollectionPayment, {
  foreignKey: "bulk_collection_payment_id",
});

Currency.hasMany(ReceivingCheck, {
  foreignKey: "currency_id",
});
ReceivingCheck.belongsTo(Currency, {
  foreignKey: "currency_id",
});

SalesInvoice.hasMany(BulkCollectionTransaction, {
  foreignKey: "bulk_collection_id",
});
BulkCollectionTransaction.belongsTo(SalesInvoice, {
  foreignKey: "bulk_collection_id",
});

SalesInvoice.hasMany(BulkCollectionTransaction, {
  foreignKey: "bulk_collection_id",
});
BulkCollectionTransaction.belongsTo(SalesInvoice, {
  foreignKey: "bulk_collection_id",
});

MasterList.hasMany(SalesInvoice, {
  foreignKey: "created_by",
  as: "sales_created_masterlist",
});
SalesInvoice.belongsTo(MasterList, {
  foreignKey: "created_by",
  as: "sales_created_masterlist",
});

MasterList.hasMany(SalesInvoice, {
  foreignKey: "approved_by",
  as: "sales_approved_masterlist",
});
SalesInvoice.belongsTo(MasterList, {
  foreignKey: "approved_by",
  as: "sales_approved_masterlist",
});

MasterList.hasMany(OtherIncome, {
  foreignKey: "created_by",
  as: "other_income_created_by",
});
OtherIncome.belongsTo(MasterList, {
  foreignKey: "created_by",
  as: "other_income_created_by",
});

MasterList.hasMany(OtherIncome, {
  foreignKey: "approved_by",
  as: "other_income_approved_by",
});
OtherIncome.belongsTo(MasterList, {
  foreignKey: "approved_by",
  as: "other_income_approved_by",
});

OtherIncome.hasMany(AccountList, {
  foreignKey: "acount_list_id",
});
AccountList.belongsTo(OtherIncome, {
  foreignKey: "acount_list_id",
});

// AccountList.hasMany(BulkCollectionPayment, {
//   foreignKey: "accountList_id",
// });
// BulkCollectionPayment.belongsTo(AccountList, {
//   foreignKey: "accountList_id",
// });

// AccountList.hasMany(BulkCollectionPayment, {
//   foreignKey: "bulk_collection_id",
// });
// BulkCollectionPayment.belongsTo(AccountList, {
//   foreignKey: "bulk_collection_id",
// });

SalesInvoice.hasMany(BulkCollectionTransaction, {
  foreignKey: "sales_invoice_id",
});
BulkCollectionTransaction.belongsTo(SalesInvoice, {
  foreignKey: "sales_invoice_id",
});

////---------------------------------------------------
// Vendors.hasMany(Expenses, {
//   foreignKey: "vendor_id",
// });
// Expenses.belongsTo(Vendors, {
//   foreignKey: "vendor_id",
// });

// ProductList.hasMany(Expenses, {
//   foreignKey: "product_id",
// });
// Expenses.belongsTo(ProductList, {
//   foreignKey: "product_id",
// });

Currency.hasMany(Vendors, {
  foreignKey: "currency_id",
});
Vendors.belongsTo(Currency, {
  foreignKey: "currency_id",
});

// ProductList.hasMany(Expenses, {
//   foreignKey: "product_id",
// });
// Expenses.belongsTo(ProductList, {
//   foreignKey: "product_id",
// });

Expenses2.hasMany(ExpenseJournal, {
  foreignKey: "expenses2_id",
});
ExpenseJournal.belongsTo(Expenses2, {
  foreignKey: "expenses2_id",
});

Expenses2.hasMany(Expenses, {
  foreignKey: "expenses2_id",
});
Expenses.belongsTo(Expenses2, {
  foreignKey: "expenses2_id",
});

Currency.hasMany(Expenses, {
  foreignKey: "currency_id",
});
Expenses.belongsTo(Currency, {
  foreignKey: "currency_id",
});

MasterList.hasMany(Expenses, {
  foreignKey: "created_by",
  as: "ex_created_masterlist",
});
Expenses.belongsTo(MasterList, {
  foreignKey: "created_by",
  as: "ex_created_masterlist",
});

MasterList.hasMany(Expenses, {
  foreignKey: "approved_by",
  as: "ex_approved_masterlist",
});
Expenses.belongsTo(MasterList, {
  foreignKey: "approved_by",
  as: "ex_approved_masterlist",
});

Expenses.hasMany(PayBulkExpensesTransaction, {
  foreignKey: "expenses_id",
});
PayBulkExpensesTransaction.belongsTo(Expenses, {
  foreignKey: "expenses_id",
});

PayBulkExpenses.hasMany(PayBulkExpensesTransaction, {
  foreignKey: "pay_bulk_id",
});
PayBulkExpensesTransaction.belongsTo(PayBulkExpenses, {
  foreignKey: "pay_bulk_id",
});

PayBulkExpenses.hasMany(PayBulkAddDeductExpenses, {
  foreignKey: "pay_bulk_id",
});
PayBulkAddDeductExpenses.belongsTo(PayBulkExpenses, {
  foreignKey: "pay_bulk_id",
});

Currency.hasMany(PayBulkExpenses, { foreignKey: "currency_id" });
PayBulkExpenses.belongsTo(Currency, { foreignKey: "currency_id" });

MasterList.hasMany(PayBulkExpenses, {
  foreignKey: "created_by",
  as: "pay_bulk_created_masterlist",
});
PayBulkExpenses.belongsTo(MasterList, {
  foreignKey: "created_by",
  as: "pay_bulk_created_masterlist",
});

MasterList.hasMany(PayBulkExpenses, {
  foreignKey: "approved_by",
  as: "pay_bulk_approved_masterlist",
});
PayBulkExpenses.belongsTo(MasterList, {
  foreignKey: "approved_by",
  as: "pay_bulk_approved_masterlist",
});

accountlist_sub3.hasMany(PayBulkAddDeductExpenses, {
  foreignKey: "account_list_sub3_id",
});
PayBulkAddDeductExpenses.belongsTo(accountlist_sub3, {
  foreignKey: "account_list_sub3_id",
});

Loan_mother.hasMany(PayBulkAddDeductExpenses, {
  foreignKey: "loan_id",
});
PayBulkAddDeductExpenses.belongsTo(Loan_mother, {
  foreignKey: "loan_id",
});

PayBulkExpenses.hasMany(PayBulkExpensesPayment, {
  foreignKey: "pay_bulk_id",
});
PayBulkExpensesPayment.belongsTo(PayBulkExpenses, {
  foreignKey: "pay_bulk_id",
});

accountlist_sub3.hasMany(PayBulkExpensesPayment, {
  foreignKey: "account_list_sub3_id",
});
PayBulkExpensesPayment.belongsTo(accountlist_sub3, {
  foreignKey: "account_list_sub3_id",
});
// Expenses.hasMany(Expenses_Multiple, {
//   foreignKey: "expenses_id",
// });
// Expenses_Multiple.belongsTo(Expenses, {
//   foreignKey: "expenses_id",
// });

// Loan.hasMany(Expenses_Multiple, {
//   foreignKey: "loan_id",
// });
// Expenses_Multiple.belongsTo(Loan, {
//   foreignKey: "loan_id",
// });

// AccountList.hasMany(Expenses_Payment, {
//   foreignKey: "accountList_id",
// });
// Expenses_Payment.belongsTo(AccountList, {
//   foreignKey: "accountList_id",
// });

// MasterList.hasMany(Loan, {
//   foreignKey: "masterlist_id",
// });
// Loan.belongsTo(MasterList, {
//   foreignKey: "masterlist_id",
// });

// AccountList.hasMany(Loan, {
//   foreignKey: "account_list_id",
// });
// Loan.belongsTo(AccountList, {
//   foreignKey: "account_list_id",
// });

// Loan.hasMany(LoanPayment, {
//   foreignKey: "loan_id",
// });
// LoanPayment.belongsTo(Loan, {
//   foreignKey: "loan_id",
// });

MasterList.hasMany(Lending, {
  foreignKey: "masterlist_id",
});
Lending.belongsTo(MasterList, {
  foreignKey: "masterlist_id",
});

AccountList.hasMany(Lending, {
  foreignKey: "account_list_id",
});
Lending.belongsTo(AccountList, {
  foreignKey: "account_list_id",
});

Lending.hasMany(LendPayment, {
  foreignKey: "lend_id",
});
LendPayment.belongsTo(Lending, {
  foreignKey: "lend_id",
});

AccountList.hasMany(LendPayment, {
  foreignKey: "account_id",
});
LendPayment.belongsTo(AccountList, {
  foreignKey: "account_id",
});

MasterList.hasMany(AssetAccount, {
  foreignKey: "masterlist_id",
});
AssetAccount.belongsTo(MasterList, {
  foreignKey: "masterlist_id",
});

AccountList.hasMany(AssetAccount, {
  foreignKey: "account_list_id",
});
AssetAccount.belongsTo(AccountList, {
  foreignKey: "account_list_id",
});

Label.hasMany(AssetAccount, {
  foreignKey: "label_id",
});
AssetAccount.belongsTo(Label, {
  foreignKey: "label_id",
});

MasterList.hasMany(Liability, {
  foreignKey: "masterlist_id",
});
Liability.belongsTo(MasterList, {
  foreignKey: "masterlist_id",
});

AccountList.hasMany(Liability, {
  foreignKey: "account_list_id",
});
Liability.belongsTo(AccountList, {
  foreignKey: "account_list_id",
});

Label.hasMany(Liability, {
  foreignKey: "label_id",
});
Liability.belongsTo(Label, {
  foreignKey: "label_id",
});

accountlist_sub3.hasMany(SalesInvoice, {
  foreignKey: "account_list_sub3_id",
});
SalesInvoice.belongsTo(accountlist_sub3, {
  foreignKey: "account_list_sub3_id",
});

Warehouse.hasMany(SalesInvoice, { foreignKey: "warehouse_id" });
SalesInvoice.belongsTo(Warehouse, { foreignKey: "warehouse_id" });

// AccountList.hasMany(LoanPayment, {
//   foreignKey: "account_list_id",
// });
// LoanPayment.belongsTo(AccountList, {
//   foreignKey: "account_list_id",
// });

// Label.hasMany(Loan, {
//   foreignKey: "label_id",
// });
// Loan.belongsTo(Label, {
//   foreignKey: "label_id",
// });

// Label.hasMany(Loan_label_mother, {
//   foreignKey: "label_id",
// });
// Loan_label_mother.belongsTo(Label, {
//   foreignKey: "label_id",
// });

// Loan_label_mother.hasMany(Loan, {
//   foreignKey: "loan_label_mother_id",
// });
// Loan.belongsTo(Loan_label_mother, {
//   foreignKey: "loan_label_mother_id",
// });

// AccountList.hasMany(Loan_label_mother, {
//   foreignKey: "account_list_id",
// });
// Loan_label_mother.belongsTo(AccountList, {
//   foreignKey: "account_list_id",
// });

AssetAccount.hasMany(Lending, {
  foreignKey: "asset_account_id",
});
Lending.belongsTo(AssetAccount, {
  foreignKey: "asset_account_id",
});

AccountList.hasMany(EquityPayment, {
  foreignKey: "account_id",
});
EquityPayment.belongsTo(AccountList, {
  foreignKey: "account_id",
});
OtherIncome.hasMany(Other_Income_Payment, {
  foreignKey: "other_income_id",
});
Other_Income_Payment.belongsTo(OtherIncome, {
  foreignKey: "other_income_id",
});

accountlist_sub3.hasMany(Other_Income_Payment, {
  foreignKey: "account_list_sub3_id",
});
Other_Income_Payment.belongsTo(accountlist_sub3, {
  foreignKey: "account_list_sub3_id",
});

// ProductList.hasMany(FixedAsset, {
//   foreignKey: "product_id",
// });
// FixedAsset.belongsTo(ProductList, {
//   foreignKey: "product_id",
// });

// Expenses.hasMany(FixedAsset, {
//   foreignKey: "expenses_id",
// });
// FixedAsset.belongsTo(Expenses, {
//   foreignKey: "expenses_id",
// });

FixedAsset.hasMany(FixedAssetForecast, {
  foreignKey: "fixed_asset_id",
});
FixedAssetForecast.belongsTo(FixedAsset, {
  foreignKey: "fixed_asset_id",
});

ReturnEarnings.hasMany(ReturnEarningsCutoffs, {
  foreignKey: "return_earnings_id",
});
ReturnEarningsCutoffs.belongsTo(ReturnEarnings, {
  foreignKey: "return_earnings_id",
});

Cutoff.hasMany(ReturnEarningsCutoffs, {
  foreignKey: "cutoff_id",
});
ReturnEarningsCutoffs.belongsTo(Cutoff, {
  foreignKey: "cutoff_id",
});

Loan_mother.hasMany(Loan_history, {
  foreignKey: "loan_id",
});
Loan_history.belongsTo(Loan_mother, {
  foreignKey: "loan_id",
});

Currency.hasMany(Loan_mother, {
  foreignKey: "currency_id",
});
Loan_mother.belongsTo(Currency, {
  foreignKey: "currency_id",
});

MasterList.hasMany(Loan_mother, {
  foreignKey: "created_by",
  as: "loan_created_masterlist",
});
Loan_mother.belongsTo(MasterList, {
  foreignKey: "created_by",
  as: "loan_created_masterlist",
});

MasterList.hasMany(Loan_mother, {
  foreignKey: "approved_by",
  as: "loan_approval_masterlist",
});
Loan_mother.belongsTo(MasterList, {
  foreignKey: "approved_by",
  as: "loan_approval_masterlist",
});

AccountListBaseSub.hasMany(Loan_mother, {
  foreignKey: "subject2_id",
});
Loan_mother.belongsTo(AccountListBaseSub, {
  foreignKey: "subject2_id",
});

accountlist_sub3.hasMany(Loan_mother, {
  foreignKey: "subject3_id",
});
Loan_mother.belongsTo(accountlist_sub3, {
  foreignKey: "subject3_id",
});

BulkCollectionPayment.hasMany(Loan_mother, {
  foreignKey: "bulk_payment_id",
});
Loan_mother.belongsTo(BulkCollectionPayment, {
  foreignKey: "bulk_payment_id",
});

ReturnCapitalMother.hasMany(ReturnChildRetained, {
  foreignKey: "return_capital_mother_id",
});
ReturnChildRetained.belongsTo(ReturnCapitalMother, {
  foreignKey: "return_capital_mother_id",
});

ReturnEarnings.hasMany(ReturnChildRetained, {
  foreignKey: "return_earnings_id",
});
ReturnChildRetained.belongsTo(ReturnEarnings, {
  foreignKey: "return_earnings_id",
});

accountlist_sub3.hasMany(ReturnOwnerList, {
  foreignKey: "account_list_sub3_id",
});
ReturnOwnerList.belongsTo(accountlist_sub3, {
  foreignKey: "account_list_sub3_id",
});

ReturnCapitalMother.hasMany(ReturnOwnerList, {
  foreignKey: "return_capital_mother_id",
});
ReturnOwnerList.belongsTo(ReturnCapitalMother, {
  foreignKey: "return_capital_mother_id",
});
ProductList.hasMany(Inventory_Report, { foreignKey: "product_id" });
Inventory_Report.belongsTo(ProductList, { foreignKey: "product_id" });

Cutoff.hasMany(Inventory_Report, { foreignKey: "cut_off_id" });
Inventory_Report.belongsTo(Cutoff, { foreignKey: "cut_off_id" });

SalesInvoice.hasMany(Inventory_Report, { foreignKey: "sales_invoice_id" });
Inventory_Report.belongsTo(SalesInvoice, { foreignKey: "sales_invoice_id" });

// --- Inventory Journal associations ---

ProductList.hasMany(Inventory_Journal, { foreignKey: "product_id" });
Inventory_Journal.belongsTo(ProductList, { foreignKey: "product_id" });

Warehouse.hasMany(Inventory_Journal, { foreignKey: "warehouse_id" });
Inventory_Journal.belongsTo(Warehouse, { foreignKey: "warehouse_id" });

accountlist_sub3.hasMany(ReturnCapitalPayments, {
  foreignKey: "account_list_id_payment",
});
ReturnCapitalPayments.belongsTo(accountlist_sub3, {
  foreignKey: "account_list_id_payment",
});

ReturnOwnerList.hasMany(ReturnCapitalPayments, {
  foreignKey: "return_owner_list_id",
});
ReturnCapitalPayments.belongsTo(ReturnOwnerList, {
  foreignKey: "return_owner_list_id",
});

MasterList.hasMany(StockTransfer, {
  foreignKey: "created_by",
  as: "stock_transfer_created_by",
});
StockTransfer.belongsTo(MasterList, {
  foreignKey: "created_by",
  as: "stock_transfer_created_by",
});

MasterList.hasMany(StockTransfer, {
  foreignKey: "approved_by",
  as: "stock_transfer_approved_by",
});
StockTransfer.belongsTo(MasterList, {
  foreignKey: "approved_by",
  as: "stock_transfer_approved_by",
});

Warehouse.hasMany(StockTransfer, {
  foreignKey: "warehouse_from_id",
  as: "warehouse_from",
});
StockTransfer.belongsTo(Warehouse, {
  foreignKey: "warehouse_from_id",
  as: "warehouse_from",
});

Warehouse.hasMany(StockTransfer, {
  foreignKey: "warehouse_to_id",
  as: "warehouse_to",
});
StockTransfer.belongsTo(Warehouse, {
  foreignKey: "warehouse_to_id",
  as: "warehouse_to",
});

StockTransfer.hasMany(StockTransferProducts, {
  foreignKey: "stock_transfer_id",
});
StockTransferProducts.belongsTo(StockTransfer, {
  foreignKey: "stock_transfer_id",
});

ProductList.hasMany(StockTransferProducts, {
  foreignKey: "product_id",
});
StockTransferProducts.belongsTo(ProductList, {
  foreignKey: "product_id",
});

StockTransferProducts.hasMany(StockTransferApproveProducts, {
  foreignKey: "stock_transfer_products_id",
});
StockTransferApproveProducts.belongsTo(StockTransferProducts, {
  foreignKey: "stock_transfer_products_id",
});

StockManagement.hasMany(StockTransferApproveProducts, {
  foreignKey: "stockmanagement_id",
});
StockTransferApproveProducts.belongsTo(StockManagement, {
  foreignKey: "stockmanagement_id",
});

MasterList.hasMany(Payable, {
  foreignKey: "created_by",
  as: "created_masterlist",
});
Payable.belongsTo(MasterList, {
  foreignKey: "created_by",
  as: "created_masterlist",
});

MasterList.hasMany(Payable, {
  foreignKey: "approved_by",
  as: "approved_masterlist",
});
Payable.belongsTo(MasterList, {
  foreignKey: "approved_by",
  as: "approved_masterlist",
});

// Payable Bulk
MasterList.hasMany(PayableBulk, {
  foreignKey: "created_by",
  as: "payable_bulk_created_masterlist",
});
PayableBulk.belongsTo(MasterList, {
  foreignKey: "created_by",
  as: "payable_bulk_created_masterlist",
});

MasterList.hasMany(PayableBulk, {
  foreignKey: "approved_by",
  as: "payable_bulk_approved_masterlist",
});
PayableBulk.belongsTo(MasterList, {
  foreignKey: "approved_by",
  as: "payable_bulk_approved_masterlist",
});

//Fixed Asset
MasterList.hasMany(FixedAsset, {
  foreignKey: "created_by",
  as: "fixed_aseet_created_masterlist",
});
FixedAsset.belongsTo(MasterList, {
  foreignKey: "created_by",
  as: "fixed_aseet_created_masterlist",
});

MasterList.hasMany(FixedAsset, {
  foreignKey: "approved_by",
  as: "fixed_aseet_approved_masterlist",
});
FixedAsset.belongsTo(MasterList, {
  foreignKey: "approved_by",
  as: "fixed_aseet_approved_masterlist",
});

Currency.hasMany(FixedAsset, {
  foreignKey: "currency_id",
});
FixedAsset.belongsTo(Currency, {
  foreignKey: "currency_id",
});

Expenses.hasMany(FixedAssetForecast, {
  foreignKey: "expense_id",
});
FixedAssetForecast.belongsTo(Expenses, {
  foreignKey: "expense_id",
});

//Return Earnings
MasterList.hasMany(ReturnCapitalMother, {
  foreignKey: "created_by",
  as: "return_capital_mother_created_masterlist",
});
ReturnCapitalMother.belongsTo(MasterList, {
  foreignKey: "created_by",
  as: "return_capital_mother_created_masterlist",
});

MasterList.hasMany(ReturnCapitalMother, {
  foreignKey: "approved_by",
  as: "return_capital_mother_approved_masterlist",
});
ReturnCapitalMother.belongsTo(MasterList, {
  foreignKey: "approved_by",
  as: "return_capital_mother_approved_masterlist",
});

//Activity log
MasterList.hasMany(Activity_Log, {
  foreignKey: "masterlist_id",
});
Activity_Log.belongsTo(MasterList, {
  foreignKey: "masterlist_id",
});

// Account List
MasterList.hasMany(AccountListSub3, {
  foreignKey: "created_by",
});
AccountListSub3.belongsTo(MasterList, {
  foreignKey: "created_by",
});

// Transac Subject
MasterList.hasMany(TransactionSubject, {
  foreignKey: "transferred_by",
});
TransactionSubject.belongsTo(MasterList, {
  foreignKey: "transferred_by",
});

// Profit Loss Report
Currency.hasMany(ProfitLossReport, {
  foreignKey: "currency_id",
});
ProfitLossReport.belongsTo(Currency, {
  foreignKey: "currency_id",
});

accountlist_sub3.hasMany(Previous_Profit_Loss, {
  foreignKey: "account_list_id",
});
Previous_Profit_Loss.belongsTo(accountlist_sub3, {
  foreignKey: "account_list_id",
});

Currency.hasMany(Previous_Profit_Loss, {
  foreignKey: "currency_id",
});
Previous_Profit_Loss.belongsTo(Currency, {
  foreignKey: "currency_id",
});

// ProductList.hasMany(ProductImages, { foreignKey: "product_id" });
// ProductImages.belongsTo(ProductList, { foreignKey: "product_id" });

MasterList.hasOne(Profile_Image, { foreignKey: "emp_id" });
Profile_Image.belongsTo(MasterList, { foreignKey: "emp_id" });

ProductList.hasMany(ProductImages, {
  foreignKey: "product_id",
});
ProductImages.belongsTo(ProductList, {
  foreignKey: "product_id",
});

Production_Finish_Product.hasOne(Production_History, {
  foreignKey: "production_finish_product_id",
});
Production_History.belongsTo(Production_Finish_Product, {
  foreignKey: "production_finish_product_id",
});

Production_History.hasOne(Production_History_Suffix, {
  foreignKey: "production_history_id",
});
Production_History_Suffix.belongsTo(Production_History, {
  foreignKey: "production_history_id",
});

Production_History.hasOne(StockManagement, {
  foreignKey: "production_history_id",
});
StockManagement.belongsTo(Production_History, {
  foreignKey: "production_history_id",
});

module.exports = {
  AccountList,
  Currency,
  Expenses2,
  Label,
  Label_Tag,
  Expenses1,
  ProductList,
  ProductImages,
  MasterList,
  UserRole,
  Vendors,
  Warehouse,
  Payable,
  Payable_Product,
  Payable_Fees,
  Payable_Payment,
  Product_Tag_Vendor,
  StockManagement,
  Account_Transaction,
  Balance_History,
  Production,
  Production_Raw_Used,
  Production_Finish_Product,
  Production_finish_raw_used,
  ProductionConsumableUsed,
  // BankTransaction,
  FixedAsset,
  FixedAssetForecast,
  SalesInvoice,
  OtherIncome,
  SalesInvoiceInventory,
  Customer,
  InventoryCounting,
  InventoryCountingItemList,
  BulkCollection,
  BulkCollectionTransaction,
  BulkCollectionPayment,
  Expenses,
  PayBulkExpensesPayment,
  PayBulkExpensesTransaction,
  Loan_mother,
  Loan_history,
  // Loan,
  // LoanPayment,
  Lending,
  LendPayment,
  // CashFlow,
  // IssuedCheck,
  PayBulkExpenses,
  PayBulkAddDeductExpenses,
  AssetAccount,
  Liability,
  Equity,
  EquityPayment,
  Other_Income_Payment,
  PayableBulk,
  Cutoff,
  ReturnEarnings,
  ReturnEarningsCutoffs,
  Payable_Bulk_Transaction,
  accountlist_sub3,
  ReturnCapitalMother,
  ReturnChildRetained,
  ReturnOwnerList,
  Inventory_Report,
  Inventory_Journal,
  Notification,
  ReturnCapitalPayments,
  StockTransfer,
  StockTransferProducts,
  StockTransferApproveProducts,
  AccountListBaseSub,
  Activity_Log,
  ProfitLossReport,
  Previous_Profit_Loss,
  P_L_v2_report, // new profit loss report journal
  ReceivingCheck,
  CompanySettings,
  Profile_Image,

  //LION CHEM
  Parameter,
  Source,
  TaxSettings,

  // purchase
  PurchaseRequest,
  PurchaseRequestOrderItem,

  // settings
  Packaging,

  SalesJournal,
  ExpenseJournal,
  PayableJournal,

  Production_History,
  Production_History_Suffix,
};
