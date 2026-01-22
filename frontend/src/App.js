import { React, useEffect } from "react";
import {
  Route,
  BrowserRouter as Router,
  Routes,
  useLocation,
} from "react-router-dom";

// css

import ProtectedRoutes from "./hooks/protectedRoutes";
import Roles from "./hooks/roles";
import AccountList from "./modules/Accounts/account-list";
import Collection from "./modules/Accounts/collection";
import ViewAccountList from "./modules/Accounts/Sub Folder/view-account-list";
import Expenses1 from "./modules/ContentManagement/expenses1";
import Expenses2 from "./modules/ContentManagement/expenses2";

import LableManagement from "./modules/ContentManagement/labelmanagement";
import Customer from "./modules/Customer/Customer";

import CustomerCreate from "./modules/Customer/CustomerCreate";
import CustomerUpdate from "./modules/Customer/CustomerUpdate";
import CustomerPurchaseHistory from "./modules/Customer/CustomerPurchaseHistory";

import Dashboard from "./modules/Dashboard/dashboard";
import ProductList from "./modules/Inventory/product-list";

import CreateProduct from "./modules/Inventory/Sub Folder/create-product";
import UpdateProduct from "./modules/Inventory/Sub Folder/update-product";
import Login from "./modules/Login/login";
import Navbar from "./modules/Navbar/navbar";
import LocalPurchase from "./modules/purchases/Local_purchase";
import OverseasPurchase from "./modules/purchases/Overseas_purchase";
import Payable from "./modules/purchases/Payable";
import BulkPayable from "./modules/purchases/Sub Folder/BulkPayable";
import PayableCopy from "./modules/purchases/Sub Folder/copy/PayableCopy";
import CreatePayable from "./modules/purchases/Sub Folder/createPayable";
import PayablePayment from "./modules/purchases/Sub Folder/payablePayment";
import VendorUpdate from "./modules/purchases/Sub Folder/updateVendor";
import ViewBulkPayable from "./modules/purchases/Sub Folder/ViewBulkPayable";
import Vendor from "./modules/purchases/vendors";

import InvoiceCopy from "./modules/Sales/Sub Folder/copy/Invoice-copy";
import Branches from "./modules/Settings/Branches";
import Currency from "./modules/Settings/currency";
import GeneralSettings from "./modules/Settings/GeneralSettings.jsx";
import User from "./modules/Settings/UserManagement";
import Sidebar from "./modules/Sidebar/sidebar";

import Productions from "./modules/Inventory/Productions";
import ProductionsForm from "./modules/Inventory/Sub Folder/productions-form";
import LocalCollection from "./modules/Sales/Local_collection";
import OverseasCollection from "./modules/Sales/Overseas_collection";
import BulkCollection from "./modules/Sales/Sub Folder/BulkCollection";
import OverseasBulkCollection from "./modules/Sales/Sub Folder/OverseasBulkCollections";
import ViewBulkCollections from "./modules/Sales/Sub Folder/ViewBulkCollection";
import ViewOverseasBulkCollection from "./modules/Sales/Sub Folder/ViewOverseasBulkCollection";
import RawMaterialUpdate from "./modules/StockManagement/RawMaterialUpdate";
import StockManagement from "./modules/StockManagement/StockManagement";
import StockReturnList from "./modules/StockManagement/Sub Folder/StockReturnList";

