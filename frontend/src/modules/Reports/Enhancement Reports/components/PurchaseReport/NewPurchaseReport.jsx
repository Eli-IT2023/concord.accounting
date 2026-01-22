import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Modal, Button, Form, Tab, Tabs, Table } from "react-bootstrap";
import swal from "sweetalert";
import DataTable from "react-data-table-component";
import { customStyles } from "../../../../../assets/table-style";
import "@fortawesome/fontawesome-free/css/all.min.css";
import BASE_URL from "../../../../../assets/global/url";
import Select from "react-select";
import { json, Link } from "react-router-dom";
import { CSSTransition } from "react-transition-group";
import "../../../../../assets/css/style.css";
import * as XLSX from "xlsx";
import DatePicker from "react-datepicker";
import NoAccess from "../../../../../assets/img/NoAccess.png";
import {
  PaginationControls,
  usePagination,
} from "../../../../../hooks/customHook/paginationHook/usePagination";
import { useNavigate } from "react-router-dom";
import { useServerPagination } from "../../../../../hooks/customHook/paginationHook/useServerPagination";

const NewPurchaseReport = ({ authrztn }) => {
  const [showTable, setShowTable] = useState(false);
  const [productSearchText, setProductSearchText] = useState("");
  const [productFilterColumn, setProductFilterColumn] = useState("all");
  const [supplierSearchText, setSupplierSearchText] = useState("");
  const [supplierFilterColumn, setSupplierFilterColumn] = useState("all");
  const navigate = useNavigate();

  // For cutoff filter
  const [cutOffs, setCutOffs] = useState([]);
  const [selectedCutOff, setSelectedCutOff] = useState({
    id: null,
    from: null,
    to: null,
  });

  // For Overview
  const [overview, setOverview] = useState({
    totalPurchase: 0,
    numberOfTransactions: 0,
    averagePurchaseValue: 0,
    lastAccountsPayable: 0,
    accountsPaid: 0,
    accountsPayable: 0,
    prevPeriodPurchase: 0,
    purchaseGrowthIndex: 0,
    apTurnOverRatio: 0,
  });

  const toggleTable = () => {
    setShowTable(!showTable);
  };

  // // For product tab pagination
  // const products = useServerPagination(
  //   `${BASE_URL}/purchase_report/products-tab`,
  //   10,
  //   {
  //     startDate: selectedCutOff?.from,
  //     endDate: selectedCutOff?.to,
  //   }
  // );
  const products = useServerPagination(
    `${BASE_URL}/purchase_report/products-tab-search`,
    10,
    {
      startDate: selectedCutOff?.from,
      endDate: selectedCutOff?.to,
      searchFunction: productSearchText,
      filterColumn: productFilterColumn,
    },
  );

  // For supplier tab pagination
  // const suppliers = useServerPagination(
  //   `${BASE_URL}/purchase_report/suppliers-tab`,
  //   10,
  //   {
  //     startDate: selectedCutOff?.from,
  //     endDate: selectedCutOff?.to,
  //   }
  // );
  const suppliers = useServerPagination(
    `${BASE_URL}/purchase_report/suppliers-tab-search`,
    10,
    {
      startDate: selectedCutOff?.from,
      endDate: selectedCutOff?.to,
      searchFunction: supplierSearchText,
      filterColumn: supplierFilterColumn,
    },
  );

  // New fetching to get Purchase Breakdown by product (Table)
  // const getProducts = (cutoff) => {
  //   products.updateApiUrl(`${BASE_URL}/purchase_report/products-tab`);
  //   products.updateParams({
  //     startDate: cutoff?.from,
  //     endDate: cutoff?.to,
  //   });
  // };
  const getProducts = (cutoff) => {
    products.updateApiUrl(`${BASE_URL}/purchase_report/products-tab-search`);
    products.updateParams({
      startDate: cutoff?.from,
      endDate: cutoff?.to,
      searchFunction: productSearchText,
      filterColumn: productFilterColumn,
    });
  };

  // trigger search when search parameters change
  useEffect(() => {
    if (selectedCutOff?.from && selectedCutOff?.to) {
      getProducts(selectedCutOff);
    }
  }, [productSearchText, productFilterColumn]);

  //clear search when filter column changes
  useEffect(() => {
    setProductSearchText("");
  }, [productFilterColumn]);

  // New fetching to get Purchase Breakdown by supplier (Table)
  // const getSuppliers = (cutoff) => {
  //   suppliers.updateApiUrl(`${BASE_URL}/purchase_report/suppliers-tab`);
  //   suppliers.updateParams({
  //     startDate: cutoff?.from,
  //     endDate: cutoff?.to,
  //   });
  // };
  const getSuppliers = (cutoff) => {
    suppliers.updateApiUrl(`${BASE_URL}/purchase_report/suppliers-tab-search`);
    suppliers.updateParams({
      startDate: cutoff?.from,
      endDate: cutoff?.to,
      searchFunction: supplierSearchText,
      filterColumn: supplierFilterColumn,
    });
  };

  //  trigger search when search parameters change for suppliers
  useEffect(() => {
    if (selectedCutOff?.from && selectedCutOff?.to) {
      getSuppliers(selectedCutOff);
    }
  }, [supplierSearchText, supplierFilterColumn]);

  // clear search when filter column changes for suppliers
  useEffect(() => {
    setSupplierSearchText("");
  }, [supplierFilterColumn]);

  // Fetch overview summary
  const getOverview = async (cutoff) => {
    try {
      const res = await axios.get(`${BASE_URL}/purchase_report/overview`, {
        params: {
          startDate: cutoff?.from,
          endDate: cutoff?.to,
        },
      });

      if (res.status === 200) {
        setOverview((prev) => ({
          ...prev,
          ...res.data,
        }));
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Get the latest cutoff
  const fetchCutoff = async () => {
    await axios
      .get(`${BASE_URL}/purchase_report/getCutoffs`)
      .then(async (res) => {
        const latestCutoff = res.data.reduce((latest, current) =>
          new Date(current.to) > new Date(latest.to) ? current : latest,
        );

        setCutOffs(res.data); // store all cut off
        setSelectedCutOff({
          id: latestCutoff.id,
          from: new Date(latestCutoff.from),
          to: new Date(latestCutoff.to),
        });

        getProducts(latestCutoff);
        getSuppliers(latestCutoff);
        getOverview(latestCutoff);
      });
  };

  // Handle cutoff change
  const handleSelect = (e) => {
    const selectedValue = e.target.value;
    const selectedItem = cutOffs.find((item) => item.id === selectedValue);

    if (selectedItem) {
      const cutoff = {
        id: selectedItem.id,
        from: selectedItem.from,
        to: selectedItem.to,
      };

      setSelectedCutOff(cutoff);
      getProducts(cutoff);
      getSuppliers(cutoff);
      getOverview(cutoff);
    }
  };

  // Handle export to excel functionality
  const exportToExcel = async () => {
    const workbook = XLSX.utils.book_new();

    // Overview Data with Headers
    const overviewData = [
      ["Accounting Period", selectedCutOff.name],
      ["Start Date", selectedCutOff.from],
      ["End Date", selectedCutOff.to],
      [],
      ["Total purchase for the Period", overview?.totalPurchase],
      ["Number of Transactions", overview?.numberOfTransactions],
      ["Average purchase Value", overview?.averagePurchaseValue],
      ["Last Accounts Payable", overview?.lastAccountsPayable],
      ["Accounts Paid", overview?.accountsPaid],
      ["Accounts Payable", overview?.accountsPayable],
      ["Previous Period purchase", overview?.prevPeriodPurchase],
      ["Purchase Growth Index", overview?.purchaseGrowthIndex],
      ["Accounts payable turnover ratio", overview?.apTurnOverRatio],
    ];
    const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData);
    XLSX.utils.book_append_sheet(workbook, overviewSheet, "Overview");

    try {
      // Fetch ALL product data for export (not paginated)
      const allProductsResponse = await axios.get(
        `${BASE_URL}/purchase_report/products-tab-search`,
        {
          params: {
            startDate: selectedCutOff?.from,
            endDate: selectedCutOff?.to,
            searchFunction: "",
            filterColumn: "all",
            page: 1,
            limit: 999999, // Get all records
          },
        },
      );

      // Product or Service Data
      const productData = allProductsResponse.data.data.map((item) => [
        item.product_code,
        item.product_name,
        item.purchaseQuantity,
        item.averageUnitPrice || 0,
        item.amount,
      ]);

      const productSheet = XLSX.utils.aoa_to_sheet([
        ["Accounting Period", selectedCutOff.name, "", "", ""],
        ["Start Date", selectedCutOff.from, "", "", ""],
        ["End Date", selectedCutOff.to, "", "", ""],
        [],
        [
          "Product Code",
          "Name",
          "Purchase Net Quantity",
          "Average Unit Price",
          "Amount",
        ],
        ...productData,
      ]);
      XLSX.utils.book_append_sheet(
        workbook,
        productSheet,
        "Product or Service",
      );

      // Fetch ALL supplier data for export (not paginated)
      const allSuppliersResponse = await axios.get(
        `${BASE_URL}/purchase_report/suppliers-tab-search`,
        {
          params: {
            startDate: selectedCutOff?.from,
            endDate: selectedCutOff?.to,
            searchFunction: "",
            filterColumn: "all",
            page: 1,
            limit: 999999, // Get all records
          },
        },
      );

      // const supplierData = allSuppliersResponse.data.data.map((item) => [ //for all rows
      const supplierData = allSuppliersResponse.data.data
        .filter((item) => item.accountsPayable !== 0) //Filter out rows where accountsPayable is 0
        .map((item) => [
          item.vendorName,
          item.lastAccountBalance,
          item.purchaseQuantity,
          item.averageUnitPrice || 0,
          item.newPurchaseAmount,
          item.accountsPaid,
          item.accountsPayable,
        ]);

      const supplierSheet = XLSX.utils.aoa_to_sheet([
        ["Accounting Period", selectedCutOff.name, "", "", "", "", ""],
        ["Start Date", selectedCutOff.from, "", "", "", "", ""],
        ["End Date", selectedCutOff.to, "", "", "", "", ""],
        [],
        [
          "Vendor Name",
          "Last Account Balance",
          "Purchase Net Quantity",
          "Average Unit Price",
          "New Purchase Amount",
          "Accounts Paid",
          "Accounts Payable",
        ],
        ...supplierData,
      ]);
      XLSX.utils.book_append_sheet(workbook, supplierSheet, "Supplier");

      // Apply styling
      const applyStyling = (sheet, labelRows) => {
        const range = XLSX.utils.decode_range(sheet["!ref"]);
        for (let R = range.s.r; R <= range.e.r; ++R) {
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const cell_address = { c: C, r: R };
            const cell_ref = XLSX.utils.encode_cell(cell_address);
            if (!sheet[cell_ref]) continue;
            sheet[cell_ref].s = {
              font: { bold: labelRows.includes(R) }, // Bold for specific label rows
              fill: { fgColor: { rgb: "FFFFCC" } }, // Light yellow background
              border: {
                top: { style: "thin", color: { rgb: "000000" } },
                bottom: { style: "thin", color: { rgb: "000000" } },
                left: { style: "thin", color: { rgb: "000000" } },
                right: { style: "thin", color: { rgb: "000000" } },
              },
            };
          }
        }
      };

      applyStyling(overviewSheet, [0, 1, 2, 4]);
      applyStyling(productSheet, [0, 1, 2, 4]);
      applyStyling(supplierSheet, [0, 1, 2, 4]);

      // Export the workbook
      XLSX.writeFile(workbook, "PurchaseReport.xlsx");
    } catch (error) {
      console.error("Error fetching supplier data for export:", error);
      swal({
        icon: "error",
        title: "Export Error",
        text: "Failed to export supplier data. Please try again.",
      });
    }
  };

  useEffect(() => {
    fetchCutoff();
  }, []);

  //  function to handle the vendor click
  const handleVendorClick = (vendorId) => {
    navigate(`/purchases/vendor-update/${vendorId}?tab=purchase`, {
      state: { from: "purchase-report" },
    });
  };

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      {authrztn.includes("Reporting-View") ? (
        <>
          <div className="w-100 p-2 d-flex flex-row justify-content-between">
            <div className="d-flex flex-column title-custom">
              <span className="fs-3 text-uppercase">Purchase Report</span>
            </div>
            <div>
              <button className="btn btn-primary" onClick={toggleTable}>
                {showTable ? "Hide Overview" : "Show Overview"}
              </button>
              {authrztn.includes("Reporting-IE") && (
                <button
                  className="btn btn-success ms-2"
                  onClick={exportToExcel}
                >
                  Export to Excel
                </button>
              )}
            </div>
          </div>
          <div className="w-100 mx-auto">
            <div className="row mx-auto"></div>
            <div className="w-100 row mx-auto mt-2">
              <h6>Accounting Period</h6>
              <div className="col-sm mb-2">
                <label htmlFor="cutoff">Cutoff</label>
                <select
                  value={selectedCutOff?.id}
                  onChange={handleSelect}
                  className="form-select"
                  id="cutoff"
                  aria-label="Default select example"
                  onMouseDown={(e) => {
                    if (cutOffs.length === 0) {
                      e.preventDefault();
                      swal({
                        icon: "warning",
                        title: "No Cutoff Found",
                        text: "No cutoff records found. Please create a cutoff first in Monthly Cutoff Module.",
                      });
                      return;
                    }
                  }}
                >
                  {cutOffs.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-sm mb-2">
                <span>From</span>
                <DatePicker
                  selected={selectedCutOff?.from}
                  dateFormat="MMM/dd/yyyy"
                  className="form-control"
                  readOnly
                />
              </div>
              <div className="col-sm mb-2">
                <span>To</span>
                <DatePicker
                  selected={selectedCutOff?.to}
                  dateFormat="MMM/dd/yyyy"
                  className="form-control"
                  readOnly
                />
              </div>
              <div className="col-sm invisible d-flex flex-row align-items-end mb-2 filter-btn-container">
                <button className="btn">Apply Filter</button>
                <button className="btn btn-secondary">Clear Filter</button>
              </div>
              <div className="col-sm"></div>
            </div>
          </div>
          <div className="w-100 container-fluid mt-2">
            <div className="d-flex justify-content-between align-items-center">
              <h5>Overview</h5>
            </div>

            <CSSTransition
              in={showTable}
              timeout={300}
              classNames="slide"
              unmountOnExit
            >
              <div className="table-responsive mt-3">
                <table className="table table-bordered table-striped">
                  <tbody>
                    <tr>
                      <td>
                        Total purchase for the Period: [Total purchase Amount]
                      </td>
                      <td>
                        {overview?.totalPurchase?.toLocaleString("en-PH", {
                          style: "currency",
                          currency: "PHP",
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                    <tr>
                      <td>
                        Number of Transactions: [Total Number of Transactions]
                      </td>
                      <td>{overview?.numberOfTransactions}</td>
                    </tr>
                    <tr>
                      <td>Average purchase Value: [Average purchase Amount]</td>
                      <td>
                        {overview?.averagePurchaseValue?.toLocaleString(
                          "en-PH",
                          {
                            style: "currency",
                            currency: "PHP",
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          },
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td>Last Accounts Payable</td>
                      <td>
                        {overview?.lastAccountsPayable?.toLocaleString(
                          "en-PH",
                          {
                            style: "currency",
                            currency: "PHP",
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          },
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td>Accounts Paid</td>
                      <td>
                        {overview?.accountsPaid?.toLocaleString("en-PH", {
                          style: "currency",
                          currency: "PHP",
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                    <tr>
                      <td>Accounts Payable</td>
                      <td>
                        {overview?.accountsPayable?.toLocaleString("en-PH", {
                          style: "currency",
                          currency: "PHP",
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <table className="table table-bordered table-striped mt-4">
                  <tbody>
                    <tr>
                      <td>Comparison to Previous Period</td>
                      <td></td>
                    </tr>
                    <tr>
                      <td>Previous Period Purchase: [Previous Amount]</td>
                      <td>
                        {overview?.prevPeriodPurchase?.toLocaleString("en-PH", {
                          style: "currency",
                          currency: "PHP",
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                    <tr>
                      <td>Purchase Growth Index: [Percentage Change]%</td>
                      <td>
                        {overview?.purchaseGrowthIndex?.toLocaleString(
                          "en-US",
                          {
                            maximumFractionDigits: 2,
                            minimumFractionDigits: 2,
                          },
                        ) || 0}
                        %
                      </td>
                    </tr>
                    <tr>
                      <td>
                        Accounts Payable Turnover Ratio [Percentage Change]%
                      </td>
                      <td>
                        {overview?.apTurnOverRatio?.toLocaleString("en-US", {
                          maximumFractionDigits: 2,
                          minimumFractionDigits: 2,
                        }) || 0}
                        %
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CSSTransition>
          </div>

          <div className="container-fluid mt-2">
            <Tabs
              defaultActiveKey="prodService"
              id="uncontrolled-tab-example"
              className="mb-3"
            >
              <Tab eventKey="prodService" title="Product or Service">
                <div className="container-fluid">
                  <div className="row">
                    <div className="col-sm mb-3">
                      <div className="w-100 d-flex align-items-center mt-3 mb-3">
                        <h5>Purchase Breakdown by Product or Service</h5>
                        <hr className="flex-grow-1 mx-3" />
                      </div>

                      <div className="mt-3 mb-4">
                        <div className="input-group mb-3">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Search"
                            value={productSearchText}
                            onChange={(e) =>
                              setProductSearchText(e.target.value)
                            }
                          />
                          <button
                            type="button"
                            className="btn btn-outline-secondary dropdown-toggle-split"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                          >
                            <i className="fa-solid fa-sliders"></i>
                          </button>
                          <ul className="dropdown-menu dropdown-menu-end">
                            <li>
                              <button
                                className={`dropdown-item ${
                                  productFilterColumn === "all" ? "active" : ""
                                }`}
                                onClick={() => setProductFilterColumn("all")}
                              >
                                All
                              </button>
                            </li>
                            <li>
                              <button
                                className={`dropdown-item ${
                                  productFilterColumn === "product_code"
                                    ? "active"
                                    : ""
                                }`}
                                onClick={() =>
                                  setProductFilterColumn("product_code")
                                }
                              >
                                Product or Service Code
                              </button>
                            </li>
                            <li>
                              <button
                                className={`dropdown-item ${
                                  productFilterColumn === "product_name"
                                    ? "active"
                                    : ""
                                }`}
                                onClick={() =>
                                  setProductFilterColumn("product_name")
                                }
                              >
                                Name
                              </button>
                            </li>
                            <li>
                              <button
                                className={`dropdown-item ${
                                  productFilterColumn === "product_category"
                                    ? "active"
                                    : ""
                                }`}
                                onClick={() =>
                                  setProductFilterColumn("product_category")
                                }
                              >
                                Product Category
                              </button>
                            </li>
                            <li>
                              <button
                                className={`dropdown-item ${
                                  productFilterColumn === "unit_of_measure"
                                    ? "active"
                                    : ""
                                }`}
                                onClick={() =>
                                  setProductFilterColumn("unit_of_measure")
                                }
                              >
                                Unit of Measure
                              </button>
                            </li>
                          </ul>
                        </div>
                      </div>
                      <div className="table-responsive">
                        <table className="table table-bordered table-striped">
                          <thead>
                            <tr>
                              <th>Product or Service Code</th>
                              <th>Name</th>
                              <th>Purchase Net Quantity</th>
                              <th>Average Unit Price</th>
                              <th>Discount</th>
                              <th>Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {products.data.map((item) => (
                              <tr key={item.product_id}>
                                <td>{item.product_code}</td>
                                <td>{item.product_name}</td>
                                <td>
                                  {item.purchaseQuantity.toLocaleString(
                                    "en-PH",
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    },
                                  )}
                                </td>
                                <td>
                                  {item.averageUnitPrice?.toLocaleString(
                                    "en-PH",
                                    {
                                      style: "currency",
                                      currency: "PHP",
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    },
                                  )}
                                </td>
                                <td>TBA</td>
                                <td>
                                  {item.amount?.toLocaleString("en-PH", {
                                    style: "currency",
                                    currency: "PHP",
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="pb-2">
                          <PaginationControls {...products} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Tab>

              <Tab eventKey="supplier" title="Supplier">
                <div className="container-fluid">
                  <div className="row">
                    <div className="col-sm pb-3">
                      <div className="w-100 d-flex align-items-center mt-3 mb-3">
                        <h5>Purchase Breakdown by Supplier</h5>
                        <hr className="flex-grow-1 mx-3" />
                      </div>

                      <div className="mt-3 mb-4">
                        <div className="input-group mb-3">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Search"
                            value={supplierSearchText}
                            onChange={(e) =>
                              setSupplierSearchText(e.target.value)
                            }
                          />
                          <button
                            type="button"
                            className="btn btn-outline-secondary dropdown-toggle-split"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                          >
                            <i className="fa-solid fa-sliders"></i>
                          </button>
                          <ul className="dropdown-menu dropdown-menu-end">
                            <li>
                              <button
                                className={`dropdown-item ${
                                  supplierFilterColumn === "all" ? "active" : ""
                                }`}
                                onClick={() => setSupplierFilterColumn("all")}
                              >
                                All
                              </button>
                            </li>
                            <li>
                              <button
                                className={`dropdown-item ${
                                  supplierFilterColumn === "company_name"
                                    ? "active"
                                    : ""
                                }`}
                                onClick={() =>
                                  setSupplierFilterColumn("company_name")
                                }
                              >
                                Company Name
                              </button>
                            </li>
                            <li>
                              <button
                                className={`dropdown-item ${
                                  supplierFilterColumn === "company_nature"
                                    ? "active"
                                    : ""
                                }`}
                                onClick={() =>
                                  setSupplierFilterColumn("company_nature")
                                }
                              >
                                Company Nature
                              </button>
                            </li>
                            <li>
                              <button
                                className={`dropdown-item ${
                                  supplierFilterColumn === "company_address"
                                    ? "active"
                                    : ""
                                }`}
                                onClick={() =>
                                  setSupplierFilterColumn("company_address")
                                }
                              >
                                Company Address
                              </button>
                            </li>
                            <li>
                              <button
                                className={`dropdown-item ${
                                  supplierFilterColumn === "company_city"
                                    ? "active"
                                    : ""
                                }`}
                                onClick={() =>
                                  setSupplierFilterColumn("company_city")
                                }
                              >
                                Company City
                              </button>
                            </li>
                            <li>
                              <button
                                className={`dropdown-item ${
                                  supplierFilterColumn === "company_country"
                                    ? "active"
                                    : ""
                                }`}
                                onClick={() =>
                                  setSupplierFilterColumn("company_country")
                                }
                              >
                                Company Country
                              </button>
                            </li>
                          </ul>
                        </div>
                      </div>
                      <div className="table-responsive">
                        <table className="table table-bordered table-striped">
                          <thead>
                            <tr>
                              <th>Vendor Name</th>
                              <th>Last Account Balance</th>
                              <th>Purchase Net Quantity</th>
                              <th>Average Unit Price</th>
                              <th>New Purchase Amount</th>
                              <th>Accounts Paid</th>
                              <th>Accounts Payable</th>
                            </tr>
                          </thead>
                          <tbody>
                            {suppliers.data.map((item, index) => (
                              <tr key={item.vendorId}>
                                <td
                                  style={{
                                    color: "#333",
                                    cursor: "pointer",
                                    background: "none",
                                    border: "none",
                                    textDecoration: "underline",
                                  }}
                                  onClick={() =>
                                    handleVendorClick(item.vendorId)
                                  }
                                  onMouseEnter={(e) => {
                                    e.target.style.color = "#0066cc";
                                    e.target.style.textDecoration = "underline";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.color = "#333";
                                    e.target.style.textDecoration = "underline";
                                  }}
                                >
                                  {item.vendorName}
                                </td>

                                <td>
                                  {item.lastAccountBalance?.toLocaleString(
                                    "en-PH",
                                    {
                                      style: "currency",
                                      currency: "PHP",
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    },
                                  )}
                                </td>
                                <td>
                                  {item.purchaseQuantity.toLocaleString(
                                    "en-US",
                                    {
                                      maximumFractionDigits: 2,
                                      minimumFractionDigits: 2,
                                    },
                                  )}
                                </td>
                                <td>
                                  {(item.averageUnitPrice || 0)?.toLocaleString(
                                    "en-PH",
                                    {
                                      style: "currency",
                                      currency: "PHP",
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    },
                                  )}
                                </td>
                                <td>
                                  {item.newPurchaseAmount?.toLocaleString(
                                    "en-PH",
                                    {
                                      style: "currency",
                                      currency: "PHP",
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    },
                                  )}
                                </td>
                                <td>
                                  {item.accountsPaid?.toLocaleString("en-PH", {
                                    style: "currency",
                                    currency: "PHP",
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </td>
                                <td>
                                  {item.accountsPayable?.toLocaleString(
                                    "en-PH",
                                    {
                                      style: "currency",
                                      currency: "PHP",
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    },
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="pb-2">
                          <PaginationControls {...suppliers} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Tab>
            </Tabs>
          </div>
        </>
      ) : (
        <div className="no-access">
          <img src={NoAccess} alt="NoAccess" className="no-access-img" />
          <h3>You don't have access to this function.</h3>
        </div>
      )}
    </div>
  );
};

export default NewPurchaseReport;
