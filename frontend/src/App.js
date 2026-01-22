import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import Roles from "./hooks/roles";
import ProtectedRoutes from "./hooks/protectedRoutes";
import Expenses2 from "./modules/ContentManagement/expenses2";
import LableManagement from "./modules/ContentManagement/labelmanagement";
import Sidebar from "./modules/Sidebar/sidebar";
import Login from "./modules/Login/login";
import Dashboard from "./modules/Dashboard/dashboard";
import Currency from "./modules/Settings/currency";
import Navbar from "./modules/Navbar/navbar";
import Vendor from "./modules/purchases/vendors";
import Expenses1 from "./modules/ContentManagement/expenses1";
import Branches from "./modules/Settings/Branches";
import User from "./modules/Settings/UserManagement";
import ProductList from "./modules/Inventory/product-list";
import CreateProduct from "./modules/Inventory/Sub Folder/create-product";
import UpdateProduct from "./modules/Inventory/Sub Folder/update-product";
import Customer from "./modules/Customer/Customer";
import CustomerCreate from "./modules/Customer/CustomerCreate";
import CustomerUpdate from "./modules/Customer/CustomerUpdate";
import Collection from "./modules/Accounts/collection";
import AccountList from "./modules/Accounts/account-list";
import ViewAccountList from "./modules/Accounts/Sub Folder/view-account-list";
import Payable from "./modules/purchases/Payable";
import PayableCopy from "./modules/purchases/Sub Folder/copy/PayableCopy";
import BulkPayable from "./modules/purchases/Sub Folder/BulkPayable";
import ViewBulkPayable from "./modules/purchases/Sub Folder/ViewBulkPayable";
import CreatePayable from "./modules/purchases/Sub Folder/createPayable";
import LocalPurchase from "./modules/purchases/Local_purchase";
import OverseasPurchase from "./modules/purchases/Overseas_purchase";
import PayablePayment from "./modules/purchases/Sub Folder/payablePayment";
import VendorUpdate from "./modules/purchases/Sub Folder/updateVendor";
import Invoice from "./modules/Sales/Invoice";
import InvoiceCopy from "./modules/Sales/Sub Folder/copy/Invoice-copy";
import CreateInvoice from "./modules/Sales/Sub Folder/create_invoice";

import StockManagement from "./modules/StockManagement/StockManagement";
import RawMaterialUpdate from "./modules/StockManagement/RawMaterialUpdate";
import LocalCollection from "./modules/Sales/Local_collection";
import OverseasCollection from "./modules/Sales/Overseas_collection";
import BulkCollection from "./modules/Sales/Sub Folder/BulkCollection";
import OverseasBulkCollection from "./modules/Sales/Sub Folder/OverseasBulkCollections";
import ViewBulkCollections from "./modules/Sales/Sub Folder/ViewBulkCollection";
import ViewOverseasBulkCollection from "./modules/Sales/Sub Folder/ViewOverseasBulkCollection";
import Productions from "./modules/Inventory/Productions";
import ProductionsForm from "./modules/Inventory/Sub Folder/productions-form";