import Cashflow from "./modules/Accounting/Cash_flow";
import Expenses from "./modules/Accounting/Expenses";
import Loan from "./modules/Accounting/Loan";
import LocalExpenses from "./modules/Accounting/localExpenses";
import OverseasExpenses from "./modules/Accounting/overseasExpenses";
import AddExpenses from "./modules/Accounting/Sub Folder/addExpenses";
import ExpensesCopy from "./modules/Accounting/Sub Folder/copy/ExpensesCopy";
import LocalBulkExpenses from "./modules/Accounting/Sub Folder/payLocalExpenses";
import ViewExpensess from "./modules/Accounting/Sub Folder/viewExpensess";
import ViewLocalPayExpenses from "./modules/Accounting/Sub Folder/viewPayLocalExpenses";
import Wheel from "./modules/Accounting/Sub Folder/wheel";
import IssuedCheckAccount from "./modules/Accounts/issued-check-account";
import InventoryCounting from "./modules/Inventory/Inventory-counting";
import CountingCreate from "./modules/Inventory/Sub Folder/countingCreate";
import InveotoryCountingUpdate from "./modules/Inventory/Sub Folder/countingUpdate";
import OtherIncome from "./modules/Sales/Other_Income";
// import LoanInformation from "./modules/Accounting/Sub Folder/LoanInformation";
import Cutoff from "./modules/Accounting/Cutoff";
import Lending from "./modules/Accounting/Lending";
import Equity2 from "./modules/Accounting/Owners-Equity2";
import Equity from "./modules/Accounting/OwnersEquity";
import ReturnEarnings from "./modules/Accounting/ReturnEarnings";
import CreateAssets from "./modules/Accounting/Sub Folder/createAssets";
import CreateEquity from "./modules/Accounting/Sub Folder/createEquity";
import CreateLending from "./modules/Accounting/Sub Folder/createLending";
import CreateLoan from "./modules/Accounting/Sub Folder/createLoan";
import PayEquity from "./modules/Accounting/Sub Folder/payEquity";
import PayLend from "./modules/Accounting/Sub Folder/payLend";
import PayLoan from "./modules/Accounting/Sub Folder/payLoan";
import ViewCutoff from "./modules/Accounting/Sub Folder/viewCutoff";
import ViewEarnings from "./modules/Accounting/Sub Folder/viewEarnings";
import BankBudgeting from "./modules/Accounts/bank-budgeting";
import BankTransaction from "./modules/BankTransaction/BankTransaction";
import FixedAsset from "./modules/FixedAsset/FixedAsset";
import FixedAssetUpdate from "./modules/FixedAsset/FixedAssetUpdate";
import BatchEntry from "./modules/Inventory/Batch Entry/batchEntry.jsx";
import StockTransfer from "./modules/Inventory/Stock_transfer";
import ApprovalStockTransfer from "./modules/Inventory/Sub Folder/ApprovalStockTransfer";
import CreateStockTransfer from "./modules/Inventory/Sub Folder/createStockTransfer";
import AddOtherIncome from "./modules/Sales/Sub Folder/addOtherIncome";
import UpdateInvoice from "./modules/Sales/Sub Folder/updateInvoice";
import ViewOtherIncome from "./modules/Sales/Sub Folder/viewOtherIncome";
import AccessControl from "./modules/Settings/Access_control";
import InAppNotification from "./modules/Settings/App-notification";
import CreateRbac from "./modules/Settings/Sub Folder/create_rbac";
import UpdateRbac from "./modules/Settings/Sub Folder/update-rbac";
// Reports
// Statement Reports
import BalanceSheet from "./modules/Reports/Statements Reports/Balance_sheet";
import BossReport from "./modules/Reports/Statements Reports/Boss_report";
import ExpensesReport from "./modules/Reports/Statements Reports/Expenses_report";
import IncomeProfit from "./modules/Reports/Statements Reports/Income_profit";
import IncomeProfitBranches from "./modules/Reports/Statements Reports/Income_profit_branch";
import IncomeProfitClient from "./modules/Reports/Statements Reports/income_profit_client";

// Audit Reports
import JournalListReport from "./modules/Reports/Audit Reports/Journal_list_report";
import TrialBalance from "./modules/Reports/Audit Reports/Trial_balance";

// Inventory Reports
import InventoryReport from "./modules/Reports/Inventory Reports/Inventory_reports";

// General Reports
import ReportsSupplier from "./modules/Reports/General Reports/Report_supplier";
import SalesReport from "./modules/Reports/General Reports/Sales_report";

// Business Partner Report
import PayableReport from "./modules/Reports/Business Partner Report/Payable_report";
import ReceivingReport from "./modules/Reports/Business Partner Report/Receiving_report";

// Forgot password
import ChangePassword from "./modules/Forgot Password/change-password";
import ForgotPassword from "./modules/Forgot Password/forgot-password";
import OTP from "./modules/Forgot Password/otp";

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
import ActivityLog from "./modules/ActivityLog/ActivityLog";
import BalanceSheet1 from "./modules/Reports/Enhancement Reports/balance_sheet";
import ExpensesReport1 from "./modules/Reports/Enhancement Reports/expenses_report";
import IncomeReport1 from "./modules/Reports/Enhancement Reports/income_report";
import InventoryReport1 from "./modules/Reports/Enhancement Reports/inventory_report";
import ProductionReport1 from "./modules/Reports/Enhancement Reports/production_report";
import ProfitLoss from "./modules/Reports/Enhancement Reports/profit_loss";
import PurchaseReport1 from "./modules/Reports/Enhancement Reports/purchase_report";
import SalesReport1 from "./modules/Reports/Enhancement Reports/sales_report";
import TrialBalance1 from "./modules/Reports/Enhancement Reports/trial_balance";

import PDFViewerPage from "./modules/purchases/Sub Folder/PDFViewerPage";
import InvoicePDFViewerPage from "./modules/Sales/Sub Folder/InvoicePDFViewerPage";

// ### LION CHEM ###

//sales
import Sales_Invoice_create_update from "./modules/Sales/LionChem/sales_add_update.jsx";
import Sales_invoice from "./modules/Sales/LionChem/sales_invoice.jsx";
import SampleProduct from "./modules/Sales/SampleProduct.jsx";
import SampleProductCreate from "./modules/Sales/Sub Folder/SampleProductCreate.jsx";
import SampleProductView from "./modules/Sales/Sub Folder/SampleProductView.jsx";

// purchase
import Purchase_request from "./modules/purchases/Purchase_request.jsx";
import Purchase_request_create from "./modules/purchases/Sub Folder/Purchase_request_create.jsx";
import Purchase_request_update from "./modules/purchases/Sub Folder/Purchase_request_update.jsx";
import Purchase_request_view from "./modules/purchases/Sub Folder/Purchase_request_view.jsx";

import PurchaseOrder from "./modules/purchases/Purchase_order.jsx";
import PurchaseOrderList from "./modules/purchases/Sub Folder/Purchase_order_list.jsx";
import PurchaseOrderView from "./modules/purchases/Sub Folder/Purchase_order_view.jsx";

