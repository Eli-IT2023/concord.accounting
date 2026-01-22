const express = require("express");
const cors = require("cors");
const mysql = require("mysql");
const app = express();
const bodyParser = require("body-parser");
const port = 8086;
const mailerConfig = require("./db/config/mailer.config");

require("dotenv").config();
const frontendURL = mailerConfig.frontendURL;

app.use(
  cors({
    origin: frontendURL,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "OPTIONS", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);

app.use(express.json({ limit: "500mb" }));

app.use(
  bodyParser.urlencoded({
    limit: "500mb",
    extended: true,
    parameterLimit: 100000,
  })
);

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", frontendURL);
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

// reports
const production_report = require("./routes/Reports/production_report.route");
const ExpensesReport = require("./routes/expenses_report.route");
const trialBalanceReport = require("./routes/trial_balance_report.route");
//Routes:
const accountList = require("./routes/account_list.route");
const masterRoute = require("./routes/masterlist.route");
const userRoute = require("./routes/userRole.route");
const expenses2 = require("./routes/expenses2.route");
const label = require("./routes/label.route");
const currencyRoute = require("./routes/currency.route");
const vendorsRoute = require("./routes/vendors.route");
const expenses1 = require("./routes/expenses_one.route");
const ProductList = require("./routes/product.route");
const Warehouse = require("./routes/warehouse.route");
const Customer = require("./routes/customer.route");
const Payable = require("./routes/payable.route");
const Payable_Payment = require("./routes/payable_payment.route");
const productTagVendor = require("./routes/product_tag_vendor.route");
const StockManagement = require("./routes/stock_mangement.route");
const Production = require("./routes/production.route");
const BankTransaction = require("./routes/bank_transaction.route");
const FixedAsset = require("./routes/fixed_asset.route");
const SalesInvoice = require("./routes/invoice.route");
const OtherIncome = require("./routes/other_income.route");
const IncomeReport = require("./routes/income_report_route");

const Inventory = require("./routes/inventory_countring.route");
const InventoryCounting = require("./routes/inventory_countring.route");
const LocalBulkCollection = require("./routes/local_bulk_collection.route");
const OverseasBulkCollection = require("./routes/overseas_bulk_collection.route");
const Expenses = require("./routes/expenses.route");
const Loan = require("./routes/loan.route");
const Lending = require("./routes/lend.route");
const CashFlow = require("./routes/cash_flow.route");
const IssuedCheck = require("./routes/issued_check.route");
const ForgotPassword = require("./routes/forgotPassword.route");
const AssetAccount = require("./routes/assetaccount.route");
const Liability = require("./routes/liability.route");
const PayLocalExpenses = require("./routes/pay-local-expenses.route");
const OutstandingCollection = require("./routes/outstanding_collection.route");
const NewPassword = require("./routes/newPassword.route");
const BankBudgeting = require("./routes/bank_budgeting.route");
const Cutoff = require("./routes/cutoff.route");
const ReturnEarnings = require("./routes/return_earnings.route");
const LoanOutstanding = require("./routes/loan_outstanding.route");
const ReportBalanceSheet = require("./routes/report_balance_sheet.route");
const Inventory_Report = require("./routes/inventory_report.route");
const PurchaseReport = require("./routes/purchase_report.route");
const SalesReport = require("./routes/sales_report.route");
const Notification = require("./routes/notification.route");
const StockTransfer = require("./routes/stock_transfer.route");
const ActivityLog = require("./routes/activity_log");
const ProfitLoss = require("./routes/profit_loss.route");
const Migration = require("./routes/migration.route");
const CompanyProfile = require("./routes/company_profile.route");
const profileRoute = require('./routes/profile.route');

// pdf
const PayablePDF = require("./routes/payablePDF.route");
const Dashboard = require("./routes/dashboard.route");

//lion chem
const Parameters = require("./routes/parameters.route");
const Source = require("./routes/source.route");
const TaxSettings = require("./routes/tax_settings.route");
const Packaging = require("./routes/Lion Chem/Settings/packaging.route");

// const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

app.use(cookieParser());

// pdf
app.use("/payablePDF", PayablePDF);

// reports
app.use("/report_production", production_report);
app.use("/expensesReport", ExpensesReport);
app.use("/trialBalanceReport", trialBalanceReport);

app.use("/accountList", accountList);
app.use("/masterList", masterRoute);
app.use("/userRole", userRoute);
app.use("/expenses2", expenses2);
app.use("/label", label);
app.use("/currency", currencyRoute);
app.use("/vendors", vendorsRoute);
app.use("/expenseone", expenses1);
app.use("/product", ProductList);
app.use("/warehouse", Warehouse);
app.use("/customer", Customer);
app.use("/payable", Payable);
app.use("/payable_payment", Payable_Payment);
app.use("/productTagVendor", productTagVendor);
app.use("/stockManagement", StockManagement);
app.use("/production", Production);
app.use("/bankTransaction", BankTransaction);
app.use("/fixedasset", FixedAsset);
app.use("/invoice", SalesInvoice);
app.use("/otherIncome", OtherIncome);
app.use("/inventoryCounting", InventoryCounting);
app.use("/bulkcollection", LocalBulkCollection);
app.use("/overseas_bulkcollection", OverseasBulkCollection);
app.use("/outstanding", OutstandingCollection);
app.use("/expenses", Expenses);
app.use("/loan", Loan);
app.use("/lend", Lending);
app.use("/cashFlow", CashFlow);
app.use("/issuedCheck", IssuedCheck);
app.use("/forgotPassword", ForgotPassword);
app.use("/assetAccount", AssetAccount);
app.use("/liability", Liability);
app.use("/paylocalexpenses", PayLocalExpenses);
app.use("/bankBudgeting", BankBudgeting);
app.use("/cutoff", Cutoff);
app.use("/earnings", ReturnEarnings);
app.use("/balance_sheet", ReportBalanceSheet);
app.use("/inventoryReport", Inventory_Report);
app.use("/salesReport", SalesReport);
app.use("/notification", Notification);
app.use("/dashboard", Dashboard);

app.use("/purchase_report", PurchaseReport);
app.use("/newPassword", NewPassword);
app.use("/loan_outstanding", LoanOutstanding);
app.use("/stock_transfer", StockTransfer);
app.use("/incomeReport", IncomeReport);
app.use("/activity_log", ActivityLog);
app.use("/profit_loss", ProfitLoss);
app.use("/migration", Migration);
app.use("/company_profile", CompanyProfile);
app.use("/profile", profileRoute);
//routes by subject
const accountListSub = require("./routes/RouteBySubject/accountlist_sub.route");
const Equity = require("./routes/RouteBySubject/equity.route");
const assetaccountListSub = require("./routes/RouteBySubject/assetaccountlist_sub.route");

app.use("/equity", Equity);
app.use("/accountListSub", accountListSub);
app.use("/assetaccountListSub", assetaccountListSub);
//routes by subject END

//Lion Chem
app.use("/Parameters", Parameters);
app.use("/source", Source);
app.use("/tax_settings", TaxSettings);
app.use("/Packaging", Packaging);

app.listen(port, () => {
  console.log(`listening to port ${port}`);
});