import OtherIncome from "./modules/Sales/Other_Income";
import Expenses from "./modules/Accounting/Expenses";
import ExpensesCopy from "./modules/Accounting/Sub Folder/copy/ExpensesCopy";
import LocalExpenses from "./modules/Accounting/localExpenses";
import OverseasExpenses from "./modules/Accounting/overseasExpenses";
import AddExpenses from "./modules/Accounting/Sub Folder/addExpenses";
import LocalBulkExpenses from "./modules/Accounting/Sub Folder/payLocalExpenses";
import ViewLocalPayExpenses from "./modules/Accounting/Sub Folder/viewPayLocalExpenses";
import ViewExpensess from "./modules/Accounting/Sub Folder/viewExpensess";
import Wheel from "./modules/Accounting/Sub Folder/wheel";
import InventoryCounting from "./modules/Inventory/Inventory-counting";
import InveotoryCountingUpdate from "./modules/Inventory/Sub Folder/countingUpdate";
import CountingCreate from "./modules/Inventory/Sub Folder/countingCreate";
import IssuedCheckAccount from "./modules/Accounts/issued-check-account";
import Cashflow from "./modules/Accounting/Cash_flow";
import Loan from "./modules/Accounting/Loan";
// import LoanInformation from "./modules/Accounting/Sub Folder/LoanInformation";
import CreateLoan from "./modules/Accounting/Sub Folder/createLoan";
import BankTransaction from "./modules/BankTransaction/BankTransaction";
import FixedAsset from "./modules/FixedAsset/FixedAsset";
import FixedAssetUpdate from "./modules/FixedAsset/FixedAssetUpdate";
import Lending from "./modules/Accounting/Lending";
import CreateLending from "./modules/Accounting/Sub Folder/createLending";
import StockTransfer from "./modules/Inventory/Stock_transfer";
import CreateStockTransfer from "./modules/Inventory/Sub Folder/createStockTransfer";
import ApprovalStockTransfer from "./modules/Inventory/Sub Folder/ApprovalStockTransfer";
import UpdateInvoice from "./modules/Sales/Sub Folder/updateInvoice";
import AccessControl from "./modules/Settings/Access_control";
import CreateRbac from "./modules/Settings/Sub Folder/create_rbac";
import CreateAssets from "./modules/Accounting/Sub Folder/createAssets";
import PayLoan from "./modules/Accounting/Sub Folder/payLoan";
import PayLend from "./modules/Accounting/Sub Folder/payLend";
import UpdateRbac from "./modules/Settings/Sub Folder/update-rbac";
import InAppNotification from "./modules/Settings/App-notification";
import Equity from "./modules/Accounting/OwnersEquity";
import Equity2 from "./modules/Accounting/Owners-Equity2";
import CreateEquity from "./modules/Accounting/Sub Folder/createEquity";
import PayEquity from "./modules/Accounting/Sub Folder/payEquity";
import AddOtherIncome from "./modules/Sales/Sub Folder/addOtherIncome";
import ViewOtherIncome from "./modules/Sales/Sub Folder/viewOtherIncome";
import BankBudgeting from "./modules/Accounts/bank-budgeting";
import Cutoff from "./modules/Accounting/Cutoff";
import ViewCutoff from "./modules/Accounting/Sub Folder/viewCutoff";
import ReturnEarnings from "./modules/Accounting/ReturnEarnings";
import ViewEarnings from "./modules/Accounting/Sub Folder/viewEarnings";

import CompanyProfile from "./modules/CompanyProfile/CompanySettings";
import ProfileSettings from "./modules/ProfileSetting/ProfileSettings";

// Reports
// Statement Reports
import BalanceSheet from "./modules/Reports/Statements Reports/Balance_sheet";
import ProductionLoss from "./modules/Reports/Statements Reports/Production_loss";
import ExpensesReport from "./modules/Reports/Statements Reports/Expenses_report";
import IncomeProfit from "./modules/Reports/Statements Reports/Income_profit";
import IncomeProfitBranches from "./modules/Reports/Statements Reports/Income_profit_branch";
import IncomeProfitClient from "./modules/Reports/Statements Reports/income_profit_client";
import BossReport from "./modules/Reports/Statements Reports/Boss_report";

// Audit Reports
import JournalListReport from "./modules/Reports/Audit Reports/Journal_list_report";
import TrialBalance from "./modules/Reports/Audit Reports/Trial_balance";

// Inventory Reports
import InventoryReport from "./modules/Reports/Inventory Reports/Inventory_reports";

// General Reports
import ReportsSupplier from "./modules/Reports/General Reports/Report_supplier";
import SalesReport from "./modules/Reports/General Reports/Sales_report";

// Business Partner Report
import ReceivingReport from "./modules/Reports/Business Partner Report/Receiving_report";
import PayableReport from "./modules/Reports/Business Partner Report/Payable_report";

// Forgot password
import ForgotPassword from "./modules/Forgot Password/forgot-password";
import OTP from "./modules/Forgot Password/otp";
import ChangePassword from "./modules/Forgot Password/change-password";

import AssetAccount from "./modules/Accounting/AssetAccount";
import CreateAssetAccount from "./modules/Accounting/Sub Folder/createAssetAccount";

import Liabilities from "./modules/Accounting/Liabilities";
import CreateLiability from "./modules/Accounting/Sub Folder/createLiability";

// change password
import NewPassword from "./modules/New Password/new-password";

// liabilities revision sample
import Liabilities1 from "./modules/Accounting/Liabilities1";
import Liabilities2 from "./modules/Accounting/Liabilities2";
import ViewLiabilities1 from "./modules/Accounting/Sub Folder/viewLiabilities1";

