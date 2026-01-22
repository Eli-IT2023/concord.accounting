// Import necessary modules
const express = require("express");
const { localDB, cloudDB } = require("./connection.js");
const app = express();
const port = 30000;
const cron = require("node-cron");

// Import sync data modules
const { UserRolesyncData } = require("./models_sync/userrole.js");
const { MasterListsyncData } = require("./models_sync/masterlist.js");
const { CurrencySyncData } = require("./models_sync/currency.js");
const { WarehouseSyncData } = require("./models_sync/warehouse.js");
const { NotificationSyncData } = require("./models_sync/notification.js");
const { ActivityLogSyncData } = require("./models_sync/activity_log.js");
const { ExpensesType1Data } = require("./models_sync/expenses_type1.js");
const { ExpensesType2Data } = require("./models_sync/expenses_type2.js");
const { CustomerData } = require("./models_sync/customer.js");
const { VendorsData } = require("./models_sync/vendor.js");
const { CutoffSyncData } = require("./models_sync/cutoff.js");
const { ProductListSyncData } = require("./models_sync/productlist.js");
const { Prod_VendorSyncData } = require("./models_sync/prod_vendor.js");
const {
  AccBaseSubjectSyncData,
} = require("./models_sync/accountlist_base_sub.js");
const { AccSub3SyncData } = require("./models_sync/accsub3.js");
const {
  AccSub3TransactionSyncData,
} = require("./models_sync/acc_sub_transaction.js");
const { PayableSyncData } = require("./models_sync/payable.js");
const {
  PayableProductsSyncData,
} = require("./models_sync/payable_products.js");
const {
  PayableOtherFeesSyncData,
} = require("./models_sync/payable_otherfees.js");

const { SalesInvoiceSyncData } = require("./models_sync/sales_invoice.js");
const { BulkCollectionSyncData } = require("./models_sync/bulk_collection.js");
const {
  BulkCollectionPaymentSyncData,
} = require("./models_sync/bulk_collection_payment.js");
const {
  BulkCollectionTransactionSyncData,
} = require("./models_sync/bulk_collection_transactions.js");
const {
  SalesInvoiceTagInventorySyncData,
} = require("./models_sync/sales_invoice_tag_inventory.js");
const {
  StockManagementSyncData,
} = require("./models_sync/stock_management.js");
const { ExpensesSyncData } = require("./models_sync/expenses.js");
const {
  PayBulkExpensesSyncData,
} = require("./models_sync/pay_bulk_expense.js");
const {
  PayBulkExpensesTransactionSyncData,
} = require("./models_sync/pay_bulk_expenses_transaction.js");
const {
  PayBulkExpensesPaymentSyncData,
} = require("./models_sync/pay_bulk_expenses_payment.js");
const {
  PayBulkAddDeductExpensesSyncData,
} = require("./models_sync/pay_bulk_add_deduct_expenses.js");
const { FixedAssetSyncData } = require("./models_sync/fixed_asset.js");
const {
  FixedAssetForecastSyncData,
} = require("./models_sync/fixed_asset_forecast.js");
const {
  BankTransactionSyncData,
} = require("./models_sync/bank_transaction.js");
const { IssuedCheckSyncData } = require("./models_sync/issued_check.js");
const { CashFlowSyncData } = require("./models_sync/cashflow.js");
const { ReturnEarningSyncData } = require("./models_sync/return_earnings.js");
const {
  ReturnEarningCutoffSyncData,
} = require("./models_sync/return_earning_cutoff.js");
const {
  ReturnCapitalMotherSyncData,
} = require("./models_sync/return_capital_mother.js");
const {
  ReturnChildRetainedSyncData,
} = require("./models_sync/return_child_retained.js");
const {
  ReturnOwnerListSyncData,
} = require("./models_sync/return_owner_list.js");
const {
  ReturnCapitalPaymentSyncData,
} = require("./models_sync/return_capital_payment.js");
const { ProductionSyncData } = require("./models_sync/production.js");
const {
  ProductionRawUseSyncData,
} = require("./models_sync/production_raw_use.js");
const {
  ProductionFinishProductSyncData,
} = require("./models_sync/production_finish_product.js");
const {
  ProductionFinishRawUseSyncData,
} = require("./models_sync/production_finish_raw_used.js");
const {
  StockTransferMotherSyncData,
} = require("./models_sync/stock_transfer_mother.js");
const {
  StockTransferProductSyncData,
} = require("./models_sync/stock_transfer_products.js");
const {
  StockTransferApproveProductSyncData,
} = require("./models_sync/stock_transfer_approve_product.js");
const {
  InventoryCountingSyncData,
} = require("./models_sync/inventory_counting.js");
const {
  InventoryCountingItemListSyncData,
} = require("./models_sync/inventory_counting_item_list.js");
const { OtherIncomeSyncData } = require("./models_sync/other_income.js");
const {
  OtherIncomePaymentSyncData,
} = require("./models_sync/other_income_payment.js");
const { ReceivingCheckSyncData } = require("./models_sync/receiving_checks.js");
const {
  PreviousProfitLossSyncData,
} = require("./models_sync/previous_profit_loss.js");
const {
  InventoryReportSyncData,
} = require("./models_sync/inventory_reports.js");
const {
  PayableBulkTransactionSyncData,
} = require("./models_sync/payable_bulk_transaction.js");
const { PayableBulkSyncData } = require("./models_sync/payable_bulk.js");
const {
  Payable_Payment_syncData,
} = require("./models_sync/payable_bulk_payments.js");
// Middleware to parse JSON requests
app.use(express.json());

