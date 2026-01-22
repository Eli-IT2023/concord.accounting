import { jwtDecode } from "jwt-decode";
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "../../assets/css/style.css";
import ELI from "../../assets/img/ELI LOGO.png";
import Logo from "../../assets/img/logo.jpg";
import axios from "axios";
import BASE_URL from "../../assets/global/url";

const Sidebar = () => {
  const location = useLocation();
  const [userLoggedID, setUserLoggedID] = useState([]);

  // fetch logo from company profile
  const [settings, setSettings] = useState(null);

  // Fetch settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/CompanyProfile/fetchData`,
        );
        if (response.data.success) {
          setSettings(response.data.data); // logo is already base64 from backend
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };

    fetchSettings();
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const decodeToken = () => {
    var token = localStorage.getItem("accessToken");
    if (typeof token === "string") {
      var decoded = jwtDecode(token);
      // console.log("DECODED TOKEN:", decoded);
      setUserLoggedID(decoded.id);
    }
  };
  useEffect(() => {
    decodeToken();
  }, []);

  // sidebar btn
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Initial state set to closed
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen); // Toggles between true (open) and false (closed)
  };

  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [deliveryMngntOpen, setDeliveryMngntOpen] = useState(false);
  const [accountingOpen, setAccountingOpen] = useState(false);
  const [salesOpen, setSalesOpen] = useState(false);
  const [purchasesOpen, setPurchasesOpen] = useState(false);
  const [accountsOpen, setAccountsOpen] = useState(false);
  const [contentOpen, setContentOpen] = useState(false);
  const [taxMngntOpen, setTaxMngntOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [reportingOpen, setReportingOpen] = useState(false);
  const [statementReportsOpen, setStatementReportsOpen] = useState(false);
  const [auditReportsOpen, setAuditReportsOpen] = useState(false);
  const [businessPartnerReportsOpen, setBusinessPartnerReportsOpen] =
    useState(false);
  const [generalReportsOpen, setGeneralReportsOpen] = useState(false);
  const [newReportsOpen, setNewReportsOpen] = useState(false);

  useEffect(() => {
    // Check and open the submenu if the current path matches any of its links
    if (location.pathname.startsWith("/inventory")) {
      if (!location.pathname.startsWith("/reports/inventory-report")) {
        setInventoryOpen(true);
        setAccountingOpen(false);
        setSalesOpen(false);
        setPurchasesOpen(false);
        setReportingOpen(false);
        setStatementReportsOpen(false);
        setAuditReportsOpen(false);
        setBusinessPartnerReportsOpen(false);
        setGeneralReportsOpen(false);
        setAccountsOpen(false);
        setContentOpen(false);
        setSettingsOpen(false);

        setNewReportsOpen(false);
        setTaxMngntOpen(false);
        setDeliveryMngntOpen(false);
      }
    } else if (location.pathname.startsWith("/accounting")) {
      setAccountingOpen(true);
      setInventoryOpen(false);
      setSalesOpen(false);
      setPurchasesOpen(false);
      setReportingOpen(false);
      setStatementReportsOpen(false);
      setAuditReportsOpen(false);
      setBusinessPartnerReportsOpen(false);
      setGeneralReportsOpen(false);
      setContentOpen(false);
      setSettingsOpen(false);

      setNewReportsOpen(false);
      setTaxMngntOpen(false);
      setDeliveryMngntOpen(false);
    } else if (location.pathname.startsWith("/accounts")) {
      setAccountsOpen(true);
      setInventoryOpen(false);
      setSalesOpen(false);
      setPurchasesOpen(false);
      setReportingOpen(false);
      setStatementReportsOpen(false);
      setAuditReportsOpen(false);
      setBusinessPartnerReportsOpen(false);
      setGeneralReportsOpen(false);
      setAccountingOpen(false);
      setSettingsOpen(false);

      setNewReportsOpen(false);
      setTaxMngntOpen(false);
      setDeliveryMngntOpen(false);
    } else if (location.pathname.startsWith("/settings")) {
      setSettingsOpen(true);
      setAccountingOpen(false);
      setInventoryOpen(false);
      setSalesOpen(false);
      setPurchasesOpen(false);
      setReportingOpen(false);
      setStatementReportsOpen(false);
      setAuditReportsOpen(false);
      setBusinessPartnerReportsOpen(false);
      setGeneralReportsOpen(false);
      setAccountingOpen(false);

      setNewReportsOpen(false);
      setTaxMngntOpen(false);
      setDeliveryMngntOpen(false);
    } else if (location.pathname.startsWith("/delivery-management")) {
      setContentOpen(false);
      setAccountingOpen(false);
      setInventoryOpen(false);
      setSalesOpen(false);
      setPurchasesOpen(false);
      setReportingOpen(false);
      setStatementReportsOpen(false);
      setAuditReportsOpen(false);
      setBusinessPartnerReportsOpen(false);
      setGeneralReportsOpen(false);
      setSettingsOpen(false);

      setNewReportsOpen(false);
      setTaxMngntOpen(false);
      setDeliveryMngntOpen(true);
    } else if (location.pathname.startsWith("/tax-management")) {
      setContentOpen(false);
      setAccountingOpen(false);
      setInventoryOpen(false);
      setSalesOpen(false);
      setPurchasesOpen(false);
      setReportingOpen(false);
      setStatementReportsOpen(false);
      setAuditReportsOpen(false);
      setBusinessPartnerReportsOpen(false);
      setGeneralReportsOpen(false);
      setSettingsOpen(false);

      setNewReportsOpen(false);
      setTaxMngntOpen(true);
      setDeliveryMngntOpen(false);
    } else if (location.pathname.startsWith("/content")) {
      setContentOpen(true);
      setAccountingOpen(false);
      setInventoryOpen(false);
      setSalesOpen(false);
      setPurchasesOpen(false);
      setReportingOpen(false);
      setStatementReportsOpen(false);
      setAuditReportsOpen(false);
      setBusinessPartnerReportsOpen(false);
      setGeneralReportsOpen(false);
      setSettingsOpen(false);

      setNewReportsOpen(false);
      setTaxMngntOpen(false);
      setDeliveryMngntOpen(false);
    } else if (location.pathname.startsWith("/sales")) {
      setSalesOpen(true);
      setInventoryOpen(false);
      setAccountingOpen(false);
      setPurchasesOpen(false);
      setReportingOpen(false);
      setStatementReportsOpen(false);
      setAuditReportsOpen(false);
      setBusinessPartnerReportsOpen(false);
      setGeneralReportsOpen(false);
      setAccountsOpen(false);
      setContentOpen(false);
      setSettingsOpen(false);

      setNewReportsOpen(false);
      setTaxMngntOpen(false);
      setDeliveryMngntOpen(false);
    } else if (
      location.pathname.startsWith("/purchases") ||
      location.pathname.startsWith("/Purchases")
    ) {
      setPurchasesOpen(true);
      setInventoryOpen(false);
      setAccountingOpen(false);
      setSalesOpen(false);
      setReportingOpen(false);
      setStatementReportsOpen(false);
      setAuditReportsOpen(false);
      setBusinessPartnerReportsOpen(false);
      setGeneralReportsOpen(false);
      setAccountsOpen(false);
      setContentOpen(false);
      setSettingsOpen(false);

      setNewReportsOpen(false);
      setTaxMngntOpen(false);
      setDeliveryMngntOpen(false);
    } else if (location.pathname.startsWith("/reports")) {
      setReportingOpen(true);
      setInventoryOpen(false);
      setAccountingOpen(false);
      setSalesOpen(false);
      setPurchasesOpen(false);
      setTaxMngntOpen(false);
      if (location.pathname.startsWith("/reports/statement")) {
        setStatementReportsOpen(true);
        setAuditReportsOpen(false);
        setBusinessPartnerReportsOpen(false);
        setGeneralReportsOpen(false);
      } else if (location.pathname.startsWith("/reports/audit")) {
        setStatementReportsOpen(false);
        setAuditReportsOpen(true);
        setBusinessPartnerReportsOpen(false);
        setGeneralReportsOpen(false);
      } else if (location.pathname.startsWith("/reports/business-partner")) {
        setStatementReportsOpen(false);
        setAuditReportsOpen(false);
        setBusinessPartnerReportsOpen(true);
        setGeneralReportsOpen(false);
      } else if (location.pathname.startsWith("/reports/general")) {
        setStatementReportsOpen(false);
        setAuditReportsOpen(false);
        setBusinessPartnerReportsOpen(false);
        setGeneralReportsOpen(true);
      } else if (location.pathname.startsWith("/reports/new-report")) {
        setStatementReportsOpen(false);
        setAuditReportsOpen(false);
        setBusinessPartnerReportsOpen(false);
        setGeneralReportsOpen(false);

        setNewReportsOpen(true);
      } else {
        setStatementReportsOpen(false);
        setAuditReportsOpen(false);
        setBusinessPartnerReportsOpen(false);
        setGeneralReportsOpen(false);
      }
    } else {
      setInventoryOpen(false);
      setAccountingOpen(false);
      setSalesOpen(false);
      setPurchasesOpen(false);
      setReportingOpen(false);
      setStatementReportsOpen(false);
      setAuditReportsOpen(false);
      setBusinessPartnerReportsOpen(false);
      setGeneralReportsOpen(false);
      setAccountsOpen(false);
      setContentOpen(false);
      setSettingsOpen(false);

      setNewReportsOpen(false);
      setTaxMngntOpen(false);
      setDeliveryMngntOpen(false);
    }
  }, [location.pathname]);

  const toggleSubMenu = (subMenu) => {
    switch (subMenu) {
      case "inventory":
        setInventoryOpen(!inventoryOpen);
        setAccountingOpen(false);
        setSalesOpen(false);
        setPurchasesOpen(false);
        setReportingOpen(false);
        setStatementReportsOpen(false);
        setAuditReportsOpen(false);
        setBusinessPartnerReportsOpen(false);
        setGeneralReportsOpen(false);
        setAccountsOpen(false);
        setContentOpen(false);
        setSettingsOpen(false);

        setNewReportsOpen(false);
        setTaxMngntOpen(false);
        setDeliveryMngntOpen(false);
        break;
      case "accounting":
        setAccountingOpen(!accountingOpen);
        setInventoryOpen(false);
        setSalesOpen(false);
        setPurchasesOpen(false);
        setReportingOpen(false);
        setStatementReportsOpen(false);
        setAuditReportsOpen(false);
        setBusinessPartnerReportsOpen(false);
        setGeneralReportsOpen(false);
        setAccountsOpen(false);
        setContentOpen(false);
        setSettingsOpen(false);

        setNewReportsOpen(false);
        setTaxMngntOpen(false);
        setDeliveryMngntOpen(false);

        break;
      case "settings":
        setSettingsOpen(!settingsOpen);
        setAccountingOpen(false);
        setInventoryOpen(false);
        setSalesOpen(false);
        setPurchasesOpen(false);
        setReportingOpen(false);
        setStatementReportsOpen(false);
        setAuditReportsOpen(false);
        setBusinessPartnerReportsOpen(false);
        setGeneralReportsOpen(false);
        setAccountsOpen(false);
        setContentOpen(false);

        setNewReportsOpen(false);
        setTaxMngntOpen(false);
        setDeliveryMngntOpen(false);
        break;
      case "accounts":
        // Toggle accountsOpen to control visibility of Accounting tabs
        setAccountsOpen(!accountsOpen);
        setAccountingOpen(false); // Set accountingOpen based on accountsOpen state
        setInventoryOpen(false);
        setSalesOpen(false);
        setPurchasesOpen(false);
        setReportingOpen(false);
        setStatementReportsOpen(false);
        setAuditReportsOpen(false);
        setBusinessPartnerReportsOpen(false);
        setGeneralReportsOpen(false);
        setContentOpen(false);
        setSettingsOpen(false);

        setNewReportsOpen(false);
        setTaxMngntOpen(false);
        setDeliveryMngntOpen(false);

        break;
      case "content":
        setContentOpen(!contentOpen);
        setInventoryOpen(false);
        setSalesOpen(false);
        setPurchasesOpen(false);
        setReportingOpen(false);
        setStatementReportsOpen(false);
        setAuditReportsOpen(false);
        setBusinessPartnerReportsOpen(false);
        setGeneralReportsOpen(false);
        setAccountsOpen(false);
        setAccountingOpen(false);
        setSettingsOpen(false);

        setNewReportsOpen(false);
        setTaxMngntOpen(false);
        setDeliveryMngntOpen(false);

        break;
      case "sales":
        setSalesOpen(!salesOpen);
        setInventoryOpen(false);
        setAccountingOpen(false);
        setPurchasesOpen(false);
        setReportingOpen(false);
        setStatementReportsOpen(false);
        setAuditReportsOpen(false);
        setBusinessPartnerReportsOpen(false);
        setGeneralReportsOpen(false);
        setAccountsOpen(false);
        setContentOpen(false);
        setSettingsOpen(false);

        setNewReportsOpen(false);
        setTaxMngntOpen(false);
        setDeliveryMngntOpen(false);

        break;
      case "tax-management":
        setTaxMngntOpen(!taxMngntOpen);
        setPurchasesOpen(false);
        setInventoryOpen(false);
        setAccountingOpen(false);
        setSalesOpen(false);
        setReportingOpen(false);
        setStatementReportsOpen(false);
        setAuditReportsOpen(false);
        setBusinessPartnerReportsOpen(false);
        setGeneralReportsOpen(false);
        setAccountsOpen(false);
        setContentOpen(false);
        setSettingsOpen(false);

        setNewReportsOpen(false);
        setDeliveryMngntOpen(false);
        break;

      case "delivery-management":
        setDeliveryMngntOpen(!deliveryMngntOpen);
        setTaxMngntOpen(false);
        setPurchasesOpen(false);
        setInventoryOpen(false);
        setAccountingOpen(false);
        setSalesOpen(false);
        setReportingOpen(false);
        setStatementReportsOpen(false);
        setAuditReportsOpen(false);
        setBusinessPartnerReportsOpen(false);
        setGeneralReportsOpen(false);
        setAccountsOpen(false);
        setContentOpen(false);
        setSettingsOpen(false);

        setNewReportsOpen(false);
        break;
      case "purchases":
        setPurchasesOpen(!purchasesOpen);
        setInventoryOpen(false);
        setAccountingOpen(false);
        setSalesOpen(false);
        setReportingOpen(false);
        setStatementReportsOpen(false);
        setAuditReportsOpen(false);
        setBusinessPartnerReportsOpen(false);
        setGeneralReportsOpen(false);
        setAccountsOpen(false);
        setContentOpen(false);
        setSettingsOpen(false);

        setNewReportsOpen(false);
        setTaxMngntOpen(false);
        setDeliveryMngntOpen(false);

        break;
      case "reports":
        setReportingOpen(!reportingOpen);
        setInventoryOpen(false);
        setAccountingOpen(false);
        setSalesOpen(false);
        setPurchasesOpen(false);
        setContentOpen(false);
        setSettingsOpen(false);
        // For Reports submenu, reset all other submenus
        setStatementReportsOpen(false);
        setAuditReportsOpen(false);
        setBusinessPartnerReportsOpen(false);
        setGeneralReportsOpen(false);
        setAccountsOpen(false);

        setNewReportsOpen(false);
        setTaxMngntOpen(false);
        setDeliveryMngntOpen(false);

        break;
      case "statementReports":
        setStatementReportsOpen(!statementReportsOpen);
        setAuditReportsOpen(false);
        setBusinessPartnerReportsOpen(false);
        setGeneralReportsOpen(false);
        setNewReportsOpen(false);
        setDeliveryMngntOpen(false);

        break;
      case "auditReports":
        setStatementReportsOpen(false);
        setAuditReportsOpen(!auditReportsOpen);
        setBusinessPartnerReportsOpen(false);
        setGeneralReportsOpen(false);
        setNewReportsOpen(false);
        setDeliveryMngntOpen(false);

        break;
      case "businessPartnerReports":
        setStatementReportsOpen(false);
        setAuditReportsOpen(false);
        setBusinessPartnerReportsOpen(!businessPartnerReportsOpen);
        setGeneralReportsOpen(false);
        setNewReportsOpen(false);
        setDeliveryMngntOpen(false);

        break;
      case "generalReports":
        setStatementReportsOpen(false);
        setAuditReportsOpen(false);
        setBusinessPartnerReportsOpen(false);
        setGeneralReportsOpen(!generalReportsOpen);
        setNewReportsOpen(false);
        setDeliveryMngntOpen(false);

        break;
      case "newReports":
        setStatementReportsOpen(false);
        setAuditReportsOpen(false);
        setBusinessPartnerReportsOpen(false);
        setGeneralReportsOpen(false);
        setNewReportsOpen(!newReportsOpen);
        setDeliveryMngntOpen(false);

        break;
      default:
        break;
    }
  };

  return (
    <div
      className={`sidebar scrollable-contents shadow rounded d-flex flex-column bg-light border-right ${
        isSidebarOpen ? "open" : ""
      }`}
    >
      {/* Sidebar Toggle Button */}
      <div className="sidebar-toggle" onClick={toggleSidebar}>
        <i
          className={`fas ${
            isSidebarOpen ? "fa-angle-left" : "fa-angle-right"
          }`}
        ></i>
      </div>

      <div className="p-3">
        <div className="d-flex align-items-center justify-content-center mb-4 ">
          <img
            src={settings?.logo || ELI}
            alt="Logo"
            className="img-fluid mt-4"
            style={{ width: "160px" }}
          />
          {/* <h5 className="m-0">Accounting</h5> */}
        </div>
        <ul className="nav flex-column">
          <li className="nav-item">
            <Link
              to="/dashboard"
              className={`nav-link ${
                location.pathname === "/dashboard" ? "active" : ""
              }`}
            >
              <span>
                <i className="fa-solid fa-house me-2"></i>
                Dashboard
              </span>
            </Link>
          </li>
          <li className="nav-item">
            <div
              className={`nav-link ${salesOpen ? "active" : ""}`}
              onClick={() => toggleSubMenu("sales")}
              style={{ cursor: "pointer" }}
            >
              <span>
                <i className="fa-solid fa-user me-2"></i>
                Sales
              </span>
              <i
                className={`fas fa-angle-down ${
                  salesOpen ? "rotate-icon" : ""
                }`}
              ></i>
            </div>
            {salesOpen && (
              <ul className="nav flex-column ms-3">
                <li className="nav-item">
                  <a
                    href="/sales/invoices"
                    className={`nav-link ${
                      location.pathname.startsWith("/sales/invoices") ||
                      location.pathname.startsWith("/sales/create-invoice") ||
                      location.pathname.startsWith("/sales/invoice-update") ||
                      location.pathname.startsWith("/sales/invoice-payment")
                        ? "active"
                        : ""
                    }`}
                  >
                    Invoices
                  </a>
                </li>
                <li className="nav-item">
                  <Link
                    to="/sales/local-collections"
                    className={`nav-link ${
                      location.pathname.startsWith(
                        "/sales/local-collections",
                      ) ||
                      location.pathname.startsWith(
                        "/sales/local-bulk-collection",
                      )
                        ? "active"
                        : ""
                    }`}
                  >
                    Local Collection
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/sales/overseas-collections"
                    className={`nav-link ${
                      location.pathname.startsWith(
                        "/sales/overseas-collections",
                      ) ||
                      location.pathname.startsWith(
                        "/sales/overseas-bulk-collection",
                      )
                        ? "active"
                        : ""
                    }`}
                  >
                    Overseas Collection
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/sales/customers"
                    className={`nav-link ${
                      location.pathname.startsWith("/sales/customers") ||
                      location.pathname.startsWith(
                        "sales/customer-purchase-history",
                      )
                        ? "active"
                        : ""
                    }`}
                  >
                    Customers
                  </Link>
                </li>

                <li className="nav-item">
                  <Link
                    to="/sales/sample-product"
                    className={`nav-link ${
                      location.pathname.startsWith("/sales/sample-product") ||
                      location.pathname.startsWith(
                        "/sales/sample-product-create",
                      ) ||
                      location.pathname.startsWith(
                        "/sales/sample-product-update",
                      )
                        ? "active"
                        : ""
                    }`}
                  >
                    Sample Products
                  </Link>
                </li>
                {/* <li className="nav-item">
                  <Link
                    to="/sales/other-income"
                    className={`nav-link ${
                      location.pathname.startsWith("/sales/other-income") ||
                      location.pathname.startsWith("/sales/other-income")
                        ? "active"
                        : ""
                    }`}
                  >
                    Other Income
                  </Link>
                </li> */}
              </ul>
            )}
          </li>
          <li className="nav-item">
            <div
              className={`nav-link ${purchasesOpen ? "active" : ""}`}
              onClick={() => toggleSubMenu("purchases")}
              style={{ cursor: "pointer" }}
            >
              <span>
                <i className="fa-solid fa-credit-card me-2"></i>
                Purchases
              </span>
              <i
                className={`fas fa-angle-down ${
                  purchasesOpen ? "rotate-icon" : ""
                }`}
              ></i>
            </div>
            {purchasesOpen && (
              <ul className="nav flex-column ms-3">
                <li className="nav-item">
                  <Link
                    to="/purchases/purchase-request"
                    className={`nav-link ${
                      location.pathname.startsWith(
                        "/purchases/purchase-request",
                      ) ||
                      location.pathname.startsWith(
                        "/purchases/create-purchase-request",
                      ) ||
                      location.pathname.startsWith(
                        "/purchases/update-purchase-request",
                      ) ||
                      location.pathname.startsWith(
                        "/purchases/view-purchase-request",
                      )
                        ? "active"
                        : ""
                    }`}
                  >
                    Purchase Request
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/purchases/purchase-order"
                    className={`nav-link ${
                      location.pathname.startsWith("/purchases/purchase-order")
                        ? "active"
                        : ""
                    }`}
                  >
                    Purchase Order
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/purchases/receiving"
                    className={`nav-link ${
                      location.pathname.startsWith("/purchases/receiving")
                        ? "active"
                        : ""
                    }`}
                  >
                    Receiving
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/purchases/payable"
                    className={`nav-link ${
                      location.pathname.startsWith("/purchases/payable") ||
                      location.pathname.startsWith(
                        "/purchases/create_payable",
                      ) ||
                      location.pathname.startsWith("/purchases/purchase-pay")
                        ? "active"
                        : ""
                    }`}
                  >
                    Payable
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/purchases/local-purchase"
                    className={`nav-link ${
                      location.pathname.startsWith(
                        "/purchases/local-purchase",
                      ) ||
                      location.pathname.startsWith(
                        "/purchases/local-purchase-pay",
                      ) ||
                      location.pathname.startsWith(
                        "/Purchases/bulk-payable/local",
                      ) ||
                      location.pathname.startsWith(
                        "/Purchases/view-bulk-payable/local",
                      )
                        ? "active"
                        : ""
                    }`}
                  >
                    Local Purchase
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/purchases/overseas-purchase"
                    className={`nav-link ${
                      location.pathname.startsWith(
                        "/purchases/overseas-purchase",
                      ) ||
                      location.pathname.startsWith(
                        "/Purchases/bulk-payable/overseas",
                      ) ||
                      location.pathname.startsWith(
                        "/Purchases/view-bulk-payable/overseas",
                      )
                        ? "active"
                        : ""
                    }`}
                  >
                    Overseas Purchase
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/purchases/vendors"
                    className={`nav-link ${
                      location.pathname.startsWith("/purchases/vendors") ||
                      location.pathname.startsWith("/purchases/vendor-update")
                        ? "active"
                        : ""
                    }`}
                  >
                    Vendors
                  </Link>
                </li>
              </ul>
            )}
          </li>
          <li className="nav-item">
            <div
              className={`nav-link ${accountsOpen ? "active" : ""}`}
              onClick={() => toggleSubMenu("accounts")}
              style={{ cursor: "pointer" }}
            >
              <span>
                <i className="fa-regular fa-folder-open"></i>
                Accounts
              </span>
              <i
                className={`fas fa-angle-down ${
                  accountsOpen ? "rotate-icon" : ""
                }`}
              ></i>
            </div>
            {accountsOpen && (
              <ul className="nav flex-column ms-3">
                <li className="nav-item">
                  <Link
                    to="/accounts/bank-transaction"
                    className={`nav-link ${
                      location.pathname === "/accounts/bank-transaction"
                        ? "active"
                        : ""
                    }`}
                  >
                    Bank Transactions
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/accounts/outstanding-check"
                    className={`nav-link ${
                      location.pathname === "/accounts/outstanding-check"
                        ? "active"
                        : ""
                    }`}
                  >
                    Collection Checks
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/accounts/issued-check-account"
                    className={`nav-link ${
                      location.pathname === "/accounts/issued-check-account"
                        ? "active"
                        : ""
                    }`}
                  >
                    Issued Checks
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/accounts/account-list1"
                    className={`nav-link ${
                      location.pathname.startsWith("/accounts/account-list1") ||
                      location.pathname.startsWith("/accounts/view-accountlist")
                        ? "active"
                        : ""
                    }`}
                  >
                    Accounting List
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/accounts/bank-budgeting"
                    className={`nav-link ${
                      location.pathname === "/accounts/bank-budgeting"
                        ? "active"
                        : ""
                    }`}
                  >
                    Bank Budgeting
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/accounts/other-income"
                    className={`nav-link ${
                      location.pathname.startsWith("/accounts/other-income") ||
                      location.pathname.startsWith(
                        "/accounts/viewOtherIncome",
                      ) ||
                      location.pathname.startsWith("/accounts/add-otherIncome")
                        ? "active"
                        : ""
                    }`}
                  >
                    Other Income
                  </Link>
                </li>
              </ul>
            )}
          </li>
          <li className="nav-item">
            <div
              className={`nav-link ${inventoryOpen ? "active" : ""}`}
              onClick={() => toggleSubMenu("inventory")}
              style={{ cursor: "pointer" }}
            >
              <span>
                <i className="fas fa-box me-2"></i>
                Inventory
              </span>
              <i
                className={`fas fa-angle-down ${
                  inventoryOpen ? "rotate-icon" : ""
                }`}
              ></i>
            </div>
            {inventoryOpen && (
              <ul className="nav flex-column ms-3">
                <li className="nav-item">
                  <Link
                    to="/inventory/batch-entry"
                    className={`nav-link ${
                      location.pathname.startsWith("/inventory/batch-entry") ||
                      location.pathname.startsWith(
                        "/inventory/create-batch-entry",
                      ) ||
                      location.pathname.startsWith(
                        "/inventory/view-batch-entry",
                      )
                        ? "active"
                        : ""
                    }`}
                  >
                    Batch Entry
                  </Link>
                </li>

                <li className="nav-item">
                  <Link
                    to="/inventory/post-production"
                    className={`nav-link ${
                      location.pathname.startsWith(
                        "/inventory/post-production",
                      ) ||
                      location.pathname.startsWith("/inventory/production-loss")
                        ? "active"
                        : ""
                    }`}
                  >
                    Post-Production
                  </Link>
                </li>

                <li className="nav-item">
                  <Link
                    to="/inventory/stock-management"
                    className={`nav-link ${
                      location.pathname.startsWith(
                        "/inventory/stock-management",
                      ) ||
                      location.pathname.startsWith(
                        "/inventory/stockMangement/rawMaterialUpdate",
                      ) ||
                      location.pathname.startsWith(
                        "/inventory/stock-return-list",
                      )
                        ? "active"
                        : ""
                    }`}
                  >
                    Stock Management
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/inventory/formulation"
                    className={`nav-link ${
                      location.pathname.startsWith("/inventory/formulation") ||
                      location.pathname.startsWith(
                        "/inventory/create-formulation",
                      ) ||
                      location.pathname.startsWith(
                        "/inventory/update-formulation",
                      ) ||
                      location.pathname.startsWith(
                        "/inventory/create-update-formulation",
                      )
                        ? "active"
                        : ""
                    }`}
                  >
                    Formulation
                  </Link>
                </li>
                {/* <li className="nav-item">
                  <Link
                    to="/inventory/create-update-formulation2"
                    className={`nav-link ${
                      location.pathname.startsWith("/inventory/formulation") ||
                      location.pathname.startsWith(
                        "/inventory/create-formulation"
                      ) ||
                      location.pathname.startsWith(
                        "/inventory/update-formulation"
                      ) ||
                      location.pathname.startsWith(
                        "/inventory/create-update-formulation2"
                      )
                        ? "active"
                        : ""
                    }`}
                  >
                    CreateUpdateFormulation2
                  </Link>
                </li> */}
                <li className="nav-item">
                  <Link
                    to="/inventory/product-list"
                    className={`nav-link ${
                      location.pathname.startsWith("/inventory/product-list") ||
                      location.pathname.startsWith(
                        "/inventory/create-product",
                      ) ||
                      location.pathname.startsWith("/inventory/update-product")
                        ? "active"
                        : ""
                    }`}
                  >
                    Product List
                  </Link>
                </li>
                {/* <li className="nav-item">
                  <Link
                    to="/inventory/receiving"
                    className={`nav-link ${
                      location.pathname === "/inventory/receiving"
                        ? "active"
                        : ""
                    }`}
                  >
                    Receiving
                  </Link>
                </li> */}
                <li className="nav-item">
                  <Link
                    to="/inventory/productions"
                    className={`nav-link ${
                      location.pathname.startsWith("/inventory/productions") ||
                      location.pathname.startsWith(
                        "/inventory/productions-form",
                      ) ||
                      location.pathname.startsWith("/inventory/ProductionsView")
                        ? "active"
                        : ""
                    }`}
                  >
                    Productions
                  </Link>
                </li>
                {userLoggedID === "11111111-1111-1111-1111-111111111111" && (
                  <li className="nav-item">
                    <Link
                      to="/inventory/stock-transfer"
                      className={`nav-link ${
                        location.pathname.startsWith(
                          "/inventory/stock-transfer",
                        ) ||
                        location.pathname.startsWith(
                          "/inventory/create-stock-transfer",
                        ) ||
                        location.pathname.startsWith(
                          "/inventory/view-stock-transfer",
                        )
                          ? "active"
                          : ""
                      }`}
                    >
                      Stock Transfer
                    </Link>
                  </li>
                )}
                {userLoggedID === "11111111-1111-1111-1111-111111111111" && (
                  <li className="nav-item">
                    <Link
                      to="/inventory/inventory-counting"
                      className={`nav-link ${
                        location.pathname.startsWith(
                          "/inventory/inventory-counting",
                        ) ||
                        location.pathname.startsWith(
                          "/inventory/inventory-counting-create",
                        )
                          ? "active"
                          : ""
                      }`}
                    >
                      Inventory Counting
                    </Link>
                  </li>
                )}
              </ul>
            )}
          </li>
          {/* // DELIVERY MANGEMENT */}
          <li className="nav-item">
            <div
              className={`nav-link ${deliveryMngntOpen ? "active" : ""}`}
              onClick={() => toggleSubMenu("delivery-management")}
              style={{ cursor: "pointer" }}
            >
              <span>
                <i className="fa-solid fa-truck-fast"></i>
                Delivery Management
              </span>
              <i
                className={`fas fa-angle-down ${
                  deliveryMngntOpen ? "rotate-icon" : ""
                }`}
              ></i>
            </div>
            {deliveryMngntOpen && (
              <ul className="nav flex-column ms-3">
                <li className="nav-item">
                  <Link
                    to="/delivery-management/schedule"
                    className={`nav-link ${
                      location.pathname === "/delivery-management/schedule" ||
                      location.pathname === "/delivery-management/schedule-list"
                        ? "active"
                        : ""
                    }`}
                  >
                    Schedule
                  </Link>
                </li>
                <li>
                  <Link
                    to="/delivery-management/return-products"
                    className={`nav-link ${
                      location.pathname ===
                        "/delivery-management/return-products" ||
                      location.pathname ===
                        "/delivery-management/return-product-details" ||
                      location.pathname.startsWith(
                        "/delivery-management/update-return-product-details",
                      )
                        ? "active"
                        : ""
                    }`}
                  >
                    Return Products
                  </Link>
                </li>

                {userLoggedID === "11111111-1111-1111-1111-111111111111" && (
                  <li>
                    <Link
                      to="/delivery-management/delivery-pdf"
                      className={`nav-link ${
                        location.pathname ===
                        "/delivery-management/delivery-pdf"
                          ? "active"
                          : ""
                      }`}
                    >
                      Delivery PDFs
                    </Link>
                  </li>
                )}
              </ul>
            )}
          </li>
          {/* // */}
          <li className="nav-item">
            <div
              className={`nav-link ${accountingOpen ? "active" : ""}`}
              onClick={() => toggleSubMenu("accounting")}
              style={{ cursor: "pointer" }}
            >
              <span>
                <i className="fas fa-chart-line me-2"></i>
                Accounting
              </span>
              <i
                className={`fas fa-angle-down ${
                  accountingOpen ? "rotate-icon" : ""
                }`}
              ></i>
            </div>
            {accountingOpen && (
              <ul className="nav flex-column ms-3">
                <li className="nav-item">
                  <Link
                    to="/accounting/cash-flow"
                    className={`nav-link ${
                      location.pathname === "/accounting/cash-flow"
                        ? "active"
                        : ""
                    }`}
                  >
                    Cash Flow
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/accounting/expenses"
                    className={`nav-link ${
                      location.pathname.startsWith("/accounting/expenses") ||
                      location.pathname.startsWith(
                        "/accounting/add-expenses",
                      ) ||
                      location.pathname.startsWith("/accounting/view-expenses")
                        ? "active"
                        : ""
                    }`}
                  >
                    Expenses
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/accounting/local-expenses"
                    className={`nav-link ${
                      location.pathname.startsWith(
                        "/accounting/local-expenses",
                      ) ||
                      location.pathname.startsWith(
                        "/accounting/local-expenses",
                      ) ||
                      location.pathname.startsWith(
                        "/accounting/pay-expenses/local",
                      ) ||
                      location.pathname.startsWith(
                        "/accounting/view-pay-expenses/local",
                      )
                        ? "active"
                        : ""
                    }`}
                  >
                    Local Expenses
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/accounting/overseas-expenses"
                    className={`nav-link ${
                      location.pathname.startsWith(
                        "/accounting/overseas-expenses",
                      ) ||
                      location.pathname.startsWith(
                        "/accounting/pay-expenses/overseas",
                      ) ||
                      location.pathname.startsWith(
                        "/accounting/view-pay-expenses/overseas",
                      )
                        ? "active"
                        : ""
                    }`}
                  >
                    Overseas Expenses
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/accounting/fixedAsset"
                    className={`nav-link ${
                      location.pathname.startsWith("/accounting/fixedAsset") ||
                      location.pathname.startsWith(
                        "/accounting/create-fixed-assets",
                      )
                        ? "active"
                        : ""
                    }`}
                  >
                    Fixed Assets
                  </Link>
                </li>
                {/* <li className="nav-item">
                  <Link
                    to="/accounting/lending"
                    className={`nav-link ${
                      location.pathname.startsWith("/accounting/lending") ||
                      location.pathname.startsWith(
                        "/accounting/create-lending"
                      ) ||
                      location.pathname.startsWith("/accounting/paylend")
                        ? "active"
                        : ""
                    }`}
                  >
                    Lending
                  </Link>
                </li> */}
                {/* <li className="nav-item">
                  <Link
                    to="/accounting/loan"
                    className={`nav-link ${
                      location.pathname.startsWith("/accounting/loan")
                        ? // location.pathname.startsWith("/accounting/create-loan") ||
                          // location.pathname.startsWith("/accounting/payloan")
                          "active"
                        : ""
                    }`}
                  >
                    Loan
                  </Link>
                </li> */}
                <li className="nav-item">
                  <Link
                    to="/accounting/assetaccount-list1"
                    className={`nav-link ${
                      location.pathname.startsWith(
                        "/accounting/assetaccount",
                      ) ||
                      location.pathname.startsWith(
                        "/accounting/create-asset-account",
                      ) ||
                      location.pathname.startsWith(
                        "/accounting/view-assetAccount",
                      )
                        ? "active"
                        : ""
                    }`}
                  >
                    Asset Account
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/accounting/liabilities1"
                    className={`nav-link ${
                      location.pathname.startsWith(
                        "/accounting/liabilities1",
                      ) ||
                      location.pathname.startsWith(
                        "/accounting/create-liabilities1",
                      ) ||
                      location.pathname.startsWith(
                        "/accounting/view-liabilityAccount",
                      )
                        ? "active"
                        : ""
                    }`}
                  >
                    Liability
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/accounting/equity"
                    className={`nav-link ${
                      location.pathname.startsWith("/accounting/equity") ||
                      location.pathname.startsWith(
                        "/accounting/create-equity",
                      ) ||
                      location.pathname.startsWith(
                        "/accounting/view-equityAccount",
                      )
                        ? "active"
                        : ""
                    }`}
                  >
                    Owners' Equity
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/accounting/cutoff"
                    className={`nav-link ${
                      location.pathname.startsWith("/accounting/cutoff") ||
                      location.pathname.startsWith("/accounting/view-cutoff")
                        ? "active"
                        : ""
                    }`}
                  >
                    Monthly Cutoff
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/accounting/retained-earnings"
                    className={`nav-link ${
                      location.pathname.startsWith(
                        "/accounting/retained-earnings",
                      ) ||
                      location.pathname.startsWith("/accounting/view-earnings")
                        ? "active"
                        : ""
                    }`}
                  >
                    Retained Earnings
                  </Link>
                </li>
              </ul>
            )}
          </li>

          <li className="nav-item">
            <div
              className={`nav-link ${taxMngntOpen ? "active" : ""}`}
              onClick={() => toggleSubMenu("tax-management")}
              style={{ cursor: "pointer" }}
            >
              <span>
                <i className="fa-solid fa-circle-dollar-to-slot"></i>
                Tax Management
              </span>
              <i
                className={`fas fa-angle-down ${
                  taxMngntOpen ? "rotate-icon" : ""
                }`}
              ></i>
            </div>
            {taxMngntOpen && (
              <ul className="nav flex-column ms-3">
                <li className="nav-item">
                  <Link
                    to="/tax-management/tax-settings"
                    className={`nav-link ${
                      location.pathname === "/tax-management/tax-settings" ||
                      location.pathname ===
                        "/tax-management/tax-settings-add/create" ||
                      location.pathname === "/tax-management/tax-settings-add"
                        ? "active"
                        : ""
                    }`}
                  >
                    Tax Settings
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/tax-management/tax-report"
                    className={`nav-link ${
                      location.pathname === "/tax-management/tax-report"
                        ? "active"
                        : ""
                    }`}
                  >
                    Tax Report
                  </Link>
                </li>
                {/* <li className="nav-item">
                  <Link
                    to="/tax-management/tax-report"
                    style={{
                      backgroundColor: "#e9ecef",
                    }}
                    className={`nav-link ${
                      location.pathname === "/tax-management/tax-report"
                        ? "active"
                        : ""
                    }`}
                  >
                    Withholding Tax Report
                  </Link>
                </li> */}
              </ul>
            )}
          </li>
          <li className="nav-item">
            <div
              className={`nav-link ${reportingOpen ? "active" : ""}`}
              onClick={() => toggleSubMenu("reports")}
              style={{ cursor: "pointer" }}
            >
              <span>
                <i className="fas fa-chart-bar me-2"></i>
                Reporting
              </span>
              <i
                className={`fas fa-angle-down ${
                  reportingOpen ? "rotate-icon" : ""
                }`}
              ></i>
            </div>
            {reportingOpen && (
              <ul className="nav flex-column ms-3">
                <li className="nav-item d-none">
                  <div
                    className={`nav-link ${
                      statementReportsOpen ? "active" : ""
                    }`}
                    onClick={() => toggleSubMenu("statementReports")}
                    style={{ cursor: "pointer" }}
                  >
                    <span>Statement Reports</span>
                    <i
                      className={`fa-solid fa-caret-down ${
                        statementReportsOpen ? "rotate-icon" : ""
                      }`}
                    ></i>
                  </div>
                  {statementReportsOpen && (
                    <ul className="nav flex-column ms-3">
                      <li className="nav-item">
                        <Link
                          to="/reports/statement/balance-sheet"
                          className={`nav-link ${
                            location.pathname ===
                            "/reports/statement/balance-sheet"
                              ? "active"
                              : ""
                          }`}
                        >
                          Balance Sheet
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link
                          to="/reports/statement/production-loss"
                          className={`nav-link ${
                            location.pathname ===
                            "/reports/statement/production-loss"
                              ? "active"
                              : ""
                          }`}
                        >
                          Production Loss
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link
                          to="/reports/statement/expenses-report"
                          className={`nav-link ${
                            location.pathname ===
                            "/reports/statement/expenses-report"
                              ? "active"
                              : ""
                          }`}
                        >
                          Expenses Report
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link
                          to="/reports/statement/income-profit"
                          className={`nav-link ${
                            location.pathname ===
                            "/reports/statement/income-profit"
                              ? "active"
                              : ""
                          }`}
                        >
                          Income Profit
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link
                          to="/reports/statement/income-profit-branch"
                          className={`nav-link ${
                            location.pathname ===
                            "/reports/statement/income-profit-branch"
                              ? "active"
                              : ""
                          }`}
                        >
                          Income Profit Branches
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link
                          to="/reports/statement/income-profit-client"
                          className={`nav-link ${
                            location.pathname ===
                            "/reports/statement/income-profit-client"
                              ? "active"
                              : ""
                          }`}
                        >
                          Income Profit Clients
                        </Link>
                      </li>

                      <li className="nav-item">
                        <Link
                          to="/reports/statement/boss-report"
                          className={`nav-link ${
                            location.pathname ===
                            "/reports/statement/boss-report"
                              ? "active"
                              : ""
                          }`}
                        >
                          Boss Report
                        </Link>
                      </li>
                    </ul>
                  )}
                </li>
                <li className="nav-item d-none">
                  <div
                    className={`nav-link ${auditReportsOpen ? "active" : ""}`}
                    onClick={() => toggleSubMenu("auditReports")}
                    style={{ cursor: "pointer" }}
                  >
                    <span>Audit Reports</span>
                    <i
                      className={`fa-solid fa-caret-down  ${
                        auditReportsOpen ? "rotate-icon" : ""
                      }`}
                    ></i>
                  </div>
                  {auditReportsOpen && (
                    <ul className="nav flex-column ms-3">
                      <li className="nav-item">
                        <Link
                          to="/reports/audit/trial-balance"
                          className={`nav-link ${
                            location.pathname === "/reports/audit/trial-balance"
                              ? "active"
                              : ""
                          }`}
                        >
                          Trial Balance
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link
                          to="/reports/audit/journal-list"
                          className={`nav-link ${
                            location.pathname === "/reports/audit/journal-list"
                              ? "active"
                              : ""
                          }`}
                        >
                          Journal List Report
                        </Link>
                      </li>
                    </ul>
                  )}
                </li>
                <li className="nav-item d-none">
                  <div
                    className={`nav-link ${
                      businessPartnerReportsOpen ? "active" : ""
                    }`}
                    onClick={() => toggleSubMenu("businessPartnerReports")}
                    style={{ cursor: "pointer" }}
                  >
                    <span className="nav-link-sm">
                      Business Partner Reports
                    </span>
                    <i
                      className={`fa-solid fa-caret-down  ${
                        businessPartnerReportsOpen ? "rotate-icon" : ""
                      }`}
                    ></i>
                  </div>
                  {businessPartnerReportsOpen && (
                    <ul className="nav flex-column ms-3">
                      <li className="nav-item">
                        <Link
                          to="/reports/business-partner/receiving-reports"
                          className={`nav-link ${
                            location.pathname ===
                            "/reports/business-partner/receiving-reports"
                              ? "active"
                              : ""
                          }`}
                        >
                          Receiving Reports
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link
                          to="/reports/business-partner/payable"
                          className={`nav-link ${
                            location.pathname ===
                            "/reports/business-partner/payable"
                              ? "active"
                              : ""
                          }`}
                        >
                          Payable
                        </Link>
                      </li>
                    </ul>
                  )}
                </li>
                <li className="nav-item d-none">
                  <Link
                    to="/reports/inventory-report"
                    className={`nav-link ${
                      location.pathname === "/reports/inventory-report"
                        ? "active"
                        : ""
                    }`}
                  >
                    Inventory Reports
                  </Link>
                </li>

                <li className="nav-item">
                  <div
                    className={`nav-link  ${
                      generalReportsOpen ? "active" : ""
                    }`}
                    onClick={() =>
                      userLoggedID === "11111111-1111-1111-1111-111111111111" &&
                      toggleSubMenu("generalReports")
                    }
                    style={{ cursor: "pointer" }}
                  >
                    {/* <span>General Reports</span> */}
                    <span>Boss Report</span>
                    {userLoggedID === "11111111-1111-1111-1111-111111111111" ? (
                      <i
                        className={`fa-solid fa-caret-down ${
                          generalReportsOpen ? "rotate-icon" : ""
                        }`}
                      ></i>
                    ) : (
                      <i class="fa-solid fa-lock"></i>
                    )}
                  </div>
                  {generalReportsOpen && (
                    <ul className="nav flex-column ms-3">
                      <li className="nav-item d-none">
                        <Link
                          to="/reports/general/po-reports"
                          className={`nav-link ${
                            location.pathname === "/reports/general/po-reports"
                              ? "active"
                              : ""
                          }`}
                        >
                          P.O. Reports Supplier
                        </Link>
                      </li>
                      <li className="nav-item d-none">
                        <Link
                          to="/reports/general/sales-reports"
                          className={`nav-link ${
                            location.pathname ===
                            "/reports/general/sales-reports"
                              ? "active"
                              : ""
                          }`}
                        >
                          Sales Reports
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link
                          to="/reports/general/boss-report"
                          className={`nav-link ${
                            location.pathname === "/reports/general/boss-report"
                              ? "active"
                              : ""
                          }`}
                        >
                          Boss Report
                        </Link>
                      </li>
                    </ul>
                  )}
                </li>

                <li className="nav-item">
                  <div
                    className={`nav-link ${newReportsOpen ? "active" : ""}`}
                    onClick={() => toggleSubMenu("newReports")}
                    style={{ cursor: "pointer" }}
                  >
                    {/* eto na ang bago sa general reports */}
                    {/* <span>Reports *New</span> */}
                    <span>General Reports</span>
                    <i
                      className={`fa-solid fa-caret-down ${
                        newReportsOpen ? "rotate-icon" : ""
                      }`}
                    ></i>
                  </div>
                  {newReportsOpen && (
                    <ul className="nav flex-column ms-3">
                      <li className="nav-item">
                        <Link
                          to="/reports/new-report/trial_balance"
                          className={`nav-link ${
                            location.pathname ===
                            "/reports/new-report/trial_balance"
                              ? "active"
                              : ""
                          }`}
                        >
                          Trial Balance
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link
                          to="/reports/new-report/purchase_report"
                          className={`nav-link ${
                            location.pathname ===
                            "/reports/new-report/purchase_report"
                              ? "active"
                              : ""
                          }`}
                        >
                          Purchase Report
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link
                          to="/reports/new-report/production_report"
                          className={`nav-link ${
                            location.pathname ===
                            "/reports/new-report/production_report"
                              ? "active"
                              : ""
                          }`}
                        >
                          Production Report
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link
                          to="/reports/new-report/sales_report"
                          className={`nav-link ${
                            location.pathname ===
                            "/reports/new-report/sales_report"
                              ? "active"
                              : ""
                          }`}
                        >
                          Sales Report
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link
                          to="/reports/new-report/inventory_report"
                          className={`nav-link ${
                            location.pathname ===
                            "/reports/new-report/inventory_report"
                              ? "active"
                              : ""
                          }`}
                        >
                          Inventory Report
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link
                          to="/reports/new-report/expenses_report"
                          className={`nav-link ${
                            location.pathname ===
                            "/reports/new-report/expenses_report"
                              ? "active"
                              : ""
                          }`}
                        >
                          Expenses Report
                        </Link>
                      </li>
                      {userLoggedID ===
                        "11111111-1111-1111-1111-111111111111" && (
                        <li className="nav-item">
                          <Link
                            to="/reports/new-report/income_report"
                            className={`nav-link ${
                              location.pathname ===
                              "/reports/new-report/income_report"
                                ? "active"
                                : ""
                            }`}
                          >
                            Income Statement
                          </Link>
                        </li>
                      )}
                      <li className="nav-item">
                        <Link
                          to="/reports/new-report/balance_sheet"
                          className={`nav-link ${
                            location.pathname.startsWith(
                              "/reports/new-report/balance_sheet",
                            )
                              ? "active"
                              : ""
                          }`}
                        >
                          Final Balance Sheet
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link
                          to="/reports/new-report/profit_loss"
                          className={`nav-link ${
                            location.pathname.startsWith(
                              "/reports/new-report/prodit_loss",
                            )
                              ? "active"
                              : ""
                          }`}
                        >
                          Exchange Rate Gain & Loss
                        </Link>
                      </li>
                    </ul>
                  )}
                </li>
              </ul>
            )}
          </li>
          <li className="nav-item">
            <div
              className={`nav-link ${contentOpen ? "active" : ""}`}
              onClick={() => toggleSubMenu("content")}
              style={{ cursor: "pointer" }}
            >
              <span>
                <i className="fa-solid fa-gears"></i>
                Content Management
              </span>
              <i
                className={`fas fa-angle-down ${
                  contentOpen ? "rotate-icon" : ""
                }`}
              ></i>
            </div>
            {contentOpen && (
              <ul className="nav flex-column ms-3">
                <li className="nav-item">
                  <Link
                    to="/content/expenses1"
                    className={`nav-link ${
                      location.pathname === "/content/expenses1" ? "active" : ""
                    }`}
                  >
                    Expense Type
                  </Link>
                </li>

                <li className="nav-item">
                  <Link
                    to="/content/expenses2"
                    className={`nav-link ${
                      location.pathname === "/content/expenses2" ? "active" : ""
                    }`}
                  >
                    Expense Sub-Type
                  </Link>
                </li>

                <li className="nav-item">
                  <Link
                    to="/content/parameters"
                    className={`nav-link ${
                      location.pathname.startsWith("/content/parameters")
                        ? "active"
                        : ""
                    }`}
                  >
                    Parameters
                  </Link>
                </li>
                {/* <li className="nav-item">
                  <Link
                    to="/content/source"
                    className={`nav-link ${
                      location.pathname === "/content/source" ? "active" : ""
                    }`}
                  >
                    Source
                  </Link>
                </li> */}
                <li className="nav-item">
                  <Link
                    to="/content/packaging"
                    className={`nav-link ${
                      location.pathname === "/content/packaging" ? "active" : ""
                    }`}
                  >
                    Unit of Measure
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/content/mixer"
                    className={`nav-link ${
                      location.pathname === "/content/mixer" ? "active" : ""
                    }`}
                  >
                    Mixer
                  </Link>
                </li>

                {/* <li className="nav-item">
                  <Link
                    to="/content/label-management"
                    className={`nav-link ${
                      location.pathname === "/content/label-management"
                        ? "active"
                        : ""
                    }`}
                  >
                    Label Management
                  </Link>
                </li> */}
              </ul>
            )}
          </li>
          <li className="nav-item">
            <div
              className={`nav-link ${settingsOpen ? "active" : ""}`}
              onClick={() => toggleSubMenu("settings")}
              style={{ cursor: "pointer" }}
            >
              <span>
                <i className="fa-solid fa-gear"></i>
                Settings
              </span>
              <i
                className={`fas fa-angle-down ${
                  settingsOpen ? "rotate-icon" : ""
                }`}
              ></i>
            </div>
            {settingsOpen && (
              <ul className="nav flex-column ms-3">
                <li className="nav-item">
                  <Link
                    to="/settings/general-settings"
                    className={`nav-link ${
                      location.pathname.startsWith("/settings/general-settings")
                        ? "active"
                        : ""
                    }`}
                  >
                    General Settings
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/settings/access-control"
                    className={`nav-link ${
                      location.pathname.startsWith(
                        "/settings/access-control",
                      ) ||
                      location.pathname.startsWith("/settings/create-rbac") ||
                      location.pathname.startsWith("/settings/update-rbac")
                        ? "active"
                        : ""
                    }`}
                  >
                    Access Control
                  </Link>
                </li>
                {userLoggedID === "11111111-1111-1111-1111-111111111111" && (
                  <li className="nav-item">
                    <Link
                      to="/settings/branches"
                      className={`nav-link ${
                        location.pathname === "/settings/branches"
                          ? "active"
                          : ""
                      }`}
                    >
                      Branches
                    </Link>
                  </li>
                )}
                <li className="nav-item">
                  <Link
                    to="/settings/user-management"
                    className={`nav-link ${
                      location.pathname === "/settings/user-management"
                        ? "active"
                        : ""
                    }`}
                  >
                    User Management
                  </Link>
                </li>
                {userLoggedID === "11111111-1111-1111-1111-111111111111" && (
                  <li className="nav-item">
                    <Link
                      to="/settings/currency"
                      className={`nav-link ${
                        location.pathname === "/settings/currency"
                          ? "active"
                          : ""
                      }`}
                    >
                      Currency
                    </Link>
                  </li>
                )}
                {/* <li className="nav-item">
                  <Link
                    to="/settings/general-settings"
                    className={`nav-link ${
                      location.pathname.startsWith("/settings/general-settings")
                        ? "active"
                        : ""
                    }`}
                  >
                    General Settings
                  </Link>
                </li> */}
                <li className="nav-item">
                  <Link
                    to="/settings/in-app-notification"
                    className={`nav-link ${
                      location.pathname === "/settings/in-app-notification"
                        ? "active"
                        : ""
                    }`}
                  >
                    In-App Notification
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/settings/company-profile"
                    className={`nav-link ${
                      location.pathname === "/settings/company-profile"
                        ? "active"
                        : ""
                    }`}
                  >
                    Company Profile
                  </Link>
                </li>
              </ul>
            )}
          </li>
          {userLoggedID === "11111111-1111-1111-1111-111111111111" && (
            <li className="nav-item">
              <Link
                to="/activity-log"
                className={`nav-link ${
                  location.pathname === "/activity-log" ? "active" : ""
                }`}
              >
                <span>
                  <i className="fa-solid fa-tv me-2"></i>
                  Activity Log
                </span>
              </Link>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