// account list sample
import AccountList1 from "./modules/Accounts/account-list1";
// import AccountList2 from "./modules/Accounts/account-list2";

import ViewAccountlist1 from "./modules/Accounts/Sub Folder/view-account-list1";

import AssetAccountList1 from "./modules/Accounting/assetaccount-list1";
import AssetAccountList2 from "./modules/Accounting/assetaccount-list2";

import ProductionView from "./modules/Inventory/Sub Folder/production-view";

// new reports
import BalanceSheet1 from "./modules/Reports/Enhancement Reports/balance_sheet";
import InventoryReport1 from "./modules/Reports/Enhancement Reports/inventory_report";
import ProductionReport1 from "./modules/Reports/Enhancement Reports/production_report";
import ExpensesReport1 from "./modules/Reports/Enhancement Reports/expenses_report";
import IncomeReport1 from "./modules/Reports/Enhancement Reports/income_report";
import SalesReport1 from "./modules/Reports/Enhancement Reports/sales_report";
import PurchaseReport1 from "./modules/Reports/Enhancement Reports/purchase_report";
import TrialBalance1 from "./modules/Reports/Enhancement Reports/trial_balance";
import ProfitLoss from "./modules/Reports/Enhancement Reports/profit_loss";
import ActivityLog from "./modules/ActivityLog/ActivityLog";

import PDFViewerPage from "./modules/purchases/Sub Folder/PDFViewerPage";
import InvoicePDFViewerPage from "./modules/Sales/Sub Folder/InvoicePDFViewerPage";
import Migration from "./modules/MigrationPage/migration.jsx";

// ### LION CHEM ###
import Parameters from "./modules/ContentManagement/parameters.jsx";
import Source from "./modules/ContentManagement/source.jsx";
import TaxSettings from "./modules/Tax Management/Tax Settings/tax_settings.jsx";
import TaxSettingsAdd from "./modules/Tax Management/Tax Settings/Tax_settings_add.jsx";

// purchase
import Purchase_request from "./modules/purchases/Purchase_request.jsx";
import Purchase_request_create from "./modules/purchases/Sub Folder/Puchase_request_create.jsx";

// settings
import Packaging from "./modules/Settings/packaging.jsx";

// ### LION CHEM END ###

function App() {
  return (
    <Router>
      <Main />
    </Router>
  );
}