import Receiving from "./modules/purchases/Receiving.jsx";
import Receiving_view from "./modules/purchases/Sub Folder/Receiving_view.jsx";

import PurchaseOrderPDF from "./modules/purchases/Sub Folder/Purchase_order_pdf.jsx";

// settings
import Mixer from "./modules/ContentManagement/mixer.jsx";
import Parameters from "./modules/ContentManagement/parameters.jsx";
import PhysicalCategory from "./modules/ContentManagement/Sub Folder/physicalcategory.jsx";
import Source from "./modules/ContentManagement/source.jsx";
import BatchEntryCreateUpdate from "./modules/Inventory/Batch Entry/batchCreateUpdate.jsx";
// import BatchEntryReprint from "./modules/Inventory/Batch Entry/batchReprint.jsx";
import BatchTicketReprint from "./modules/Inventory/Sub Folder/batch-ticket-reprint.jsx";

import CreateUpdateFormulation from "./modules/Inventory/Formulation/create-update-formulation.jsx";
import DuplicateFormulation from "./modules/Inventory/Formulation/duplicate-formulation.jsx";

// import CreateUpdateFormulation2 from "./modules/Inventory/Formulation/create-update-formulation2.jsx";

import Formulation from "./modules/Inventory/Formulation/formulation.jsx";
import CompanyProfile from "./modules/Settings/CompanyProfile.jsx";
import Packaging from "./modules/Settings/packaging.jsx";
import TaxSettings from "./modules/Tax Management/Tax Settings/tax_settings.jsx";
import TaxSettingsAdd from "./modules/Tax Management/Tax Settings/Tax_settings_add.jsx";
import TaxReport from "./modules/Tax Management/Tax Report/TaxReport.jsx";

// delivery management
import DeliveryPDF from "./modules/Delivery Management/DeliveryPDF.jsx";
import ReturnProducts from "./modules/Delivery Management/ReturnProducts.jsx";
import Schedule from "./modules/Delivery Management/Schedule.jsx";
import ReturnProductDetails from "./modules/Delivery Management/Sub Folder/ReturnProductDetails.jsx";
import ReturnProductDetails_Update from "./modules/Delivery Management/Sub Folder/ReturnProductDetails_Update.jsx";
import ScheduleList from "./modules/Delivery Management/Sub Folder/ScheduleList.jsx";

// post production
import PostProduction from "./modules/Inventory/Post Production/PostProduction.jsx";
import ProductionLoss from "./modules/Inventory/Post Production/ProductionLoss.jsx";

// batch entry revised
import BatchEntry2 from "./modules/Inventory/batch-entry.jsx";
import CreateBatchEntry from "./modules/Inventory/Sub Folder/create-batch-entry.jsx";
import ViewBatchEntry from "./modules/Inventory/Sub Folder/view-batch-entry.jsx";

// ### LION CHEM END ###

