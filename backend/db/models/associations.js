const Expenses2 = require("./expenses2.model");
const Label = require("./label.model");
const Label_Tag = require("./label_tags.model");
const Expenses1 = require("./expenses1.model");
const ProductList = require("./product.model");
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
const Customer_SocialLinks = require("./customer_social_link.model");
const Customer_ContactPerson = require("./customer_contact_person.model");
const Product_Tag_Vendor = require("./product_tag_vendor.model");
const StockManagement = require("./stock_management.model");
const Account_Transaction = require("./account_transaction.model");
const Balance_History = require("./balance_history.model");
const Production = require("./production.model");
const FixedAsset = require("./fixed_asset.model");
const FixedAssetForecast = require("./fixed_asset_forecast.model");
const SalesInvoice = require("./invoice.model");
const OtherIncome = require("./other_income.model");
const SalesInvoiceTagProduct = require("./sales_invoice_tag_product.model");
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
const SeriesNumber = require("./series_no.model");
const accountlist_sub3 = require("../models/ModelsBySubject/accountlist_sub3.model");
// const CashFlow = require("./cash_flow.model");
// const IssuedCheck = require("./issued_check.model");
const Loan_mother = require("./loan_mother.model");
const Loan_history = require("./loan_history.model");
const Other_Income_Payment = require("./other_income_payment.model");
const Finish_Raw_Material = require("./finish_raw_materials.model");
const Finish_Parameter = require("./finish_parameter.model");

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

const Inventory_Report = require("./inventory_report.model");

const StockTransfer = require("./stock_transfer.model");
const StockTransferProducts = require("./stock_transfer_products.model");
const StockTransferApproveProducts = require("./stock_transfer_approve_prod.model");
const AccountListBaseSub = require("./ModelsBySubject/accountlist_base_sub.model");
const Activity_Log = require("./activity_log.model");
const AccountListSub3 = require("../models/ModelsBySubject/accountlist_sub3.model");
const TransactionSubject = require("./ModelsBySubject/accountlist_transaction_subject.model");
const ProfitLossReport = require("./profit_loss_report.model");
const Previous_Profit_Loss = require("./previous_profit_loss.model");
const ReceivingCheck = require("./receiving_check.model");

//LION CHEM

// //batch entry
// const BatchEntryMain = require("./LionChem/Batch Entry/batchEntryMain.model");
// const BatchEntryMixer = require("./LionChem/Batch Entry/batchEntryMixer.model");
// const BatchEntryInvoice = require("./LionChem/Batch Entry/batchEntryInvoice.model");
// const BatchEntryRawMaterials = require("./LionChem/Batch Entry/batchEntryRawMaterials.model");
// const BatchEntryCost = require("./LionChem/Batch Entry/batchEntryCost.model");
const BatchEntryReprint = require("./LionChem/Batch Entry 2/batch_entry_reprint.model");
// purchases
const PurchaseRequest = require("./LionChem/Purchase/purchase_request.model");
const PurchaseRequestOrderItem = require("./LionChem/Purchase/purchase_request_order_item.model");

// purchase order
const PurchaseOrder = require("./LionChem/Purchase/purchase_order.model");
const PurchaseOrderVendorProduct = require("./LionChem/Purchase/purchase_order_vendor_product.model");

// receiving
const Receiving = require("./LionChem/Purchase/receiving.model");
const ReceivingProductOrder = require("./LionChem/Purchase/receiving_product_order.model");
const ReceivingHistory = require("./LionChem/Purchase/receiving_history.model");
const ReceivingRejectedProduct = require("./LionChem/Purchase/receiving_rejected_product.model");

// settings
const Packaging = require("./LionChem/Settings/packaging.model");
const PackagingImage = require("./LionChem/Settings/packaging_image.model");
const Parameter = require("./parameters.model");
const PhysicalCategory = require("./physical_category.model");
const Source = require("./source.model");
const TaxSettings = require("./tax_settings.model");
const Mixer = require("./mixer.model");
const CompanyProfile = require("./CompanyProfile/company_profile.model");

// vendor product
const VendorsProductPriceHistory = require("./vendors_product_price_history.model");

// company settings
const CompanySettings = require("./company_settings.model");

// sales
const SampleProduct = require("./LionChem/Sales/sample_product.model");
const SampleProductList = require("./LionChem/Sales/sample_product_list.model");
const SampleProductListHistory = require("./LionChem/Sales/sample_product_list_history.model");

const FormulationProductRemarks = require("./formulation_product_remarks.model");
const FormulationPhysical = require("./formulation_physical.model");

// post production
const PostProduction = require("./LionChem/Post Production/post_production.model");
const PostProductionProduct = require("./LionChem/Post Production/post_production_product.model");
const PostProductionFormulatedProducts = require("./LionChem/Post Production/post_production_formulated_products.model");
const PostProductionRawMaterials = require("./LionChem/Post Production/post_production_raw_materials.model");

// schedule
const ScheduleModel = require("./LionChem/Schedule/schedule.model");
const ScheduleInvoiceList = require("./LionChem/Schedule/schedule_invoice_list.model");
const ScheduleDeliver = require("./LionChem/Schedule/schedule_deliver.model");
const ScheduleProductList = require("./LionChem/Schedule/schedule_product_list.model");
const ScheduleDeductionHistory = require("./LionChem/Schedule/schedule_deduction_history.model");

// return products
const ReturnProduct = require("./LionChem/Return Products/return_product.model");
const ReturnProductList = require("./LionChem/Return Products/return_product_list.model");
const ReturnStockHistory = require("./LionChem/Return Products/return_stock_history.model");

// product to customer
const ProductTagCustomer = require("./product_tag_customer.model");

const CustomerProductPriceHistory = require("./customer_product_price_history.model");

// formulation
const Formulation = require("./LionChem/Inventory/formulation.model");
const FormulationProductUsed = require("./LionChem/Inventory/formulation_product_used.model");

// stock management history
const SalesInvoiceStockManagementHistory = require("./sales_invoice_stock_management_history.model");

// batch entry 2
const BatchEntry = require("./LionChem/Batch Entry 2/batch_entry.model");
const BatchEntryTaggedMixer = require("./LionChem/Batch Entry 2/batch_entry_tagged_mixer.model");
const BatchEntryTaggedInvoice = require("./LionChem/Batch Entry 2/batch_entry_tagged_invoice.model");
const BatchEntryFormulatedProduct = require("./LionChem/Batch Entry 2/batch_entry_formulated_product.model");
const BatchEntryFormulatedMaterialUsed = require("./LionChem/Batch Entry 2/batch_entry_formulated_material_used.model");
const BatchEntryFormulatedReplacedMaterial = require("./LionChem/Batch Entry 2/batch_entry_formulated_replaced_material.model");
const BatchEntryCostList = require("./LionChem/Batch Entry 2/batch_entry_cost_list.model");
const BatchEntryStockManagementHistory = require("./LionChem/Batch Entry 2/batch_entry_stock_management_history.model");