const Main = () => {
  const location = useLocation();
  const hideSidebarAndPadding = [
    "/",
    "/wheel",
    "/forgot-password",
    "/OTP",
    "/change-password",
    "/new-password",
  ].includes(location.pathname);

  return (
    <ProtectedRoutes>
      <div className="app-container d-flex">
        {!hideSidebarAndPadding && (
          <Roles>{({ authrztn }) => <Sidebar authrztn={authrztn} />}</Roles>
        )}
        <div className="flex-grow-1 w-75 d-flex flex-column">
          {!hideSidebarAndPadding && (
            <Roles>{({ authrztn }) => <Navbar authrztn={authrztn} />}</Roles>
          )}
          <div
            className={`flex-grow-1 ${
              !hideSidebarAndPadding ? "p-4 default-bg" : ""
            }`}
          >
            <Routes>
              <Route path="/wheel" element={<Wheel />} />
              {/* login */}
              <Route path="/" element={<Login />} />
              {/* forgot password */}
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/OTP" element={<OTP />} />
              <Route path="/change-password" element={<ChangePassword />} />
              {/* new password */}
              <Route path="/new-password" element={<NewPassword />} />
            </Routes>

            <Routes>
              {/* LION CHEM START */}
              <Route
                path="/content/parameters"
                element={
                  <Roles>
                    {({ authrztn }) => <Parameters authrztn={authrztn} />}
                  </Roles>
                }
              />

              <Route
                path="/content/source"
                element={
                  <Roles>
                    {({ authrztn }) => <Source authrztn={authrztn} />}
                  </Roles>
                }
              />

              <Route
                path="/companyProfile"
                element={
                  <Roles>
                    {({ authrztn }) => <CompanyProfile authrztn={authrztn} />}
                  </Roles>
                }
              />

              <Route
                path="/profileSettings"
                element={
                  <Roles>
                    {({ authrztn }) => <ProfileSettings authrztn={authrztn} />}
                  </Roles>
                }
              />

              {/* LION CHEM END */}

              {/* dashboard */}
              <Route
                path="/dashboard"
                element={
                  <Roles>
                    {({ authrztn }) => <Dashboard authrztn={authrztn} />}
                  </Roles>
                }
              />

              {/* Sales modules */}
              <Route
                path="/sales/local-collections"
                element={
                  <Roles>
                    {({ authrztn }) => <LocalCollection authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/sales/overseas-collections"
                element={
                  <Roles>
                    {({ authrztn }) => (
                      <OverseasCollection authrztn={authrztn} />
                    )}
                  </Roles>
                }
              />
              <Route
                path="/sales/customers"
                element={
                  <Roles>
                    {({ authrztn }) => <Customer authrztn={authrztn} />}
                  </Roles>
                }
              />
              {/* <Route
                path="/sales/customers/create"
                element={<CustomerCreate />}
              /> */}

              <Route
                path="/sales/customers/create"
                element={
                  <Roles>
                    {(authrztn) => <CustomerCreate authrztn={authrztn} />}
                  </Roles>
                }
              />
              {/* <Route
                path="/sales/customers/update/:id"
                element={
                  <Roles>
                    {({authrztn}) => <CustomerUpdate authrztn={authrztn} />}
                  </Roles>
                }
              /> */}
              <Route
                path="/initUpdate/:id"
                element={
                  <Roles>
                    {({ authrztn }) => <CustomerUpdate authrztn={authrztn} />}
                  </Roles>
                }
              />

              <Route
                path="/sales/invoices"
                element={
                  <Roles>
                    {({ authrztn }) => <Invoice authrztn={authrztn} />}
                  </Roles>
                }
              />
              {/* para sa notification to na magredirect sa copy na invoice module */}
              <Route
                path="/sales/invoices-copy/:id"
                element={
                  <Roles>
                    {({ authrztn }) => <InvoiceCopy authrztn={authrztn} />}
                  </Roles>
                }
              />

              {/* Sales Sub Folder */}
              <Route
                path="/sales/local-bulk-collection"
                element={<BulkCollection />}
              />
              <Route
                path="/sales/overseas-bulk-collection"
                element={<OverseasBulkCollection />}
              />
              <Route
                path="/sales/view-local-bulk-collection/:id"
                element={
                  <Roles>
                    {({ authrztn, setId, setIdToAdd, setEdit, setRoute }) => (
                      <ViewBulkCollections
                        authrztn={authrztn}
                        setId={setId}
                        setIdToAdd={setIdToAdd}
                        setEdit={setEdit}
                        setRoute={setRoute}
                      />
                    )}
                  </Roles>
                }
              />
              <Route
                path="/sales/view-overseas-bulk-collection/:id"
                element={
                  <Roles>
                    {({ authrztn, setId, setIdToAdd, setEdit, setRoute }) => (
                      <ViewOverseasBulkCollection
                        authrztn={authrztn}
                        setId={setId}
                        setIdToAdd={setIdToAdd}
                        setEdit={setEdit}
                        setRoute={setRoute}
                      />
                    )}
                  </Roles>
                }
              />
              <Route path="/sales/create-invoice" element={<CreateInvoice />} />
              <Route
                path="/sales/invoice-update/:id"
                element={
                  <Roles>
                    {({ authrztn }) => <UpdateInvoice authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/accounts/other-income"
                element={
                  <Roles>
                    {({ authrztn }) => <OtherIncome authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/accounts/add-otherIncome"
                element={<AddOtherIncome />}
              />

              <Route
                path="/accounts/viewOtherIncome/:id"
                element={
                  <Roles>
                    {({ authrztn }) => <ViewOtherIncome authrztn={authrztn} />}
                  </Roles>
                }
              />

              {/* Purchases modules */}

              {/* ### lion chem ### */}
              <Route
                path="/Purchases/purchase-request"
                element={
                  <Roles>
                    {({ authrztn }) => <Purchase_request authrztn={authrztn} />}
                  </Roles>
                }
              />

              {/* create purchase request */}
              <Route
                path="/Purchases/create-purchase-request"
                element={
                  <Roles>
                    {({ authrztn }) => (
                      <Purchase_request_create authrztn={authrztn} />
                    )}
                  </Roles>
                }
              />

              {/* ### lion chem end ### */}

              <Route
                path="/Purchases/vendors"
                element={
                  <Roles>
                    {({ authrztn }) => <Vendor authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/Purchases/Payable"
                element={
                  <Roles>
                    {({ authrztn }) => <Payable authrztn={authrztn} />}
                  </Roles>
                }
              />

              <Route
                path="/Purchases/Payable-copy/:id"
                element={
                  <Roles>
                    {({ authrztn }) => <PayableCopy authrztn={authrztn} />}
                  </Roles>
                }
              />

              <Route
                path="/Purchases/local-purchase"
                element={
                  <Roles>
                    {({ authrztn }) => <LocalPurchase authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/Purchases/bulk-payable/:module"
                element={<BulkPayable />}
              />
              <Route
                path="/Purchases/view-bulk-payable/:module/:id"
                element={
                  <Roles>
                    {({ authrztn, setId, setIdToAdd, setEdit, setRoute }) => (
                      <ViewBulkPayable
                        authrztn={authrztn}
                        setId={setId}
                        setIdToAdd={setIdToAdd}
                        setEdit={setEdit}
                        setRoute={setRoute}
                      />
                    )}
                  </Roles>
                }
              />
              <Route
                path="/Purchases/overseas-purchase"
                element={
                  <Roles>
                    {({ authrztn }) => <OverseasPurchase authrztn={authrztn} />}
                  </Roles>
                }
              />

              {/* Purchases Sub Folder */}
              <Route
                path="/Purchases/create_payable"
                element={<CreatePayable />}
              />

              <Route
                path="/Purchases/purchase-pay/:id"
                element={
                  <Roles>
                    {({ authrztn }) => <PayablePayment authrztn={authrztn} />}
                  </Roles>
                }
              />

              <Route
                path="/purchases/vendor-update/:id"
                element={
                  <Roles>
                    {({ authrztn }) => <VendorUpdate authrztn={authrztn} />}
                  </Roles>
                }
              />
              {/* Accounts */}
              <Route
                path="/accounts/outstanding-check"
                element={
                  <Roles>
                    {({ authrztn }) => <Collection authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/accounts/account-list"
                element={
                  <Roles>
                    {({ authrztn }) => <AccountList authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/accounts/issued-check-account"
                element={
                  <Roles>
                    {({ authrztn }) => (
                      <IssuedCheckAccount authrztn={authrztn} />
                    )}
                  </Roles>
                }
              />

              <Route
                path="/accounts/view-account-list/:id"
                element={<ViewAccountList />}
              />
              <Route
                path="/accounts/bank-transaction"
                element={
                  <Roles>
                    {({ authrztn }) => <BankTransaction authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/accounts/bank-budgeting"
                element={
                  <Roles>
                    {({ authrztn }) => <BankBudgeting authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/accounts/view-account-list/:id"
                element={<ViewAccountList />}
              />

              <Route
                path="/accounts/account-list1"
                element={
                  <Roles>
                    {({ authrztn }) => <AccountList1 authrztn={authrztn} />}
                  </Roles>
                }
              />
              {/* <Route
              path="/accounts/account-list2/:id"
              element={<AccountList2 />}_
            /> */}

              <Route
                path="/accounting/assetaccount-list1"
                element={
                  <Roles>
                    {({ authrztn }) => (
                      <AssetAccountList1 authrztn={authrztn} />
                    )}
                  </Roles>
                }
              />
              <Route
                path="/accounting/assetaccount-list2/:id"
                element={<AssetAccountList2 />}
              />

              <Route
                path="/accounts/view-accountlist/:id"
                element={<ViewAccountlist1 />}
              />

              <Route
                path="/accounting/view-assetAccount/:id"
                element={<ViewAccountlist1 />}
              />

              <Route
                path="/accounting/view-liabilityAccount/:id"
                element={<ViewAccountlist1 />}
              />
              <Route
                path="/accounting/view-equityAccount/:id"
                element={<ViewAccountlist1 />}
              />

              {/* Inventory modules  */}
              <Route
                path="/inventory/Productions"
                element={
                  <Roles>
                    {({ authrztn }) => <Productions authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/inventory/ProductionsView/:id"
                element={
                  <Roles>
                    {({ authrztn }) => <ProductionView authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/inventory/stock-management"
                element={
                  <Roles>
                    {({ authrztn }) => <StockManagement authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/inventory/product-list"
                element={
                  <Roles>
                    {({ authrztn }) => <ProductList authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/inventory/inventory-counting"
                element={
                  <Roles>
                    {({ authrztn }) => (
                      <InventoryCounting authrztn={authrztn} />
                    )}
                  </Roles>
                }
              />
              <Route
                path="/inventory/inventory-counting-update/:id"
                element={
                  <Roles>
                    {({ authrztn }) => (
                      <InveotoryCountingUpdate authrztn={authrztn} />
                    )}
                  </Roles>
                }
              />

              <Route
                path="/inventory/stock-transfer"
                element={
                  <Roles>
                    {({ authrztn }) => <StockTransfer authrztn={authrztn} />}
                  </Roles>
                }
              />

              {/* inventory sub folder */}
              <Route
                path="/inventory/productions-form"
                element={
                  <Roles>
                    {({ authrztn }) => <ProductionsForm authrztn={authrztn} />}
                  </Roles>
                }
              />

              <Route
                path="/inventory/create-product"
                element={
                  <Roles>
                    {({ authrztn }) => <CreateProduct authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/inventory/update-product/:id"
                element={
                  <Roles>
                    {({ authrztn }) => <UpdateProduct authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/inventory/stockMangement/rawMaterialUpdate"
                element={<RawMaterialUpdate />}
              />
              <Route
                path="/inventory/inventory-counting-create"
                element={<CountingCreate />}
              />
              <Route
                path="/inventory/create-stock-transfer"
                element={
                  <Roles>
                    {({ authrztn }) => (
                      <CreateStockTransfer authrztn={authrztn} />
                    )}
                  </Roles>
                }
              />
              <Route
                path="/inventory/view-stock-transfer/:id"
                element={
                  <Roles>
                    {({ authrztn }) => (
                      <ApprovalStockTransfer authrztn={authrztn} />
                    )}
                  </Roles>
                }
              />

              {/* Accounting Modules */}
              <Route
                path="/accounting/expenses"
                element={
                  <Roles>
                    {({ authrztn }) => <Expenses authrztn={authrztn} />}
                  </Roles>
                }
              />

              <Route
                path="/accounting/expenses-copy/:id"
                element={
                  <Roles>
                    {({ authrztn }) => <ExpensesCopy authrztn={authrztn} />}
                  </Roles>
                }
              />

              <Route
                path="/accounting/local-expenses"
                element={
                  <Roles>
                    {({ authrztn }) => <LocalExpenses authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/accounting/overseas-expenses"
                element={
                  <Roles>
                    {({ authrztn }) => <OverseasExpenses authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/accounting/cash-flow"
                element={
                  <Roles>
                    {({ authrztn }) => <Cashflow authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/accounting/loan"
                element={
                  <Roles>
                    {({ authrztn }) => <Loan authrztn={authrztn} />}
                  </Roles>
                }
              />
              {/* <Route
                path="/accounting/loanInformation/:id"
                element={<LoanInformation />}
              /> */}
              <Route path="/accounting/lending" element={<Lending />} />
              <Route
                path="/accounting/assetaccount"
                element={
                  <Roles>
                    {({ authrztn }) => <AssetAccount authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/accounting/liabilities"
                element={
                  <Roles>
                    {({ authrztn }) => <Liabilities authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/accounting/equity"
                element={
                  <Roles>
                    {({ authrztn }) => <Equity authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/accounting/owners-equity2/:id"
                element={<Equity2 />}
              />
              <Route
                path="/accounting/cutoff"
                element={
                  <Roles>
                    {({ authrztn }) => <Cutoff authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/accounting/retained-earnings"
                element={
                  <Roles>
                    {({ authrztn }) => <ReturnEarnings authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/accounting/view-cutoff/:id"
                element={<ViewCutoff />}
              />
              <Route
                path="/accounting/view-earnings/:id"
                element={<ViewEarnings />}
              />

              <Route
                path="/accounting/liabilities1"
                element={
                  <Roles>
                    {({ authrztn }) => <Liabilities1 authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/accounting/liabilities2"
                element={<Liabilities2 />}
              />
              <Route
                path="/accounting/view-account"
                element={<ViewLiabilities1 />}
              />

              {/* Accounting Sub Folder */}
              <Route
                path="/accounting/add-expenses/:currencyId/:totalFixedAssetAmount"
                element={<AddExpenses />}
              />
              <Route
                path="/accounting/pay-expenses/:foreign_url"
                element={
                  <Roles>
                    {({ authrztn }) => (
                      <LocalBulkExpenses authrztn={authrztn} />
                    )}
                  </Roles>
                }
              />
              <Route
                path="/accounting/view-pay-expenses/:foreign_url/:id"
                element={
                  <Roles>
                    {({ authrztn, setId, setIdToAdd, setEdit, setRoute }) => (
                      <ViewLocalPayExpenses
                        authrztn={authrztn}
                        setId={setId}
                        setIdToAdd={setIdToAdd}
                        setEdit={setEdit}
                        setRoute={setRoute}
                      />
                    )}
                  </Roles>
                }
              />
              <Route
                path="/accounting/view-expenses/:id"
                element={
                  <Roles>
                    {({ authrztn }) => <ViewExpensess authrztn={authrztn} />}
                  </Roles>
                }
              />

              <Route path="/accounting/create-loan" element={<CreateLoan />} />
              <Route
                path="/accounting/create-lending"
                element={<CreateLending />}
              />
              <Route
                path="/accounting/create-asset-account"
                element={<CreateAssetAccount />}
              />
              <Route
                path="/accounting/create-liability"
                element={<CreateLiability />}
              />
              <Route
                path="/accounting/create-fixed-assets"
                element={<CreateAssets />}
              />
              <Route
                path="/accounting/create-equity"
                element={<CreateEquity />}
              />

              <Route path="/accounting/payloan/:id" element={<PayLoan />} />
              <Route path="/accounting/paylend/:id" element={<PayLend />} />
              {/* Accounting */}
              <Route
                path="/accounting/fixedAsset"
                element={
                  <Roles>
                    {({ authrztn }) => <FixedAsset authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/accounting/fixedAsset/:id"
                element={
                  <Roles>
                    {({ authrztn }) => <FixedAssetUpdate authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route path="/accounting/payequity/:id" element={<PayEquity />} />

              {/* TAx Mangement modules */}
              <Route
                path="/taxmngnt/tax-settings"
                element={
                  <Roles>
                    {({ authrztn }) => <TaxSettings authrztn={authrztn} />}
                  </Roles>
                }
              />

              <Route
                path="/taxmngnt/tax-settings-add/:id"
                element={
                  <Roles>
                    {({ authrztn }) => <TaxSettingsAdd authrztn={authrztn} />}
                  </Roles>
                }
              />

              {/* Content Mangement modules */}
              <Route
                path="/content/label-management"
                element={
                  <Roles>
                    {({ authrztn }) => <LableManagement authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/content/expenses2"
                element={
                  <Roles>
                    {({ authrztn }) => <Expenses2 authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/content/expenses1"
                element={
                  <Roles>
                    {({ authrztn }) => <Expenses1 authrztn={authrztn} />}
                  </Roles>
                }
              />

              {/* Settings modules */}
              <Route
                path="/settings/currency"
                element={
                  <Roles>
                    {({ authrztn }) => <Currency authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/settings/branches"
                element={
                  <Roles>
                    {({ authrztn }) => <Branches authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/settings/user-management"
                element={
                  <Roles>
                    {({ authrztn }) => <User authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/settings/access-control"
                element={
                  <Roles>
                    {({ authrztn }) => <AccessControl authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/settings/in-app-notification"
                element={
                  <Roles>
                    {({ authrztn }) => (
                      <InAppNotification authrztn={authrztn} />
                    )}
                  </Roles>
                }
              />

              {/* LION CHEM START */}
              <Route
                path="/settings/packaging"
                element={
                  <Roles>
                    {({ authrztn }) => <Packaging authrztn={authrztn} />}
                  </Roles>
                }
              />
              {/* LION CHECM END */}
              {/* settings end */}

              {/* Activity Loog */}

              <Route
                path="/activity-log"
                element={
                  <Roles>
                    {({ authrztn }) => <ActivityLog authrztn={authrztn} />}
                  </Roles>
                }
              />

              {/* Sub folder */}
              <Route path="/settings/create-rbac" element={<CreateRbac />} />
              <Route
                path="/settings/update-rbac/:id"
                element={
                  <Roles>
                    {({ authrztn }) => <UpdateRbac authrztn={authrztn} />}
                  </Roles>
                }
              />

              {/* Settins module end */}

              {/* Add other routes here */}

              {/* Reports Module */}
              {/* Statement reports */}
              <Route
                path="/reports/statement/balance-sheet"
                element={<BalanceSheet />}
              />
              <Route
                path="/reports/statement/production-loss"
                element={<ProductionLoss />}
              />
              <Route
                path="/reports/statement/expenses-report"
                element={<ExpensesReport />}
              />
              <Route
                path="/reports/statement/income-profit"
                element={<IncomeProfit />}
              />
              <Route
                path="/reports/statement/income-profit-branch"
                element={<IncomeProfitBranches />}
              />
              <Route
                path="/reports/statement/income-profit-client"
                element={<IncomeProfitClient />}
              />
              {/* <Route
                path="/reports/statement/boss-report"
                element={<BossReport />}
              /> */}

              <Route
                path="/reports/general/boss-report"
                element={
                  <Roles>
                    {({ authrztn }) => <BossReport authrztn={authrztn} />}
                  </Roles>
                }
              />
              {/* Statement reports end */}
              {/* audit report */}
              <Route
                path="/reports/audit/journal-list"
                element={<JournalListReport />}
              />
              <Route
                path="/reports/audit/trial-balance"
                element={<TrialBalance />}
              />
              {/* audit report end */}
              {/* Inventory report */}
              <Route
                path="/reports/inventory-report"
                element={<InventoryReport />}
              />
              {/* Inventory report end */}

              {/* General Reports */}
              <Route
                path="/reports/general/po-reports"
                element={<ReportsSupplier />}
              />
              <Route
                path="/reports/general/sales-reports"
                element={<SalesReport />}
              />
              {/* General Reports end */}

              {/* Business Partner Report */}
              <Route
                path="/reports/business-partner/receiving-reports"
                element={<ReceivingReport />}
              />
              <Route
                path="/reports/business-partner/payable"
                element={<PayableReport />}
              />
              {/* Business Partner Report end*/}

              {/* new report*/}
              <Route
                path="/reports/new-report/balance_sheet"
                element={
                  <Roles>
                    {({ authrztn }) => <BalanceSheet1 authrztn={authrztn} />}
                  </Roles>
                }
              />

              <Route
                path="/reports/new-report/balance_sheet/:module/:id/:fromdate/:todate"
                element={<BalanceSheet1 />}
              />
              <Route
                path="/reports/new-report/inventory_report"
                element={
                  <Roles>
                    {({ authrztn }) => <InventoryReport1 authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/reports/new-report/inventory_report/:module/:id/:fromdate/:todate"
                element={<InventoryReport1 />}
              />

              <Route
                path="/reports/new-report/production_report"
                element={
                  <Roles>
                    {({ authrztn }) => (
                      <ProductionReport1 authrztn={authrztn} />
                    )}
                  </Roles>
                }
              />

              <Route
                path="/reports/new-report/expenses_report"
                element={
                  <Roles>
                    {({ authrztn }) => <ExpensesReport1 authrztn={authrztn} />}
                  </Roles>
                }
              />

              <Route
                path="/reports/new-report/income_report"
                element={
                  <Roles>
                    {({ authrztn }) => <IncomeReport1 authrztn={authrztn} />}
                  </Roles>
                }
              />

              <Route
                path="/reports/new-report/sales_report"
                element={
                  <Roles>
                    {({ authrztn }) => <SalesReport1 authrztn={authrztn} />}
                  </Roles>
                }
              />

              <Route
                path="/reports/new-report/purchase_report"
                element={
                  <Roles>
                    {({ authrztn }) => <PurchaseReport1 authrztn={authrztn} />}
                  </Roles>
                }
              />

              <Route
                path="/reports/new-report/trial_balance"
                element={
                  <Roles>
                    {({ authrztn }) => <TrialBalance1 authrztn={authrztn} />}
                  </Roles>
                }
              />

              <Route
                path="/reports/new-report/profit_loss"
                element={
                  <Roles>
                    {({ authrztn }) => <ProfitLoss authrztn={authrztn} />}
                  </Roles>
                }
              />

              {/* Reports Module End*/}

              <Route path="/pdf-view" element={<PDFViewerPage />} />
              <Route
                path="/invoice-pdf-view"
                element={<InvoicePDFViewerPage />}
              />

              <Route
                path="/migration"
                element={
                  <Roles>
                    {({ authrztn }) => <Migration authrztn={authrztn} />}
                  </Roles>
                }
              />
            </Routes>
          </div>
        </div>
      </div>
    </ProtectedRoutes>
  );
};

export default App;