// Variable to track sync status
let isSyncing = false;
let lastSyncTime = null;
let connectionEstablished = false;

// Function to establish database connections
async function establishConnections() {
  if (connectionEstablished) return;

  try {
    await localDB.authenticate();
    console.log("✅ Connected to Local Database");

    await cloudDB.authenticate();
    console.log("✅ Connected to Cloud Database");

    connectionEstablished = true;
    console.log("🎉 Database connections established!");
  } catch (err) {
    connectionEstablished = false;
    console.error("❌ Database connection failed:", err);
    console.error("🔄 Will retry connection on next sync attempt...");
    throw err;
  }
}

// Function to sync an individual model with error handling
async function syncModel(syncFunction, modelName) {
  try {
    await syncFunction();
    return { model: modelName, status: "success" };
  } catch (error) {
    console.error(`❌ Error syncing ${modelName}:`, error.message);
    return { model: modelName, status: "error", error: error.message };
  }
}

// Main sync function that runs all sync operations in parallel
async function syncAllModels() {
  if (isSyncing) {
    console.log("⏳ Sync already in progress, skipping this run");
    return;
  }

  isSyncing = true;
  const start = new Date();
  console.log(
    "⏱ Sync started at:",
    start.toLocaleString("en-PH", { timeZone: "Asia/Manila" })
  );

  try {
    await establishConnections();

    // Group sync operations based on dependencies/priority
    const syncResults = await Promise.all([
      // High priority sync operations - master data
      syncModel(UserRolesyncData, "UserRole"),
      syncModel(MasterListsyncData, "MasterList"),
      syncModel(CurrencySyncData, "Currency"),
      syncModel(WarehouseSyncData, "Warehouse"),
      syncModel(ExpensesType1Data, "ExpensesType1"),
      syncModel(ExpensesType2Data, "ExpensesType2"),

      // Medium priority - reference data
      syncModel(CustomerData, "Customer"),
      syncModel(VendorsData, "Vendors"),
      syncModel(ProductListSyncData, "ProductList"),
      syncModel(Prod_VendorSyncData, "Prod_Vendor"),
      syncModel(CutoffSyncData, "Cutoff"),
      syncModel(AccBaseSubjectSyncData, "AccBaseSubject"),
      syncModel(AccSub3SyncData, "AccSub3"),

      // Transaction data
      syncModel(AccSub3TransactionSyncData, "AccSub3Transaction"),

      syncModel(PayableSyncData, "Payable"),
      syncModel(PayableProductsSyncData, "PayableProducts"),
      syncModel(PayableOtherFeesSyncData, "PayableOtherFees"),
      syncModel(PayableBulkSyncData, "PayableBulk"),
      syncModel(PayableBulkTransactionSyncData, "PayableBulkTransaction"),
      syncModel(Payable_Payment_syncData, "PayableBulkPayment"),

      syncModel(StockManagementSyncData, "StockManagementSyncData"),
      syncModel(SalesInvoiceSyncData, "SalesInvoiceSyncData"),
      syncModel(
        SalesInvoiceTagInventorySyncData,
        "SalesInvoiceTagInventorySyncData"
      ),
      syncModel(StockManagementSyncData, "StockManagementSyncData"),

      syncModel(BulkCollectionSyncData, "BulkCollectionSyncData"),
      syncModel(BulkCollectionPaymentSyncData, "BulkCollectionPaymentSyncData"),
      syncModel(
        BulkCollectionTransactionSyncData,
        "BulkCollectionTransactionSyncData"
      ),

      syncModel(ReceivingCheckSyncData, "ReceivingCheckSyncData"),

      syncModel(ExpensesSyncData, "ExpensesSyncData"),
      syncModel(PayBulkExpensesSyncData, "PayBulkExpensesSyncData"),
      syncModel(
        PayBulkExpensesTransactionSyncData,
        "PayBulkExpensesTransactionSyncData"
      ),
      syncModel(
        PayBulkExpensesPaymentSyncData,
        "PayBulkExpensesPaymentSyncData"
      ),
      syncModel(
        PayBulkAddDeductExpensesSyncData,
        "PayBulkAddDeductExpensesSyncData"
      ),

      syncModel(FixedAssetSyncData, "FixedAssetSyncData"),
      syncModel(FixedAssetForecastSyncData, "FixedAssetForecastSyncData"),

      syncModel(BankTransactionSyncData, "BankTransactionSyncData"),
      syncModel(IssuedCheckSyncData, "IssuedCheckSyncData"),
      syncModel(CashFlowSyncData, "CashFlowSyncData"),

      syncModel(ReturnEarningSyncData, "ReturnEarningSyncData"),
      syncModel(ReturnEarningCutoffSyncData, "ReturnEarningCutoffSyncData"),
      syncModel(ReturnCapitalMotherSyncData, "ReturnCapitalMotherSyncData"),
      syncModel(ReturnChildRetainedSyncData, "ReturnChildRetainedSyncData"),
      syncModel(ReturnOwnerListSyncData, "ReturnOwnerListSyncData"),
      syncModel(ReturnCapitalPaymentSyncData, "ReturnCapitalPaymentSyncData"),

      syncModel(ProductionSyncData, "ProductionSyncData"),
      syncModel(ProductionRawUseSyncData, "ProductionRawUseSyncData"),
      syncModel(
        ProductionFinishProductSyncData,
        "ProductionFinishProductSyncData"
      ),
      syncModel(
        ProductionFinishRawUseSyncData,
        "ProductionFinishRawUseSyncData"
      ),

      syncModel(StockTransferMotherSyncData, "StockTransferMotherSyncData"),
      syncModel(StockTransferProductSyncData, "StockTransferProductSyncData"),
      syncModel(
        StockTransferApproveProductSyncData,
        "StockTransferApproveProductSyncData"
      ),

      syncModel(InventoryCountingSyncData, "InventoryCountingSyncData"),
      syncModel(
        InventoryCountingItemListSyncData,
        "InventoryCountingItemListSyncData"
      ),

      syncModel(OtherIncomeSyncData, "OtherIncomeSyncData"),
      syncModel(OtherIncomePaymentSyncData, "OtherIncomePaymentSyncData"),

      syncModel(PreviousProfitLossSyncData, "PreviousProfitLossSyncData"),
      syncModel(InventoryReportSyncData, "InventoryReportSyncData"),

      // Logging and notification data
      syncModel(NotificationSyncData, "Notification"),
      syncModel(ActivityLogSyncData, "ActivityLog"),
    ]);

    const failures = syncResults.filter((result) => result.status === "error");

    if (failures.length > 0) {
      console.warn(`⚠️ ${failures.length} sync operations failed`);
      failures.forEach((failure) => {
        console.warn(`  - ${failure.model}: ${failure.error}`);
      });
    }

    const end = new Date();
    const diffMs = end - start;
    const diffSecs = (diffMs / 1000).toFixed(2);

    console.log(
      "✅ Sync completed at:",
      end.toLocaleString("en-PH", { timeZone: "Asia/Manila" })
    );
    console.log(`⏱ Total Sync Duration: ${diffSecs} seconds`);
    lastSyncTime = end;
  } catch (err) {
    console.error("❌ Sync error:", err);
  } finally {
    isSyncing = false;
  }
}

// Schedule the sync to run every 5 minutes instead of every second
// You can adjust this based on your actual requirements
cron.schedule("*/10 * * * * *", syncAllModels);

// API endpoint to check sync status
app.get("/api/sync/status", (req, res) => {
  res.json({
    connectionEstablished,
    isSyncing,
    lastSyncTime: lastSyncTime
      ? lastSyncTime.toLocaleString("en-PH", { timeZone: "Asia/Manila" })
      : null,
  });
});

// API endpoint to manually trigger a sync
app.post("/api/sync/trigger", async (req, res) => {
  if (isSyncing) {
    return res.status(409).json({
      message: "Sync already in progress",
      startedAt: lastSyncTime.toLocaleString("en-PH", {
        timeZone: "Asia/Manila",
      }),
    });
  }

  // Start sync in background
  syncAllModels();

  // Respond immediately
  res.json({ message: "Sync triggered successfully" });
});

// Start the server
app.listen(port, async () => {
  console.log(`🚀 Server running on http://localhost:${port}`);

  // Initial connection attempt when server starts
  try {
    await establishConnections();
    // Run initial sync when server starts
    syncAllModels();
  } catch (err) {
    console.error("Initial connection failed, will retry on scheduled sync");
  }
});