// concord notification
const ConcordNotification = require("./LionChem/Notification/concord_notification.model");

// batch entry 2 end

// tax report
const TaxReport = require("./LionChem/Tax Report/tax_report.model");

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

Vendors.hasMany(PayableBulk, { foreignKey: "vendor_id" });
PayableBulk.belongsTo(Vendors, { foreignKey: "vendor_id" });

// ***End payable bulk associations

// Payable Module END
Customer.hasMany(Customer_SocialLinks, { foreignKey: "customer_id" });
Customer_SocialLinks.belongsTo(Customer, { foreignKey: "customer_id" });

Customer.hasMany(Customer_ContactPerson, { foreignKey: "customer_id" });
Customer_ContactPerson.belongsTo(Customer, { foreignKey: "customer_id" });

//Product and Vendor
ProductList.hasMany(Product_Tag_Vendor, { foreignKey: "product_id" });
Product_Tag_Vendor.belongsTo(ProductList, { foreignKey: "product_id" });

Vendors.hasMany(Product_Tag_Vendor, { foreignKey: "vendor_id" });
Product_Tag_Vendor.belongsTo(Vendors, { foreignKey: "vendor_id" });
//Product and Vendor End

// customer and vendor
Customer.hasMany(ProductTagCustomer, {
  foreignKey: "customer_id",
  as: "ptc_customer_id",
});
ProductTagCustomer.belongsTo(Customer, {
  foreignKey: "customer_id",
  as: "ptc_customer_id",
});

// customer and currency
Customer.belongsTo(Currency, {
  foreignKey: "currency_id",
  as: "c_currency_id",
});

// Currency has many Customers
Currency.hasMany(Customer, {
  foreignKey: "currency_id",
  as: "c_currency_id",
});
// customer and product
ProductList.hasMany(ProductTagCustomer, {
  foreignKey: "product_id",
  as: "ptc_product_id",
});
ProductTagCustomer.belongsTo(ProductList, {
  foreignKey: "product_id",
  as: "ptc_product_id",
});

//Product and Masterlist
MasterList.hasMany(ProductList, { foreignKey: "masterlist_id" });
ProductList.belongsTo(MasterList, { foreignKey: "masterlist_id" });

ProductList.hasMany(StockManagement, { foreignKey: "product_id" });
StockManagement.belongsTo(ProductList, { foreignKey: "product_id" });

Warehouse.hasMany(StockManagement, { foreignKey: "warehouse_id" });
StockManagement.belongsTo(Warehouse, { foreignKey: "warehouse_id" });

// stock management history
StockManagement.hasMany(SalesInvoiceStockManagementHistory, {
  foreignKey: "stock_management_id",
  as: "sismh_stock_management_id",
});

SalesInvoiceStockManagementHistory.belongsTo(StockManagement, {
  foreignKey: "stock_management_id",
  as: "sismh_stock_management_id",
});

SalesInvoice.hasMany(SalesInvoiceStockManagementHistory, {
  foreignKey: "sales_invoice_id",
  as: "sismh_sales_invoice_id",
});

SalesInvoiceStockManagementHistory.belongsTo(SalesInvoice, {
  foreignKey: "sales_invoice_id",
  as: "sismh_sales_invoice_id",
});

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

SalesInvoice.hasMany(SalesInvoiceTagProduct, {
  foreignKey: "sales_invoice_id",
});
SalesInvoiceTagProduct.belongsTo(SalesInvoice, {
  foreignKey: "sales_invoice_id",
});

ProductList.hasMany(SalesInvoiceTagProduct, {
  foreignKey: "product_id",
});
SalesInvoiceTagProduct.belongsTo(ProductList, {
  foreignKey: "product_id",
});