function App() {
  // useEffect(() => {
  //   const handleContextMenu = (e) => {
  //     e.preventDefault();
  //     console.log("Blocked: Right-click (context menu)");
  //   };

  //   const handleKeyDown = (e) => {
  //     if (e.key === "F12") {
  //       e.preventDefault();
  //       console.log("Blocked: F12 (DevTools)");
  //     }

  //     if (e.ctrlKey && e.shiftKey && e.key === "I") {
  //       e.preventDefault();
  //       console.log("Blocked: Ctrl+Shift+I (DevTools)");
  //     }

  //     if (e.ctrlKey && e.shiftKey && e.key === "J") {
  //       e.preventDefault();
  //       console.log("Blocked: Ctrl+Shift+J (Console)");
  //     }

  //     if (e.ctrlKey && e.key === "U") {
  //       e.preventDefault();
  //       console.log("Blocked: Ctrl+U (View Source)");
  //     }
  //   };

  //   document.addEventListener("contextmenu", handleContextMenu);
  //   document.addEventListener("keydown", handleKeyDown);

  //   return () => {
  //     document.removeEventListener("contextmenu", handleContextMenu);
  //     document.removeEventListener("keydown", handleKeyDown);
  //   };
  // }, []);

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
          <Roles>{(authrztn) => <Sidebar authrztn={authrztn} />}</Roles>
        )}
        <div className="flex-grow-1 d-flex flex-column">
          {!hideSidebarAndPadding && (
            <Roles>{(authrztn) => <Navbar authrztn={authrztn} />}</Roles>
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
                    {(authrztn) => <Parameters authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/content/parameters/physical-category"
                element={
                  <Roles>
                    {(authrztn) => <PhysicalCategory authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/content/source"
                element={
                  <Roles>{(authrztn) => <Source authrztn={authrztn} />}</Roles>
                }
              />
              <Route
                path="/content/mixer"
                element={
                  <Roles>{(authrztn) => <Mixer authrztn={authrztn} />}</Roles>
                }
              />
              {/* LION CHEM END */}
              {/* dashboard */}
              <Route
                path="/dashboard"
                element={
                  <Roles>
                    {(authrztn, roleType) => (
                      <Dashboard authrztn={authrztn} roleType={roleType} />
                    )}
                  </Roles>
                }
              />
              {/* Sales modules */}
              <Route
                path="/sales/local-collections"
                element={
                  <Roles>
                    {(authrztn, roleType) => (
                      <LocalCollection
                        authrztn={authrztn}
                        roleType={roleType}
                      />
                    )}
                  </Roles>
                }
              />
              <Route
                path="/sales/overseas-collections"
                element={
                  <Roles>
                    {(authrztn, roleType) => (
                      <OverseasCollection
                        authrztn={authrztn}
                        roleType={roleType}
                      />
                    )}
                  </Roles>
                }
              />
              <Route
                path="/sales/customers"
                element={
                  <Roles>
                    {(authrztn) => <Customer authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/sales/customers/create"
                element={<CustomerCreate />}
              />
              {/* <Route
                path="/sales/customers/update/:id"
                element={
                  <Roles>
                    {(authrztn) => <CustomerUpdate authrztn={authrztn} />}
                  </Roles>
                }
              /> */}
              <Route
                path="/initUpdate/:id"
                element={
                  <Roles>
                    {(authrztn, roleType) => (
                      <CustomerUpdate authrztn={authrztn} roleType={roleType} />
                    )}
                  </Roles>
                }
              />
              <Route
                path="/sales/customer-purchase-history/:id"
                element={
                  <Roles>
                    {(authrztn, roleType) => (
                      <CustomerPurchaseHistory
                        authrztn={authrztn}
                        roleType={roleType}
                      />
                    )}
                  </Roles>
                }
              />
              {/* yilluja */}
              {/* <Route
                path="/sales/invoices"
                element={
                  <Roles>{(authrztn) => <Invoice authrztn={authrztn} />}</Roles>
                }
              /> */}
              {/* lionchem */}
              <Route
                path="/sales/invoices"
                element={
                  <Roles>
                    {(authrztn, roleType, rbacUserRole) => (
                      <Sales_invoice
                        authrztn={authrztn}
                        roleType={roleType}
                        rbacUserRole={rbacUserRole}
                      />
                    )}
                  </Roles>
                }
              />
              <Route
                path="/sales/create-invoice-update"
                element={
                  <Roles>
                    {(authrztn, roleType) => (
                      <Sales_Invoice_create_update roleType={roleType} />
                    )}
                  </Roles>
                }
              />
              <Route
                path="/sales/create-invoice-update/:id"
                element={
                  <Roles>
                    {(authrztn, roleType) => (
                      <Sales_Invoice_create_update roleType={roleType} />
                    )}
                  </Roles>
                }
              />
              <Route
                path="/sales/sample-product"
                element={
                  <Roles>
                    {(authrztn) => <SampleProduct authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/sales/create-sample-product"
                element={
                  <Roles>
                    {(authrztn) => <SampleProductCreate authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/sales/view-sample-product/:id"
                element={
                  <Roles>
                    {(authrztn) => <SampleProductView authrztn={authrztn} />}
                  </Roles>
                }
              />
              {/* para sa notification to na magredirect sa copy na invoice module */}
              <Route
                path="/sales/invoices-copy/:id"
                element={
                  <Roles>
                    {(authrztn) => <InvoiceCopy authrztn={authrztn} />}
                  </Roles>
                }
              />
              {/* Sales Sub Folder */}
              <Route
                path="/sales/local-bulk-collection"
                element={
                  <Roles>
                    {(authrztn, roleType) => (
                      <BulkCollection authrztn={authrztn} roleType={roleType} />
                    )}
                  </Roles>
                }
              />
              <Route
                path="/sales/overseas-bulk-collection"
                element={
                  <Roles>
                    {(authrztn, roleType) => (
                      <OverseasBulkCollection
                        authrztn={authrztn}
                        roleType={roleType}
                      />
                    )}
                  </Roles>
                }
              />
              <Route
                path="/sales/view-local-bulk-collection/:id"
                element={
                  <Roles>
                    {(authrztn) => <ViewBulkCollections authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/sales/view-overseas-bulk-collection/:id"
                element={
                  <Roles>
                    {(authrztn) => (
                      <ViewOverseasBulkCollection authrztn={authrztn} />
                    )}
                  </Roles>
                }
              />
              {/* <Route path="/sales/create-invoice" element={<CreateInvoice />} /> */}
              <Route
                path="/sales/invoice-update/:id"
                element={
                  <Roles>
                    {(authrztn) => <UpdateInvoice authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/accounts/other-income"
                element={
                  <Roles>
                    {(authrztn, roleType) => (
                      <OtherIncome authrztn={authrztn} roleType={roleType} />
                    )}
                  </Roles>
                }
              />
              <Route
                path="/accounts/add-otherIncome"
                element={
                  <Roles>
                    {(authrztn, roleType) => (
                      <AddOtherIncome authrztn={authrztn} roleType={roleType} />
                    )}
                  </Roles>
                }
              />
              <Route
                path="/accounts/viewOtherIncome/:id"
                element={
                  <Roles>
                    {(authrztn, roleType) => (
                      <ViewOtherIncome
                        authrztn={authrztn}
                        roleType={roleType}
                      />
                    )}
                  </Roles>
                }
              />
              {/* Purchases modules */}
              {/* ### lion chem ### */}
              <Route
                path="/Purchases/purchase-request"
                element={
                  <Roles>
                    {(authrztn, roleType) => (
                      <Purchase_request
                        authrztn={authrztn}
                        roleType={roleType} // Add roleType prop
                      />
                    )}
                  </Roles>
                }
              />
              {/* create purchase request */}
              <Route
                path="/Purchases/create-purchase-request"
                element={
                  <Roles>
                    {(authrztn, roleType) => (
                      <Purchase_request_create
                        authrztn={authrztn}
                        roleType={roleType} // Add roleType prop
                      />
                    )}
                  </Roles>
                }
              />
              <Route
                path="/Purchases/update-purchase-request/:id"
                element={
                  <Roles>
                    {(authrztn, roleType) => (
                      <Purchase_request_update
                        authrztn={authrztn}
                        roleType={roleType} // Add roleType prop
                      />
                    )}
                  </Roles>
                }
              />
              <Route
                path="/Purchases/view-purchase-request/:id"
                element={
                  <Roles>
                    {(authrztn, roleType) => (
                      <Purchase_request_view
                        authrztn={authrztn}
                        roleType={roleType} // Add roleType prop
                      />
                    )}
                  </Roles>
                }
              />
              {/* Purchase Order */}
              <Route
                path="/Purchases/purchase-order"
                element={
                  <Roles>
                    {(authrztn, roleType) => (
                      <PurchaseOrder
                        authrztn={authrztn}
                        roleType={roleType} // Add roleType prop
                      />
                    )}
                  </Roles>
                }
              />
              <Route
                path="/Purchases/purchase-order-view/:id"
                element={
                  <Roles>
                    {(authrztn, roleType) => (
                      <PurchaseOrderView
                        authrztn={authrztn}
                        roleType={roleType} // Add roleType prop
                      />
                    )}
                  </Roles>
                }
              />
              <Route
                path="/Purchases/purchase-order-list/:id"
                element={
                  <Roles>
                    {(authrztn, roleType) => (
                      <PurchaseOrderList
                        authrztn={authrztn}
                        roleType={roleType} // Add roleType prop
                      />
                    )}
                  </Roles>
                }
              />
              <Route
                path="/purchase-order-pdf"
                element={<PurchaseOrderPDF />}
              />
              {/* Purchase Order End */}
              {/* Receiving */}
              <Route
                path="/purchases/receiving"
                element={
                  <Roles>
                    {(authrztn, roleType) => (
                      <Receiving
                        authrztn={authrztn}
                        roleType={roleType} // Add roleType prop
                      />
                    )}
                  </Roles>
                }
              />
              <Route
                path="/Purchases/receiving-view/:id"
                element={
                  <Roles>
                    {(authrztn, roleType) => (
                      <Receiving_view
                        authrztn={authrztn}
                        roleType={roleType} // Add roleType prop
                      />
                    )}
                  </Roles>
                }
              />
              {/* Receiving end */}
              {/* ### lion chem end ### */}
              <Route
                path="/Purchases/vendors"
                element={
                  <Roles>{(authrztn) => <Vendor authrztn={authrztn} />}</Roles>
                }
              />
              <Route
                path="/Purchases/Payable"
                element={
                  <Roles>
                    {(authrztn, roleType) => (
                      <Payable authrztn={authrztn} roleType={roleType} />
                    )}
                  </Roles>
                }
              />
              <Route
                path="/Purchases/Payable-copy/:id"
                element={
                  <Roles>
                    {(authrztn) => <PayableCopy authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/Purchases/local-purchase"
                element={
                  <Roles>
                    {(authrztn) => <LocalPurchase authrztn={authrztn} />}
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
                    {(authrztn) => <ViewBulkPayable authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/Purchases/overseas-purchase"
                element={
                  <Roles>
                    {(authrztn) => <OverseasPurchase authrztn={authrztn} />}
                  </Roles>
                }
              />
              {/* Purchases Sub Folder */}
              <Route
                path="/Purchases/create_payable"
                element={
                  <Roles>
                    {(authrztn, roleType) => (
                      <CreatePayable
                        authrztn={authrztn}
                        roleType={roleType} // Add roleType prop
                      />
                    )}
                  </Roles>
                }
              />
              <Route
                path="/Purchases/purchase-pay/:id"
                element={
                  <Roles>
                    {(authrztn) => <PayablePayment authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/purchases/vendor-update/:id"
                element={
                  <Roles>
                    {(authrztn, roleType) => (
                      <VendorUpdate
                        authrztn={authrztn}
                        roleType={roleType} // Add roleType prop
                      />
                    )}
                  </Roles>
                }
              />
              {/* Accounts */}
              <Route
                path="/accounts/outstanding-check"
                element={
                  <Roles>
                    {(authrztn, roleType) => (
                      <Collection authrztn={authrztn} roleType={roleType} />
                    )}
                  </Roles>
                }
              />
              <Route
                path="/accounts/account-list"
                element={
                  <Roles>
                    {(authrztn, roleType) => (
                      <AccountList authrztn={authrztn} roleType={roleType} />
                    )}
                  </Roles>
                }
              />
              <Route
                path="/accounts/issued-check-account"
                element={
                  <Roles>
                    {(authrztn, roleType) => (
                      <IssuedCheckAccount
                        authrztn={authrztn}
                        roleType={roleType}
                      />
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
                    {(authrztn, roleType) => (
                      <BankTransaction
                        authrztn={authrztn}
                        roleType={roleType}
                      />
                    )}
                  </Roles>
                }
              />
              <Route
                path="/accounts/bank-budgeting"
                element={
                  <Roles>
                    {(authrztn, roleType) => (
                      <BankBudgeting authrztn={authrztn} roleType={roleType} />
                    )}
                  </Roles>
                }
              />
              <Route
                path="/accounts/view-account-list/:id"
                element={
                  <Roles>
                    {(authrztn, roleType) => (
                      <ViewAccountList
                        authrztn={authrztn}
                        roleType={roleType}
                      />
                    )}
                  </Roles>
                }
              />
              <Route
                path="/accounts/account-list1"
                element={
                  <Roles>
                    {(authrztn, roleType) => (
                      <AccountList1 authrztn={authrztn} roleType={roleType} />
                    )}
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
                    {(authrztn, roleType) => (
                      <AssetAccountList1
                        authrztn={authrztn}
                        roleType={roleType}
                      />
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
                element={
                  <Roles>
                    {(authrztn, roleType) => (
                      <ViewAccountlist1
                        authrztn={authrztn}
                        roleType={roleType}
                      />
                    )}
                  </Roles>
                }
              />
              <Route
                path="/accounting/view-assetAccount/:id"
                element={
                  <Roles>
                    {(authrztn, roleType) => (
                      <ViewAccountlist1
                        authrztn={authrztn}
                        roleType={roleType}
                      />
                    )}
                  </Roles>
                }
              />
              <Route
                path="/accounting/view-liabilityAccount/:id"
                element={
                  <Roles>
                    {(authrztn, roleType) => (
                      <ViewAccountlist1
                        authrztn={authrztn}
                        roleType={roleType}
                      />
                    )}
                  </Roles>
                }
              />
              <Route
                path="/accounting/view-equityAccount/:id"
                element={
                  <Roles>
                    {(authrztn, roleType) => (
                      <ViewAccountlist1
                        authrztn={authrztn}
                        roleType={roleType}
                      />
                    )}
                  </Roles>
                }
              />
              {/* Inventory modules  */}
              <Route
                path="/inventory/batch-entry2"
                element={
                  <Roles>
                    {(authrztn) => <BatchEntry authrztn={authrztn} />}
                  </Roles>
                }
              />

              {/* revised batch entry */}
              <Route
                path="/inventory/batch-entry"
                element={
                  <Roles>
                    {(authrztn, roleType) => (
                      <BatchEntry2
                        authrztn={authrztn}
                        roleType={roleType} // Add roleType prop
                      />
                    )}
                  </Roles>
                }
              />

              <Route
                path="/inventory/create-batch-entry"
                element={
                  <Roles>
                    {(authrztn, roleType) => (
                      <CreateBatchEntry
                        authrztn={authrztn}
                        roleType={roleType}
                      />
                    )}
                  </Roles>
                }
              />

              <Route
                path="/inventory/view-batch-entry/:id"
                element={
                  <Roles>
                    {(authrztn, roleType) => (
                      <ViewBatchEntry authrztn={authrztn} roleType={roleType} />
                    )}
                  </Roles>
                }
              />

              <Route
                path="/inventory/view-batch-entry/:id/:postProduction"
                element={
                  <Roles>
                    {(authrztn, roleType) => (
                      <ViewBatchEntry authrztn={authrztn} roleType={roleType} />
                    )}
                  </Roles>
                }
              />

              <Route
                path="/inventory/batch-tickets-reprint"
                element={
                  <Roles>
                    {(authrztn) => <BatchTicketReprint authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/inventory/batch-entry-create-update"
                element={
                  <Roles>
                    {(authrztn) => (
                      <BatchEntryCreateUpdate authrztn={authrztn} />
                    )}
                  </Roles>
                }
              />
              <Route
                path="/inventory/batch-entry-create-update/:id"
                element={
                  <Roles>
                    {(authrztn) => (
                      <BatchEntryCreateUpdate authrztn={authrztn} />
                    )}
                  </Roles>
                }
              />
              <Route
                path="/inventory/batch-entry-create-update/:id/:post-production"
                element={
                  <Roles>
                    {(authrztn) => (
                      <BatchEntryCreateUpdate authrztn={authrztn} />
                    )}
                  </Roles>
                }
              />
              <Route
                path="/inventory/post-production"
                element={
                  <Roles>
                    {(authrztn) => <PostProduction authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/inventory/production-loss/:id"
                element={
                  <Roles>
                    {(authrztn) => <ProductionLoss authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/inventory/Productions"
                element={
                  <Roles>
                    {(authrztn) => <Productions authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/inventory/ProductionsView/:id"
                element={
                  <Roles>
                    {(authrztn) => <ProductionView authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/inventory/stock-management"
                element={
                  <Roles>
                    {(authrztn) => <StockManagement authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/inventory/stock-return-list"
                element={
                  <Roles>
                    {(authrztn) => <StockReturnList authrztn={authrztn} />}
                  </Roles>
                }
              />

              <Route
                path="/inventory/formulation"
                element={
                  <Roles>
                    {(authrztn) => <Formulation authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/inventory/create-update-formulation/:id"
                element={
                  <Roles>
                    {(authrztn) => (
                      <CreateUpdateFormulation authrztn={authrztn} />
                    )}
                  </Roles>
                }
              />
              {/* Add a new route specifically for creating formulations */}
              <Route
                path="/inventory/create-update-formulation"
                element={
                  <Roles>
                    {(authrztn) => (
                      <CreateUpdateFormulation authrztn={authrztn} />
                    )}
                  </Roles>
                }
              />
              {/* to be deleted */}
              {/* <Route
                path="/inventory/create-update-formulation2/:id"
                element={
                  <Roles>
                    {(authrztn) => (
                      <CreateUpdateFormulation2 authrztn={authrztn} />
                    )}
                  </Roles>
                }
              />
              <Route
                path="/inventory/create-update-formulation2"
                element={
                  <Roles>
                    {(authrztn) => (
                      <CreateUpdateFormulation2 authrztn={authrztn} />
                    )}
                  </Roles>
                }
              /> */}
              <Route
                path="/inventory/formulation/duplicate"
                element={
                  <Roles>
                    {(authrztn) => <DuplicateFormulation authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/inventory/product-list"
                element={
                  <Roles>
                    {(authrztn) => <ProductList authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/inventory/inventory-counting"
                element={
                  <Roles>
                    {(authrztn) => <InventoryCounting authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/inventory/inventory-counting-update/:id"
                element={
                  <Roles>
                    {(authrztn) => (
                      <InveotoryCountingUpdate authrztn={authrztn} />
                    )}
                  </Roles>
                }
              />
              <Route
                path="/inventory/stock-transfer"
                element={
                  <Roles>
                    {(authrztn) => <StockTransfer authrztn={authrztn} />}
                  </Roles>
                }
              />
              {/* inventory sub folder */}
              <Route
                path="/inventory/productions-form"
                element={
                  <Roles>
                    {(authrztn) => <ProductionsForm authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/inventory/create-product"
                element={
                  <Roles>
                    {(authrztn) => <CreateProduct authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/inventory/update-product/:id"
                element={
                  <Roles>
                    {(authrztn) => <UpdateProduct authrztn={authrztn} />}
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
                    {(authrztn) => <CreateStockTransfer authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/inventory/view-stock-transfer/:id"
                element={
                  <Roles>
                    {(authrztn) => (
                      <ApprovalStockTransfer authrztn={authrztn} />
                    )}
                  </Roles>
                }
              />
              {/* Delivery Mangement */}
              <Route
                path="/delivery-management/schedule"
                element={
                  <Roles>
                    {(authrztn) => <Schedule authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/delivery-management/schedule-list"
                element={
                  <Roles>
                    {(authrztn) => <ScheduleList authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/delivery-management/return-products"
                element={
                  <Roles>
                    {(authrztn) => <ReturnProducts authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/delivery-management/return-product-details"
                element={
                  <Roles>
                    {(authrztn) => <ReturnProductDetails authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/delivery-management/update-return-product-details/:id"
                element={
                  <Roles>
                    {(authrztn) => (
                      <ReturnProductDetails_Update authrztn={authrztn} />
                    )}
                  </Roles>
                }
              />
              <Route
                path="/delivery-management/delivery-pdf"
                element={
                  <Roles>
                    {(authrztn) => <DeliveryPDF authrztn={authrztn} />}
                  </Roles>
                }
              />
              {/* Accounting Modules */}
              <Route
                path="/accounting/expenses"
                element={
                  <Roles>
                    {(authrztn, roleType) => (
                      <Expenses authrztn={authrztn} roleType={roleType} />
                    )}
                  </Roles>
                }
              />
              <Route
                path="/accounting/expenses-copy/:id"
                element={
                  <Roles>
                    {(authrztn) => <ExpensesCopy authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/accounting/local-expenses"
                element={
                  <Roles>
                    {(authrztn, roleType) => (
                      <LocalExpenses authrztn={authrztn} roleType={roleType} />
                    )}
                  </Roles>
                }
              />
              <Route
                path="/accounting/overseas-expenses"
                element={
                  <Roles>
                    {(authrztn, roleType) => (
                      <OverseasExpenses
                        authrztn={authrztn}
                        roleType={roleType}
                      />
                    )}
                  </Roles>
                }
              />
              <Route
                path="/accounting/cash-flow"
                element={
                  <Roles>
                    {(authrztn, roleType) => (
                      <Cashflow authrztn={authrztn} roleType={roleType} />
                    )}
                  </Roles>
                }
              />
              <Route
                path="/accounting/loan"
                element={
                  <Roles>{(authrztn) => <Loan authrztn={authrztn} />}</Roles>
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
                    {(authrztn) => <AssetAccount authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/accounting/liabilities"
                element={
                  <Roles>
                    {(authrztn) => <Liabilities authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/accounting/equity"
                element={
                  <Roles>
                    {(authrztn, roleType) => (
                      <Equity authrztn={authrztn} roleType={roleType} />
                    )}
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
                  <Roles>{(authrztn) => <Cutoff authrztn={authrztn} />}</Roles>
                }
              />
              <Route
                path="/accounting/retained-earnings"
                element={
                  <Roles>
                    {(authrztn, roleType) => (
                      <ReturnEarnings authrztn={authrztn} roleType={roleType} />
                    )}
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
                    {(authrztn, roleType) => (
                      <Liabilities1 authrztn={authrztn} roleType={roleType} />
                    )}
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
                    {(authrztn, roleType) => (
                      <LocalBulkExpenses
                        authrztn={authrztn}
                        roleType={roleType}
                      />
                    )}
                  </Roles>
                }
              />
              <Route
                path="/accounting/view-pay-expenses/:foreign_url/:id"
                element={
                  <Roles>
                    {(authrztn, roleType) => (
                      <ViewLocalPayExpenses
                        authrztn={authrztn}
                        roleType={roleType}
                      />
                    )}
                  </Roles>
                }
              />
              <Route
                path="/accounting/view-expenses/:id"
                element={
                  <Roles>
                    {(authrztn) => <ViewExpensess authrztn={authrztn} />}
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
                element={
                  <Roles>
                    {(authrztn, roleType) => (
                      <CreateAssets authrztn={authrztn} roleType={roleType} />
                    )}
                  </Roles>
                }
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
                    {(authrztn, roleType) => (
                      <FixedAsset authrztn={authrztn} roleType={roleType} />
                    )}
                  </Roles>
                }
              />
              <Route
                path="/accounting/fixedAsset/:id"
                element={
                  <Roles>
                    {(authrztn) => <FixedAssetUpdate authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route path="/accounting/payequity/:id" element={<PayEquity />} />
              {/* TAx Mangement modules */}
              <Route
                path="/tax-management/tax-settings"
                element={
                  <Roles>
                    {(authrztn) => <TaxSettings authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/tax-management/tax-settings-add/:id"
                element={
                  <Roles>
                    {(authrztn) => <TaxSettingsAdd authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/tax-management/tax-report"
                element={
                  <Roles>
                    {(authrztn) => <TaxReport authrztn={authrztn} />}
                  </Roles>
                }
              />
              {/* Content Mangement modules */}
              <Route
                path="/content/label-management"
                element={
                  <Roles>
                    {(authrztn) => <LableManagement authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/content/expenses1"
                element={
                  <Roles>
                    {(authrztn) => <Expenses1 authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/content/expenses2"
                element={
                  <Roles>
                    {(authrztn) => <Expenses2 authrztn={authrztn} />}
                  </Roles>
                }
              />
              {/* Settings modules */}
              <Route
                path="/settings/general-settings"
                element={
                  <Roles>
                    {(authrztn) => <GeneralSettings authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/settings/currency"
                element={
                  <Roles>
                    {(authrztn) => <Currency authrztn={authrztn} />}
                  </Roles>
                }
              />

              <Route
                path="/settings/branches"
                element={
                  <Roles>
                    {(authrztn) => <Branches authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/settings/user-management"
                element={
                  <Roles>{(authrztn) => <User authrztn={authrztn} />}</Roles>
                }
              />
              <Route
                path="/settings/access-control"
                element={
                  <Roles>
                    {(authrztn) => <AccessControl authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/settings/in-app-notification"
                element={
                  <Roles>
                    {(authrztn) => <InAppNotification authrztn={authrztn} />}
                  </Roles>
                }
              />
              {/* LION CHEM START */}
              <Route
                path="/content/packaging"
                element={
                  <Roles>
                    {(authrztn) => <Packaging authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/settings/company-profile"
                element={
                  <Roles>
                    {(authrztn) => <CompanyProfile authrztn={authrztn} />}
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
                    {(authrztn) => <ActivityLog authrztn={authrztn} />}
                  </Roles>
                }
              />
              {/* Sub folder */}
              <Route path="/settings/create-rbac" element={<CreateRbac />} />
              <Route
                path="/settings/update-rbac/:id"
                element={<UpdateRbac />}
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
                    {(authrztn) => <BossReport authrztn={authrztn} />}
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
                    {(authrztn) => <BalanceSheet1 authrztn={authrztn} />}
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
                    {(authrztn) => <InventoryReport1 authrztn={authrztn} />}
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
                    {(authrztn) => <ProductionReport1 authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/reports/new-report/expenses_report"
                element={
                  <Roles>
                    {(authrztn) => <ExpensesReport1 authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/reports/new-report/income_report"
                element={
                  <Roles>
                    {(authrztn) => <IncomeReport1 authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/reports/new-report/sales_report"
                element={
                  <Roles>
                    {(authrztn) => <SalesReport1 authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/reports/new-report/purchase_report"
                element={
                  <Roles>
                    {(authrztn) => <PurchaseReport1 authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/reports/new-report/trial_balance"
                element={
                  <Roles>
                    {(authrztn) => <TrialBalance1 authrztn={authrztn} />}
                  </Roles>
                }
              />
              <Route
                path="/reports/new-report/profit_loss"
                element={
                  <Roles>
                    {(authrztn) => <ProfitLoss authrztn={authrztn} />}
                  </Roles>
                }
              />
              {/* Reports Module End*/}
              <Route path="/pdf-view" element={<PDFViewerPage />} />
              <Route
                path="/invoice-pdf-view"
                element={<InvoicePDFViewerPage />}
              />
            </Routes>
          </div>
        </div>
      </div>
    </ProtectedRoutes>
  );
};

export default App;