Customer.hasMany(SalesInvoiceTagProduct, {
  foreignKey: "customer_id",
  as: "sitp_customer_id",
});
SalesInvoiceTagProduct.belongsTo(Customer, {
  foreignKey: "customer_id",
  as: "sitp_customer_id",
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

Packaging.hasMany(ProductList, {
  foreignKey: "packaging_id",
  as: "prod_packaging",
});
ProductList.belongsTo(Packaging, {
  foreignKey: "packaging_id",
  as: "prod_packaging",
});

Packaging.hasMany(PackagingImage, {
  foreignKey: "packaging_id",
  as: "images",
});
PackagingImage.belongsTo(Packaging, {
  foreignKey: "packaging_id",
  as: "packaging",
});

Source.hasMany(ProductList, {
  foreignKey: "source_id",
});
ProductList.belongsTo(Source, {
  foreignKey: "source_id",
});

Expenses.hasMany(FixedAsset, {
  foreignKey: "expenses_id",
});
FixedAsset.belongsTo(Expenses, {
  foreignKey: "expenses_id",
});

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

// // lion checm
// // batch entry main and mixer to batch mixer
// BatchEntryMain.hasMany(BatchEntryMixer, {
//   foreignKey: "batch_entry_id",
// });
// BatchEntryMixer.belongsTo(BatchEntryMain, {
//   foreignKey: "batch_entry_id",
// });

// Mixer.hasMany(BatchEntryMixer, {
//   foreignKey: "mixer_id",
// });
// BatchEntryMixer.belongsTo(Mixer, {
//   foreignKey: "mixer_id",
// });
// // batch entry main and mixer to batch mixer

// //batch entry main and sales invoice to batch invoice
// BatchEntryMain.hasMany(BatchEntryInvoice, {
//   foreignKey: "batch_entry_id",
// });
// BatchEntryInvoice.belongsTo(BatchEntryMain, {
//   foreignKey: "batch_entry_id",
// });

// SalesInvoice.hasMany(BatchEntryInvoice, {
//   foreignKey: "sales_invoice_id",
// });
// BatchEntryInvoice.belongsTo(SalesInvoice, {
//   foreignKey: "sales_invoice_id",
// });
// //batch entry main and sales invoice to batch invoice

// //batch entry main and product tag vendor to batch raw materials
// BatchEntryMain.hasMany(BatchEntryRawMaterials, {
//   foreignKey: "batch_entry_id",
// });
// BatchEntryRawMaterials.belongsTo(BatchEntryMain, {
//   foreignKey: "batch_entry_id",
// });

// Product_Tag_Vendor.hasMany(BatchEntryRawMaterials, {
//   foreignKey: "original_product_tag_vendor_id",
//   as: "batch_entries_as_original", // Product_Tag_Vendor has many batch entries where it's the original material
// });
// BatchEntryRawMaterials.belongsTo(Product_Tag_Vendor, {
//   foreignKey: "original_product_tag_vendor_id",
//   as: "original_material", // BatchEntryRawMaterials belongs to one original material
// });

// Product_Tag_Vendor.hasMany(BatchEntryRawMaterials, {
//   foreignKey: "replacement_product_tag_vendor_id",
//   as: "batch_entries_as_replacement",
// });
// BatchEntryRawMaterials.belongsTo(Product_Tag_Vendor, {
//   foreignKey: "replacement_product_tag_vendor_id",
//   as: "replacement_material",
// });
// //batch entry main and product tag vendor to batch raw materials

// //batch entry main and cost to batch entry cost
// BatchEntryMain.hasMany(BatchEntryCost, {
//   foreignKey: "batch_entry_id",
// });
// BatchEntryCost.belongsTo(BatchEntryMain, {
//   foreignKey: "batch_entry_id",
// });
// //batch entry main and cost to batch entry cost

BatchEntry.hasMany(BatchEntryReprint, {
  foreignKey: "batch_entry_id",
  as: "batch_reprints",
});
BatchEntryReprint.belongsTo(BatchEntry, {
  foreignKey: "batch_entry_id",
  as: "batch_reprints",
});

MasterList.hasMany(BatchEntryReprint, {
  foreignKey: "requestor",
  as: "requestedReprints",
});
BatchEntryReprint.belongsTo(MasterList, {
  foreignKey: "requestor",
  as: "batch_requested_by",
});

MasterList.hasMany(BatchEntryReprint, {
  foreignKey: "approver",
  as: "approvedReprints",
});
BatchEntryReprint.belongsTo(MasterList, {
  foreignKey: "approver",
  as: "batch_approved_by",
});

MasterList.hasMany(BatchEntryReprint, {
  foreignKey: "declinedBy",
  as: "declinedReprints",
});
BatchEntryReprint.belongsTo(MasterList, {
  foreignKey: "declinedBy",
  as: "batch_declined_by",
});

// //batch entry masterlist id
// MasterList.hasMany(BatchEntryMain, {
//   foreignKey: "created_by",
// });
// BatchEntryMain.belongsTo(MasterList, {
//   foreignKey: "created_by",
// });
// //batch entry masterlist id

// ### purchase request start
PurchaseRequest.hasMany(PurchaseRequestOrderItem, {
  foreignKey: "pr_id",
});
PurchaseRequestOrderItem.belongsTo(PurchaseRequest, {
  foreignKey: "pr_id",
});

ProductList.hasMany(PurchaseRequestOrderItem, {
  foreignKey: "product_id",
});
PurchaseRequestOrderItem.belongsTo(ProductList, {
  foreignKey: "product_id",
});

MasterList.hasMany(PurchaseRequest, {
  foreignKey: "requestedBy",
  as: "requestor",
});
PurchaseRequest.belongsTo(MasterList, {
  foreignKey: "requestedBy",
  as: "requestor",
});

MasterList.hasMany(PurchaseRequest, {
  foreignKey: "preparedBy",
  as: "prepared_by",
});
PurchaseRequest.belongsTo(MasterList, {
  foreignKey: "preparedBy",
  as: "prepared_by",
});

MasterList.hasMany(PurchaseRequest, {
  foreignKey: "approvedBy",
  as: "approver",
});
PurchaseRequest.belongsTo(MasterList, {
  foreignKey: "approvedBy",
  as: "approver",
});

MasterList.hasMany(PurchaseRequest, {
  foreignKey: "rejectedBy",
  as: "rejector",
});
PurchaseRequest.belongsTo(MasterList, {
  foreignKey: "rejectedBy",
  as: "rejector",
});

PurchaseRequestOrderItem.hasMany(Product_Tag_Vendor, {
  foreignKey: "product_id",
  as: "product_vendor",
});
Product_Tag_Vendor.belongsTo(PurchaseRequestOrderItem, {
  foreignKey: "product_id",
  as: "product_vendor",
});
// ### purchase request end

// ### purchase order
Vendors.hasMany(PurchaseOrder, {
  foreignKey: "vendor_id",
  as: "po_vendor",
});
PurchaseOrder.belongsTo(Vendors, {
  foreignKey: "vendor_id",
  as: "po_vendor",
});

PurchaseRequest.hasMany(PurchaseOrder, {
  foreignKey: "pr_id",
  as: "po_pr_id",
});
PurchaseOrder.belongsTo(PurchaseRequest, {
  foreignKey: "pr_id",
  as: "po_pr_id",
});

Warehouse.hasMany(PurchaseOrder, {
  foreignKey: "warehouse_id",
  as: "po_warehouse_id",
});
PurchaseOrder.belongsTo(Warehouse, {
  foreignKey: "warehouse_id",
  as: "po_warehouse_id",
});

TaxSettings.hasMany(PurchaseOrder, {
  foreignKey: "tax_id",
  as: "po_tax_id",
});
PurchaseOrder.belongsTo(TaxSettings, {
  foreignKey: "tax_id",
  as: "po_tax_id",
});

MasterList.hasMany(PurchaseOrder, {
  foreignKey: "preparedBy",
  as: "po_prepared",
});
PurchaseOrder.belongsTo(MasterList, {
  foreignKey: "preparedBy",
  as: "po_prepared",
});

MasterList.hasMany(PurchaseOrder, {
  foreignKey: "approvedBy",
  as: "po_approver",
});
PurchaseOrder.belongsTo(MasterList, {
  foreignKey: "approvedBy",
  as: "po_approver",
});

MasterList.hasMany(PurchaseOrder, {
  foreignKey: "rejectedBy",
  as: "po_rejector",
});
PurchaseOrder.belongsTo(MasterList, {
  foreignKey: "rejectedBy",
  as: "po_rejector",
});

MasterList.hasMany(PurchaseOrder, {
  foreignKey: "cancelledBy",
  as: "po_cancellor",
});
PurchaseOrder.belongsTo(MasterList, {
  foreignKey: "cancelledBy",
  as: "po_cancellor",
});

PurchaseOrder.hasMany(PurchaseOrderVendorProduct, {
  foreignKey: "po_id",
  as: "po_order_item",
});
PurchaseOrderVendorProduct.belongsTo(PurchaseOrder, {
  foreignKey: "po_id",
  as: "po_order_item",
});

ProductList.hasMany(PurchaseOrderVendorProduct, {
  foreignKey: "product_id",
  as: "po_vendor_product_id",
});
PurchaseOrderVendorProduct.belongsTo(ProductList, {
  foreignKey: "product_id",
  as: "po_vendor_product_id",
});

PurchaseRequest.hasMany(PurchaseOrderVendorProduct, {
  foreignKey: "pr_id",
  as: "po_vendor_pr_id",
});
PurchaseOrderVendorProduct.belongsTo(PurchaseRequest, {
  foreignKey: "pr_id",
  as: "po_vendor_pr_id",
});

PurchaseOrderVendorProduct.hasMany(PurchaseRequestOrderItem, {
  foreignKey: "product_id",
  as: "po_vendor_prod_id",
});

// In your PurchaseRequestOrderItem model
PurchaseRequestOrderItem.belongsTo(PurchaseOrderVendorProduct, {
  foreignKey: "product_id",
  as: "po_vendor_prod_id",
});
// ### purchase order end

// ### receiving
PurchaseOrder.hasOne(Receiving, {
  foreignKey: "po_id",
  as: "receiving_po_id",
});

Receiving.belongsTo(PurchaseOrder, {
  foreignKey: "po_id",
  as: "receiving_po_id",
});

// MasterList.hasMany(Receiving, {
//   foreignKey: "rejectedBy",
//   as: "receiving_rejector",
// });
// Receiving.belongsTo(MasterList, {
//   foreignKey: "rejectedBy",
//   as: "receiving_rejector",
// });

MasterList.hasMany(Receiving, {
  foreignKey: "closed_by",
  as: "receiving_closer",
});
Receiving.belongsTo(MasterList, {
  foreignKey: "closed_by",
  as: "receiving_closer",
});

Receiving.hasMany(ReceivingProductOrder, {
  foreignKey: "receiving_id",
  as: "rp_receiving_id",
});
ReceivingProductOrder.belongsTo(Receiving, {
  foreignKey: "receiving_id",
  as: "rp_receiving_id",
});

ReceivingHistory.hasMany(ReceivingProductOrder, {
  foreignKey: "receiving_history_id",
  as: "rh_receiving_history_id",
});
ReceivingProductOrder.belongsTo(ReceivingHistory, {
  foreignKey: "receiving_history_id",
  as: "rh_receiving_history_id",
});

Receiving.hasMany(ReceivingHistory, {
  foreignKey: "receiving_id",
  as: "rh_receiving_id",
});
ReceivingHistory.belongsTo(Receiving, {
  foreignKey: "receiving_id",
  as: "rh_receiving_id",
});

// REJECTED PRODUCT REMARKS

// formulation remarks
PurchaseOrderVendorProduct.hasMany(ReceivingRejectedProduct, {
  foreignKey: "po_vendor_prod_id",
  as: "rrp_po_vendor_prod_id",
});
ReceivingRejectedProduct.belongsTo(PurchaseOrderVendorProduct, {
  foreignKey: "po_vendor_prod_id",
  as: "rrp_po_vendor_prod_id",
});

MasterList.hasMany(ReceivingHistory, {
  foreignKey: "receivedBy",
  as: "rh_received_by",
});
ReceivingHistory.belongsTo(MasterList, {
  foreignKey: "receivedBy",
  as: "rh_received_by",
});

PurchaseOrderVendorProduct.hasMany(ReceivingProductOrder, {
  foreignKey: "po_vendor_product_id",
  as: "rpo_vendor_product_id",
});
ReceivingProductOrder.belongsTo(PurchaseOrderVendorProduct, {
  foreignKey: "po_vendor_product_id",
  as: "rpo_vendor_product_id",
});

// ### receiving end

//Sales Invoice
TaxSettings.hasMany(SalesInvoice, {
  foreignKey: "tax_settings_id",
});
SalesInvoice.belongsTo(TaxSettings, {
  foreignKey: "tax_settings_id",
});

ProductList.hasMany(Finish_Raw_Material, {
  foreignKey: "product_id",
  // as: "finish_raw_materials",
});

Finish_Raw_Material.belongsTo(ProductList, {
  foreignKey: "product_id",
  // as: "finish_Product",
});

Product_Tag_Vendor.hasMany(Finish_Raw_Material, {
  foreignKey: "product_tag_vendor_id",
});

Finish_Raw_Material.belongsTo(Product_Tag_Vendor, {
  foreignKey: "product_tag_vendor_id",
});

// ProductList.hasMany(Finish_Raw_Material, {
//   foreignKey: "raw_product_id",
//   as: "raw_materials",
// });

// Finish_Raw_Material.belongsTo(ProductList, {
//   foreignKey: "raw_product_id",
//   as: "raw_Product",
// });

ProductList.hasMany(Finish_Parameter, {
  foreignKey: "finish_product_id",
});

Finish_Parameter.belongsTo(ProductList, {
  foreignKey: "finish_product_id",
});

Parameter.hasMany(Finish_Parameter, {
  foreignKey: "parameter_id",
});

Finish_Parameter.belongsTo(Parameter, {
  foreignKey: "parameter_id",
});

// vendor history
Vendors.hasMany(VendorsProductPriceHistory, {
  foreignKey: "vendor_id",
  as: "price_history_vendor_id",
});

VendorsProductPriceHistory.belongsTo(Vendors, {
  foreignKey: "vendor_id",
  as: "price_history_vendor_id",
});

ProductList.hasMany(VendorsProductPriceHistory, {
  foreignKey: "product_id",
  as: "price_history_product_id",
});

VendorsProductPriceHistory.belongsTo(ProductList, {
  foreignKey: "product_id",
  as: "price_history_product_id",
});

// customer price history
Customer.hasMany(CustomerProductPriceHistory, {
  foreignKey: "customer_id",
  as: "price_history_customer_id",
});

CustomerProductPriceHistory.belongsTo(Customer, {
  foreignKey: "customer_id",
  as: "price_history_customer_id",
});

ProductList.hasMany(CustomerProductPriceHistory, {
  foreignKey: "product_id",
  as: "customer_price_history_product_id",
});

CustomerProductPriceHistory.belongsTo(ProductList, {
  foreignKey: "product_id",
  as: "customer_price_history_product_id",
});

// Sample Product
Customer.hasMany(SampleProduct, {
  foreignKey: "customer_id",
  as: "sp_customer_id",
});
SampleProduct.belongsTo(Customer, {
  foreignKey: "customer_id",
  as: "sp_customer_id",
});

MasterList.hasMany(SampleProduct, {
  foreignKey: "requestedBy",
  as: "sp_requested_by",
});
SampleProduct.belongsTo(MasterList, {
  foreignKey: "requestedBy",
  as: "sp_requested_by",
});

MasterList.hasMany(SampleProduct, {
  foreignKey: "approvedBy",
  as: "sp_approved_by",
});
SampleProduct.belongsTo(MasterList, {
  foreignKey: "approvedBy",
  as: "sp_approved_by",
});

MasterList.hasMany(SampleProduct, {
  foreignKey: "preparedBy",
  as: "sp_prepared_by",
});
SampleProduct.belongsTo(MasterList, {
  foreignKey: "preparedBy",
  as: "sp_prepared_by",
});

MasterList.hasMany(SampleProduct, {
  foreignKey: "dispatchedBy",
  as: "sp_dispatched_by",
});
SampleProduct.belongsTo(MasterList, {
  foreignKey: "dispatchedBy",
  as: "sp_dispatched_by",
});

MasterList.hasMany(SampleProduct, {
  foreignKey: "receivedBy",
  as: "sp_received_by",
});
SampleProduct.belongsTo(MasterList, {
  foreignKey: "receivedBy",
  as: "sp_received_by",
});

MasterList.hasMany(SampleProduct, {
  foreignKey: "rejectedBy",
  as: "sp_rejected_by",
});
SampleProduct.belongsTo(MasterList, {
  foreignKey: "rejectedBy",
  as: "sp_rejected_by",
});

// Sample Product List
SampleProduct.hasMany(SampleProductList, {
  foreignKey: "sample_product_id",
  as: "spl_sample_product_id",
});
SampleProductList.belongsTo(SampleProduct, {
  foreignKey: "sample_product_id",
  as: "spl_sample_product_id",
});

ProductList.hasMany(SampleProductList, {
  foreignKey: "product_id",
  as: "spl_product_id",
});
SampleProductList.belongsTo(ProductList, {
  foreignKey: "product_id",
  as: "spl_product_id",
});

SampleProduct.hasMany(SampleProductListHistory, {
  foreignKey: "sample_product_id",
  as: "splh_sample_product_id",
});
SampleProductListHistory.belongsTo(SampleProduct, {
  foreignKey: "sample_product_id",
  as: "splh_sample_product_id",
});

StockManagement.hasMany(SampleProductListHistory, {
  foreignKey: "stock_management_id",
  as: "splh_stock_management_id",
});
SampleProductListHistory.belongsTo(StockManagement, {
  foreignKey: "stock_management_id",
  as: "splh_stock_management_id",
});

// formulation remarks
ProductList.hasMany(FormulationProductRemarks, {
  foreignKey: "product_id",
  as: "fpr_product_id",
});
FormulationProductRemarks.belongsTo(ProductList, {
  foreignKey: "product_id",
  as: "fpr_product_id",
});

MasterList.hasMany(FormulationProductRemarks, {
  foreignKey: "createdBy",
  as: "fpr_author_id",
});
FormulationProductRemarks.belongsTo(MasterList, {
  foreignKey: "createdBy",
  as: "fpr_author_id",
});

// Formulation Physical Attributes
ProductList.hasMany(Formulation, {
  foreignKey: "product_id",
  as: "f_product_id",
});
Formulation.belongsTo(ProductList, {
  foreignKey: "product_id",
  as: "f_product_id",
});

ProductList.hasMany(FormulationPhysical, {
  foreignKey: "product_id",
  as: "fp_product_id",
});
FormulationPhysical.belongsTo(ProductList, {
  foreignKey: "product_id",
  as: "fp_product_id",
});

PhysicalCategory.hasMany(FormulationPhysical, {
  foreignKey: "physical_id",
  as: "fp_physical_id",
});
FormulationPhysical.belongsTo(PhysicalCategory, {
  foreignKey: "physical_id",
  as: "fp_physical_id",
});

// post production
BatchEntry.hasMany(PostProduction, {
  foreignKey: "batch_entry_id",
  as: "pp_batch_entry_id",
});
PostProduction.belongsTo(BatchEntry, {
  foreignKey: "batch_entry_id",
  as: "pp_batch_entry_id",
});

PostProduction.hasMany(PostProductionProduct, {
  foreignKey: "post_production_id",
  as: "ppp_post_production_id",
});
PostProductionProduct.belongsTo(PostProduction, {
  foreignKey: "post_production_id",
  as: "ppp_post_production_id",
});

BatchEntry.hasMany(PostProductionProduct, {
  foreignKey: "batch_entry_id",
  as: "ppp_batch_entry_id",
});
PostProductionProduct.belongsTo(BatchEntry, {
  foreignKey: "batch_entry_id",
  as: "ppp_batch_entry_id",
});

SalesInvoice.hasMany(PostProductionProduct, {
  foreignKey: "sales_invoice_id",
  as: "ppp_sales_invoice_id",
});
PostProductionProduct.belongsTo(SalesInvoice, {
  foreignKey: "sales_invoice_id",
  as: "ppp_sales_invoice_id",
});

ProductList.hasOne(PostProductionProduct, {
  foreignKey: "product_id",
  as: "ppp_product_id",
});
PostProductionProduct.belongsTo(ProductList, {
  foreignKey: "product_id",
  as: "ppp_product_id",
});

// POST PRODUCTION FORMULATED
PostProduction.hasMany(PostProductionFormulatedProducts, {
  foreignKey: "post_production_id",
  as: "pp_formulated_products",
});
PostProductionFormulatedProducts.belongsTo(PostProduction, {
  foreignKey: "post_production_id",
  as: "pp_formulated_products",
});

BatchEntry.hasMany(PostProductionFormulatedProducts, {
  foreignKey: "batch_entry_id",
  as: "batch_entry_pp_formulated_products",
});
PostProductionFormulatedProducts.belongsTo(BatchEntry, {
  foreignKey: "batch_entry_id",
  as: "batch_entry_pp_formulated_products",
});
ProductList.hasOne(PostProductionFormulatedProducts, {
  foreignKey: "product_id",
  as: "product_list_pp_formulated_products",
});
PostProductionFormulatedProducts.belongsTo(ProductList, {
  foreignKey: "product_id",
  as: "product_list_pp_formulated_products",
});

BatchEntryFormulatedProduct.hasOne(PostProductionFormulatedProducts, {
  foreignKey: "batch_entry_product_id",
  as: "befmu_pp_formulated_product_id",
});

PostProductionFormulatedProducts.belongsTo(BatchEntryFormulatedProduct, {
  foreignKey: "batch_entry_product_id",
  as: "befmu_pp_formulated_product_id",
});

// POST PRODUCTION RAW MATERIALS
PostProduction.hasMany(PostProductionRawMaterials, {
  foreignKey: "post_production_id",
  as: "pp_raw_materials",
});
PostProductionRawMaterials.belongsTo(PostProduction, {
  foreignKey: "post_production_id",
  as: "pp_raw_materials",
});

BatchEntry.hasMany(PostProductionRawMaterials, {
  foreignKey: "batch_entry_id",
  as: "batch_entry_pp_raw_materials",
});
PostProductionRawMaterials.belongsTo(BatchEntry, {
  foreignKey: "batch_entry_id",
  as: "batch_entry_pp_raw_materials",
});
ProductList.hasOne(PostProductionRawMaterials, {
  foreignKey: "product_id",
  as: "product_list_pp_raw_materials",
});

PostProductionRawMaterials.belongsTo(ProductList, {
  foreignKey: "product_id",
  as: "product_list_pp_raw_materials",
});

BatchEntryFormulatedMaterialUsed.hasOne(PostProductionRawMaterials, {
  foreignKey: "batch_entry_raw_id",
  as: "befmu_pp_raw_material",
});

PostProductionRawMaterials.belongsTo(BatchEntryFormulatedMaterialUsed, {
  foreignKey: "batch_entry_raw_id", // References materials used
  as: "befmu_pp_raw_material",
});
// schedule
ScheduleModel.hasMany(ScheduleInvoiceList, {
  foreignKey: "schedule_id",
  as: "sil_schedule_id",
});
ScheduleInvoiceList.belongsTo(ScheduleModel, {
  foreignKey: "schedule_id",
  as: "sil_schedule_id",
});

MasterList.hasOne(ScheduleModel, {
  foreignKey: "createdBy",
  as: "sm_created_by",
});
ScheduleModel.belongsTo(MasterList, {
  foreignKey: "createdBy",
  as: "sm_created_by",
});

MasterList.hasOne(ScheduleModel, {
  foreignKey: "approvedBy",
  as: "sm_approved_by",
});
ScheduleModel.belongsTo(MasterList, {
  foreignKey: "approvedBy",
  as: "sm_approved_by",
});

MasterList.hasOne(ScheduleModel, {
  foreignKey: "rejectedBy",
  as: "sm_rejected_by",
});
ScheduleModel.belongsTo(MasterList, {
  foreignKey: "rejectedBy",
  as: "sm_rejected_by",
});

// BatchEntry.hasMany(ScheduleInvoiceList, {
//   foreignKey: "batch_entry_id",
//   as: "sil_batch_entry_id",
// });
// ScheduleInvoiceList.belongsTo(BatchEntry, {
//   foreignKey: "batch_entry_id",
//   as: "sil_batch_entry_id",
// });

SalesInvoice.hasMany(ScheduleInvoiceList, {
  foreignKey: "sales_invoice_id",
  as: "sil_sales_invoice_id",
});
ScheduleInvoiceList.belongsTo(SalesInvoice, {
  foreignKey: "sales_invoice_id",
  as: "sil_sales_invoice_id",
});

ScheduleModel.hasOne(ScheduleDeliver, {
  foreignKey: "schedule_id",
  as: "sd_schedule_id",
});
ScheduleDeliver.belongsTo(ScheduleModel, {
  foreignKey: "schedule_id",
  as: "sd_schedule_id",
});

ScheduleModel.hasMany(ScheduleProductList, {
  foreignKey: "schedule_id",
  as: "spl_schedule_id",
});
ScheduleProductList.belongsTo(ScheduleModel, {
  foreignKey: "schedule_id",
  as: "spl_schedule_id",
});

ProductList.hasMany(ScheduleProductList, {
  foreignKey: "product_id",
  as: "schedule_product_list_product_id",
});
ScheduleProductList.belongsTo(ProductList, {
  foreignKey: "product_id",
  as: "schedule_product_list_product_id",
});

SalesInvoice.hasMany(ScheduleProductList, {
  foreignKey: "schedule_invoice_id",
  as: "spl_schedule_invoice_id",
});
ScheduleProductList.belongsTo(SalesInvoice, {
  foreignKey: "schedule_invoice_id",
  as: "spl_schedule_invoice_id",
});

MasterList.hasOne(ScheduleDeliver, {
  foreignKey: "createdBy",
  as: "sd_created_by",
});
ScheduleDeliver.belongsTo(MasterList, {
  foreignKey: "createdBy",
  as: "sd_created_by",
});

// schedule deduct history
ScheduleModel.hasMany(ScheduleDeductionHistory, {
  foreignKey: "schedule_id",
  as: "sdh_schedule_id",
});
ScheduleDeductionHistory.belongsTo(ScheduleModel, {
  foreignKey: "schedule_id",
  as: "sdh_schedule_id",
});

StockManagement.hasMany(ScheduleDeductionHistory, {
  foreignKey: "stock_management_id",
  as: "sdh_stock_management_id",
});
ScheduleDeductionHistory.belongsTo(StockManagement, {
  foreignKey: "stock_management_id",
  as: "sdh_stock_management_id",
});

SalesInvoice.hasMany(ScheduleDeductionHistory, {
  foreignKey: "sales_invoice_id",
  as: "sdh_sales_invoice_id",
});
ScheduleDeductionHistory.belongsTo(SalesInvoice, {
  foreignKey: "sales_invoice_id",
  as: "sdh_sales_invoice_id",
});

MasterList.hasMany(ScheduleDeductionHistory, {
  foreignKey: "createdBy",
  as: "sdh_created_by",
});
ScheduleDeductionHistory.belongsTo(MasterList, {
  foreignKey: "createdBy",
  as: "sdh_created_by",
});

// return products
MasterList.hasOne(ReturnProduct, {
  foreignKey: "createdBy",
  as: "rp_created_by",
});
ReturnProduct.belongsTo(MasterList, {
  foreignKey: "createdBy",
  as: "rp_created_by",
});

MasterList.hasOne(ReturnProduct, {
  foreignKey: "approvedBy",
  as: "rp_approved_by",
});
ReturnProduct.belongsTo(MasterList, {
  foreignKey: "approvedBy",
  as: "rp_approved_by",
});

MasterList.hasOne(ReturnProduct, {
  foreignKey: "rejectedBy",
  as: "rp_rejected_by",
});
ReturnProduct.belongsTo(MasterList, {
  foreignKey: "rejectedBy",
  as: "rp_rejected_by",
});

MasterList.hasOne(ReturnProduct, {
  foreignKey: "closedBy",
  as: "rp_closed_by",
});
ReturnProduct.belongsTo(MasterList, {
  foreignKey: "closedBy",
  as: "rp_closed_by",
});

ReturnProduct.hasMany(ReturnProductList, {
  foreignKey: "return_product_id",
  as: "rpl_return_product_id",
});
ReturnProductList.belongsTo(ReturnProduct, {
  foreignKey: "return_product_id",
  as: "rpl_return_product_id",
});

ScheduleProductList.hasMany(ReturnProductList, {
  foreignKey: "schedule_product_list_id",
  as: "rpl_schedule_product_list_id",
});
ReturnProductList.belongsTo(ScheduleProductList, {
  foreignKey: "schedule_product_list_id",
  as: "rpl_schedule_product_list_id",
});

// return to stock history
ReturnProductList.hasMany(ReturnStockHistory, {
  foreignKey: "return_product_list_id",
  as: "rsh_return_product_list_id",
});
ReturnStockHistory.belongsTo(ReturnProductList, {
  foreignKey: "return_product_list_id",
  as: "rsh_return_product_list_id",
});

StockManagement.hasMany(ReturnStockHistory, {
  foreignKey: "stock_management_id",
  as: "rsh_stock_management_id",
});
ReturnStockHistory.belongsTo(StockManagement, {
  foreignKey: "stock_management_id",
  as: "rsh_stock_management_id",
});

SalesInvoice.hasMany(ReturnStockHistory, {
  foreignKey: "sales_invoice_id",
  as: "rsh_sales_invoice_id",
});
ReturnStockHistory.belongsTo(SalesInvoice, {
  foreignKey: "sales_invoice_id",
  as: "rsh_sales_invoice_id",
});

MasterList.hasMany(ReturnStockHistory, {
  foreignKey: "createdBy",
  as: "rsh_created_by",
});
ReturnStockHistory.belongsTo(MasterList, {
  foreignKey: "createdBy",
  as: "rsh_created_by",
});

// ### purchase request end

// formulation
Formulation.hasMany(FormulationProductUsed, {
  foreignKey: "formulation_id",
  as: "fpu_formulation_id",
});
FormulationProductUsed.belongsTo(Formulation, {
  foreignKey: "formulation_id",
  as: "fpu_formulation_id",
});

Formulation.hasMany(Finish_Parameter, {
  foreignKey: "formulation_id",
  as: "fparam_formulation_id",
});
Finish_Parameter.belongsTo(Formulation, {
  foreignKey: "formulation_id",
  as: "fparam_formulation_id",
});

Formulation.hasMany(FormulationPhysical, {
  foreignKey: "formulation_id",
  as: "fphysical_formulation_id",
});
FormulationPhysical.belongsTo(Formulation, {
  foreignKey: "formulation_id",
  as: "fphysical_formulation_id",
});

Formulation.hasMany(FormulationProductRemarks, {
  foreignKey: "formulation_id",
  as: "fpr_formulation_id",
});
FormulationProductRemarks.belongsTo(Formulation, {
  foreignKey: "formulation_id",
  as: "fpr_formulation_id",
});

ProductList.hasMany(FormulationProductUsed, {
  foreignKey: "product_id",
  as: "fpu_product_id",
});

FormulationProductUsed.belongsTo(ProductList, {
  foreignKey: "product_id",
  as: "fpu_product_id",
});

Vendors.hasMany(FormulationProductUsed, {
  foreignKey: "vendor_id",
  as: "fpu_vendor_id",
});

FormulationProductUsed.belongsTo(Vendors, {
  foreignKey: "vendor_id",
  as: "fpu_vendor_id",
});

MasterList.hasMany(FormulationProductUsed, {
  foreignKey: "createdBy",
  as: "fpu_created_by",
});

FormulationProductUsed.belongsTo(MasterList, {
  foreignKey: "createdBy",
  as: "fpu_created_by",
});

MasterList.hasMany(Formulation, {
  foreignKey: "createdBy",
  as: "f_created_by",
});
Formulation.belongsTo(MasterList, {
  foreignKey: "createdBy",
  as: "f_created_by",
});

// batch entry 2
MasterList.hasMany(BatchEntry, {
  foreignKey: "createdBy",
  as: "be_created_by",
});
BatchEntry.belongsTo(MasterList, {
  foreignKey: "createdBy",
  as: "be_created_by",
});

// for batch entry tagged mixer - ADD CASCADE HERE
BatchEntry.hasMany(BatchEntryTaggedMixer, {
  foreignKey: "batch_entry_id",
  as: "betm_batch_entry_id",
  onDelete: "CASCADE", // Add this
});
BatchEntryTaggedMixer.belongsTo(BatchEntry, {
  foreignKey: "batch_entry_id",
  as: "betm_batch_entry_id",
  onDelete: "CASCADE", // Add this
});

Mixer.hasMany(BatchEntryTaggedMixer, {
  foreignKey: "mixer_id",
  as: "betm_mixer_id",
});
BatchEntryTaggedMixer.belongsTo(Mixer, {
  foreignKey: "mixer_id",
  as: "betm_mixer_id",
});

// for batch entry tagged invoice - ADD CASCADE HERE
BatchEntry.hasMany(BatchEntryTaggedInvoice, {
  foreignKey: "batch_entry_id",
  as: "beti_batch_entry_id",
  onDelete: "CASCADE", // Add this
});
BatchEntryTaggedInvoice.belongsTo(BatchEntry, {
  foreignKey: "batch_entry_id",
  as: "beti_batch_entry_id",
  onDelete: "CASCADE", // Add this
});

SalesInvoice.hasMany(BatchEntryTaggedInvoice, {
  foreignKey: "sales_invoice_id",
  as: "beti_sales_invoice_id",
});

BatchEntryTaggedInvoice.belongsTo(SalesInvoice, {
  foreignKey: "sales_invoice_id",
  as: "beti_sales_invoice_id",
});

// for batch entry formulated product - ADD CASCADE HERE
BatchEntry.hasMany(BatchEntryFormulatedProduct, {
  foreignKey: "batch_entry_id",
  as: "befp_batch_entry_id",
  onDelete: "CASCADE", // Add this
});

BatchEntryFormulatedProduct.belongsTo(BatchEntry, {
  foreignKey: "batch_entry_id",
  as: "befp_batch_entry_id",
  onDelete: "CASCADE", // Add this
});

ProductList.hasMany(BatchEntryFormulatedProduct, {
  foreignKey: "product_id",
  as: "befp_product_id",
});

BatchEntryFormulatedProduct.belongsTo(ProductList, {
  foreignKey: "product_id",
  as: "befp_product_id",
});

SalesInvoiceTagProduct.hasMany(BatchEntryFormulatedProduct, {
  foreignKey: "sales_product_tag_id",
  as: "befp_sales_product_tag_id",
});

BatchEntryFormulatedProduct.belongsTo(SalesInvoiceTagProduct, {
  foreignKey: "sales_product_tag_id",
  as: "befp_sales_product_tag_id",
});

// for batch entry formulated material used - ADD CASCADE HERE
BatchEntry.hasMany(BatchEntryFormulatedMaterialUsed, {
  foreignKey: "batch_entry_id",
  as: "befmu_batch_entry_id",
  onDelete: "CASCADE", // Add this
});
BatchEntryFormulatedMaterialUsed.belongsTo(BatchEntry, {
  foreignKey: "batch_entry_id",
  as: "befmu_batch_entry_id",
  onDelete: "CASCADE", // Add this
});

BatchEntryFormulatedProduct.hasMany(BatchEntryFormulatedMaterialUsed, {
  foreignKey: "formulated_product_id",
  as: "befmu_formulated_product_id",
  onDelete: "CASCADE", // Add this for formulated product deletion too
});

BatchEntryFormulatedMaterialUsed.belongsTo(BatchEntryFormulatedProduct, {
  foreignKey: "formulated_product_id",
  as: "befmu_formulated_product_id",
  onDelete: "CASCADE", // Add this
});

Vendors.hasMany(BatchEntryFormulatedMaterialUsed, {
  foreignKey: "vendor_id",
  as: "befmu_vendor_id",
});

BatchEntryFormulatedMaterialUsed.belongsTo(Vendors, {
  foreignKey: "vendor_id",
  as: "befmu_vendor_id",
});

ProductList.hasMany(BatchEntryFormulatedMaterialUsed, {
  foreignKey: "product_id",
  as: "befmu_product_id",
});

BatchEntryFormulatedMaterialUsed.belongsTo(ProductList, {
  foreignKey: "product_id",
  as: "befmu_product_id",
});

// for batch entry formulated replaced material - ADD CASCADE HERE
BatchEntry.hasMany(BatchEntryFormulatedReplacedMaterial, {
  foreignKey: "batch_entry_id",
  as: "befrm_batch_entry_id",
  onDelete: "CASCADE", // Add this
});
BatchEntryFormulatedReplacedMaterial.belongsTo(BatchEntry, {
  foreignKey: "batch_entry_id",
  as: "befrm_batch_entry_id",
  onDelete: "CASCADE", // Add this
});

BatchEntryFormulatedProduct.hasMany(BatchEntryFormulatedReplacedMaterial, {
  foreignKey: "formulated_product_id",
  as: "befrm_formulated_product_id",
  onDelete: "CASCADE", // Add this
});

BatchEntryFormulatedReplacedMaterial.belongsTo(BatchEntryFormulatedProduct, {
  foreignKey: "formulated_product_id",
  as: "befrm_formulated_product_id",
  onDelete: "CASCADE", // Add this
});

ProductList.hasMany(BatchEntryFormulatedReplacedMaterial, {
  foreignKey: "product_id",
  as: "befrm_product_id",
});

BatchEntryFormulatedReplacedMaterial.belongsTo(ProductList, {
  foreignKey: "product_id",
  as: "befrm_product_id",
});

BatchEntryFormulatedMaterialUsed.hasMany(BatchEntryFormulatedReplacedMaterial, {
  foreignKey: "replaced_product_id",
  as: "befrm_replaced_product_id",
  onDelete: "CASCADE", // Add this
});

BatchEntryFormulatedReplacedMaterial.belongsTo(
  BatchEntryFormulatedMaterialUsed,
  {
    foreignKey: "replaced_product_id",
    as: "befrm_replaced_product_id",
    onDelete: "CASCADE", // Add this
  }
);

// for batch entry cost list - ADD CASCADE HERE
BatchEntry.hasMany(BatchEntryCostList, {
  foreignKey: "batch_entry_id",
  as: "becl_batch_entry_id",
  onDelete: "CASCADE", // Add this
});
BatchEntryCostList.belongsTo(BatchEntry, {
  foreignKey: "batch_entry_id",
  as: "becl_batch_entry_id",
  onDelete: "CASCADE", // Add this
});

// for batch entry stock history - ADD CASCADE HERE
BatchEntry.hasMany(BatchEntryStockManagementHistory, {
  foreignKey: "batch_entry_id",
  as: "bestm_batch_entry_id",
  onDelete: "CASCADE", // Add this
});
BatchEntryStockManagementHistory.belongsTo(BatchEntry, {
  foreignKey: "batch_entry_id",
  as: "bestm_batch_entry_id",
  onDelete: "CASCADE", // Add this
});

StockManagement.hasMany(BatchEntryStockManagementHistory, {
  foreignKey: "stock_management_id",
  as: "bestm_stock_management_id",
  onDelete: "CASCADE", // Add this
});
BatchEntryStockManagementHistory.belongsTo(StockManagement, {
  foreignKey: "stock_management_id",
  as: "bestm_stock_management_id",
  onDelete: "CASCADE", // Add this
});

BatchEntryFormulatedMaterialUsed.hasMany(BatchEntryStockManagementHistory, {
  foreignKey: "be_material_used_id",
  as: "bestm_be_material_used_id",
  onDelete: "CASCADE", // Add this
});
BatchEntryStockManagementHistory.belongsTo(BatchEntryFormulatedMaterialUsed, {
  foreignKey: "be_material_used_id",
  as: "bestm_be_material_used_id",
  onDelete: "CASCADE", // Add this
});

// BatchEntryFormulatedMaterialUsed.hasMany(BatchEntryFormulatedMaterialUsed, {
//   foreignKey: {
//     name: "be_material_used_id",
//     allowNull: true,
//   },
//   as: "bestm_be_material_id",
//   onDelete: "CASCADE",
//   constraints: true,
//   foreignKeyConstraint: "fk_be_material_used_batch_entry", // ✅ add this line
// });

// BatchEntryFormulatedMaterialUsed.belongsTo(BatchEntryFormulatedMaterialUsed, {
//   foreignKey: {
//     name: "be_material_used_id",
//     allowNull: true,
//   },
//   as: "bestm_be_material_id",
//   onDelete: "CASCADE",
//   constraints: true,
//   foreignKeyConstraint: "fk_be_material_used_batch_entry", // ✅ same name
// });

// concord notification
MasterList.hasMany(ConcordNotification, {
  foreignKey: "createdBy",
  as: "cn_created_by",
});
ConcordNotification.belongsTo(MasterList, {
  foreignKey: "createdBy",
  as: "cn_created_by",
});

// tax report

TaxSettings.hasMany(TaxReport, {
  foreignKey: "tax_id",
  as: "tr_tax_id",
});
TaxReport.belongsTo(TaxSettings, {
  foreignKey: "tax_id",
  as: "tr_tax_id",
});

// export models
module.exports = {
  AccountList,
  Currency,
  Expenses2,
  Label,
  Label_Tag,
  Expenses1,
  ProductList,
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
  // BankTransaction,
  FixedAsset,
  FixedAssetForecast,
  SalesInvoice,
  OtherIncome,
  SalesInvoiceTagProduct,
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
  Notification,

  ReturnCapitalPayments,
  StockTransfer,
  StockTransferProducts,
  StockTransferApproveProducts,
  AccountListBaseSub,
  Activity_Log,
  ProfitLossReport,
  Previous_Profit_Loss,
  ReceivingCheck,

  //LION CHEM
  Parameter,
  PhysicalCategory,
  Source,
  TaxSettings,
  Mixer,
  Customer_SocialLinks,
  Customer_ContactPerson,

  // purchase
  PurchaseRequest,
  PurchaseRequestOrderItem,

  // purchase Order
  PurchaseOrder,
  PurchaseOrderVendorProduct,

  // receiving
  Receiving,
  ReceivingProductOrder,
  ReceivingHistory,
  ReceivingRejectedProduct,

  // settings
  Packaging,
  PackagingImage,
  Finish_Raw_Material,
  Finish_Parameter,
  SeriesNumber,

  // vendor product history
  VendorsProductPriceHistory,

  // customer product history
  CustomerProductPriceHistory,

  // batch entry
  // BatchEntryMain,
  // BatchEntryMixer,
  // BatchEntryInvoice,
  // BatchEntryRawMaterials,

  // new batch entry

  // company settings
  CompanySettings,
  CompanyProfile,

  // sales
  SampleProduct,
  SampleProductList,
  SampleProductListHistory,

  // formulation
  FormulationProductRemarks,
  FormulationPhysical,
  // post production
  PostProduction,
  PostProductionProduct,
  PostProductionFormulatedProducts,
  PostProductionRawMaterials,

  // schedule
  ScheduleModel,
  ScheduleInvoiceList,
  ScheduleDeliver,
  ScheduleProductList,
  ScheduleDeductionHistory,

  // return products
  ReturnProduct,
  ReturnProductList,
  ReturnStockHistory,

  // product to customer
  ProductTagCustomer,

  // formulation
  Formulation,
  FormulationProductUsed,

  //stock management history
  SalesInvoiceStockManagementHistory,

  // batch entry 2
  BatchEntry,
  BatchEntryTaggedMixer,
  BatchEntryTaggedInvoice,
  BatchEntryFormulatedProduct,
  BatchEntryFormulatedMaterialUsed,
  BatchEntryFormulatedReplacedMaterial,
  BatchEntryCostList,
  BatchEntryReprint,
  BatchEntryStockManagementHistory,

  //  concord notification
  ConcordNotification,

  // tax report
  TaxReport,
};
