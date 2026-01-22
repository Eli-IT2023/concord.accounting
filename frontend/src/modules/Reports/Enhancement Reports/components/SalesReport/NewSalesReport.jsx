import React, { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Button, Form, Tab, Tabs, Table } from "react-bootstrap";
import swal from "sweetalert";
import DataTable from "react-data-table-component";
import { customStyles } from "../../../../../assets/table-style";
import "@fortawesome/fontawesome-free/css/all.min.css";
import BASE_URL from "../../../../../assets/global/url";
import Select from "react-select";
import { Link } from "react-router-dom";
import { CSSTransition } from "react-transition-group";
import "../../../../../assets/css/style.css";
import * as XLSX from "xlsx";
import DatePicker from "react-datepicker";
import NoAccess from "../../../../../assets/img/NoAccess.png";
import { useServerPagination } from "../../../../../hooks/customHook/paginationHook/useServerPagination";
import { PaginationControls } from "../../../../../hooks/customHook/paginationHook/usePagination";
import { useNavigate } from "react-router-dom";

const NewSalesReport = ({ authrztn }) => {
  // For cutoff filter
  const [cutOffs, setCutOffs] = useState([]);
  const [selectedCutoff, setSelectedCutoff] = useState({
    id: null,
    from: null,
    to: null,
  });

  // For overview
  const [showTable, setShowTable] = useState(false);
  const [overview, setOverview] = useState({
    totalSales: 0,
    numberOfTransactions: 0,
    averageSalesValue: 0,
    lastAccountsReceivable: 0,
    accountsReceived: 0,
    accountsReceivable: 0,
    prevPeriodSales: 0,
    salesGrowthIndex: 0,
    arTurnOverRatio: 0,
  });
  const toggleTable = () => {
    setShowTable(!showTable);
  };

  const [productSearchText, setProductSearchText] = useState("");
  const [productFilterColumn, setProductFilterColumn] = useState("all");
  const [clientSearchText, setClientSearchText] = useState("");
  const [clientFilterColumn, setClientFilterColumn] = useState("all");
  const navigate = useNavigate();

  // For product tab pagination
  // const products = useServerPagination(
  //   `${BASE_URL}/salesReport/products-tab`,
  //   10,
  //   {
  //     startDate: selectedCutoff?.from,
  //     endDate: selectedCutoff?.to,
  //   }
  // );
  const products = useServerPagination(
    `${BASE_URL}/salesReport/products-tab-search`,
    10,
    {
      startDate: selectedCutoff?.from,
      endDate: selectedCutoff?.to,
      searchFunction: productSearchText,
      filterColumn: productFilterColumn,
    },
  );

  // For clients tab pagination
  // const customers = useServerPagination(
  //   `${BASE_URL}/salesReport/clients-tab`,
  //   10,
  //   {
  //     startDate: selectedCutoff?.from,
  //     endDate: selectedCutoff?.to,
  //   }
  // );
  const customers = useServerPagination(
    `${BASE_URL}/salesReport/clients-tab-search`,
    10,
    {
      startDate: selectedCutoff?.from,
      endDate: selectedCutoff?.to,
      searchFunction: clientSearchText,
      filterColumn: clientFilterColumn,
    },
  );

  // Helper: Formats a number to 2 decimals, optionally as a specified currency
  const formatTwoDecimalPlaces = ({ number = 0, currency }) =>
    number?.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      ...(currency && {
        style: "currency",
        currency,
      }),
    });

  // New fetching to get Sales Breakdown by product (Table)
  // const getProducts = (cutoff) => {
  //   products.updateApiUrl(`${BASE_URL}/salesReport/products-tab`);
  //   products.updateParams({
  //     startDate: cutoff?.from,
  //     endDate: cutoff?.to,
  //   });
  // };
  const getProducts = (cutoff) => {
    products.updateApiUrl(`${BASE_URL}/salesReport/products-tab-search`);
    products.updateParams({
      startDate: cutoff?.from,
      endDate: cutoff?.to,
      searchFunction: productSearchText,
      filterColumn: productFilterColumn,
    });
  };

  useEffect(() => {
    if (selectedCutoff?.from && selectedCutoff?.to) {
      getProducts(selectedCutoff);
    }
  }, [productSearchText, productFilterColumn]);

  useEffect(() => {
    setProductSearchText("");
  }, [productFilterColumn]);

  // New fetching to get Sales Breakdown by clients (Table)
  const getCustomers = (cutoff) => {
    customers.updateApiUrl(`${BASE_URL}/salesReport/clients-tab-search`);
    customers.updateParams({
      startDate: cutoff?.from,
      endDate: cutoff?.to,
      searchFunction: clientSearchText,
      filterColumn: clientFilterColumn,
    });
  };

  useEffect(() => {
    if (selectedCutoff?.from && selectedCutoff?.to) {
      getCustomers(selectedCutoff);
    }
  }, [clientSearchText, clientFilterColumn]);

  useEffect(() => {
    setClientSearchText("");
  }, [clientFilterColumn]);

  // Fetch overview summary
  const getOverview = async (cutoff) => {
    try {
      const res = await axios.get(`${BASE_URL}/salesReport/overview`, {
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
  const fetchCutoff = () => {
    axios.get(`${BASE_URL}/salesReport/getCutoffs`).then((res) => {
      const latestCutoff = res.data.reduce((latest, current) =>
        new Date(current.to) > new Date(latest.to) ? current : latest,
      );

      setCutOffs(res.data); // store all cut off
      setSelectedCutoff({
        id: latestCutoff.id,
        from: new Date(latestCutoff.from),
        to: new Date(latestCutoff.to),
      });

      getOverview(latestCutoff);
      getProducts(latestCutoff);
      getCustomers(latestCutoff);
    });
  };

  // Handle cutoff change
  const handleSelect = (e) => {
    const selectedValue = e.target.value;
    const selectedItem = cutOffs.find((item) => item.id === selectedValue);

    if (selectedItem) {
      const cutoff = {
        id: selectedItem.id,
        from: new Date(selectedItem.from),
        to: new Date(selectedItem.to),
      };

      setSelectedCutoff(cutoff);
      getOverview(cutoff);
      getProducts(cutoff);
      getCustomers(cutoff);
    }
  };

  useEffect(() => {
    fetchCutoff();
  }, []);

  // export
  const exportToExcel = async () => {
    try {
      // Create a workbook
      const workbook = XLSX.utils.book_new();

      // Add title and cutoff information
      const cutoff = cutOffs?.find((c) => c.id === selectedCutoff?.id);
      const cutoffName = cutoff ? cutoff.name : "N/A";
      const toISO = (d) => d?.toISOString().split("T")[0];
      const startDate = toISO(selectedCutoff?.from);
      const endDate = toISO(selectedCutoff?.to);

      // Overview Sheet Data
      const overviewData = [
        ["Sales Report Overview"],
        ["Cutoff Name", cutoffName],
        ["Start Date", startDate],
        ["End Date", endDate],
        [],
        ["SALES OVERVIEW"],
        [
          "Total Sales for the Period",
          formatTwoDecimalPlaces({
            number: overview?.totalSales,
            currency: "PHP",
          }),
        ],
        ["Number of Transactions", overview?.numberOfTransactions],
        [
          "Average Sale Value",
          formatTwoDecimalPlaces({
            number: overview?.averageSalesValue,
            currency: "PHP",
          }),
        ],
        [
          "Last Accounts Receivable",
          formatTwoDecimalPlaces({
            number: overview?.lastAccountsReceivable,
            currency: "PHP",
          }),
        ],
        [
          "Accounts Received",
          formatTwoDecimalPlaces({
            number: overview?.accountsReceived,
            currency: "PHP",
          }),
        ],
        [
          "Accounts Receivable",
          formatTwoDecimalPlaces({
            number: overview?.accountsReceivable,
            currency: "PHP",
          }),
        ],
        [],
        ["COMPARISON TO PREVIOUS PERIOD"],
        [
          "Previous Period Sales",
          formatTwoDecimalPlaces({
            number: overview?.prevPeriodSales,
            currency: "PHP",
          }),
        ],
        [
          "Sales Growth Index",
          formatTwoDecimalPlaces({
            number: overview?.salesGrowthIndex,
            currency: null,
          }) + "%",
        ],
        [
          "Accounts receivable turnover ratio",
          formatTwoDecimalPlaces({
            number: overview?.arTurnOverRatio,
            currency: null,
          }) + "%",
        ],
      ];
      const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData);
      XLSX.utils.book_append_sheet(workbook, overviewSheet, "Overview");

      // Fetch ALL product data for export
      const allProductsResponse = await axios.get(
        `${BASE_URL}/salesReport/products-tab-search`,
        {
          params: {
            startDate: selectedCutoff?.from,
            endDate: selectedCutoff?.to,
            searchFunction: "",
            filterColumn: "all",
            page: 1,
            limit: 999999, // Get all records
          },
        },
      );

      // Product or Service Sheet Data
      const productData = allProductsResponse.data.data.map((item) => [
        item.product_code,
        item.product_name,
        formatTwoDecimalPlaces({
          number: item.netQuantitySold,
          currency: null,
        }),
        formatTwoDecimalPlaces({
          number: item.averageUnitPrice || 0,
          currency: "PHP",
        }),
        formatTwoDecimalPlaces({ number: item.discount, currency: null }) + "%",
        formatTwoDecimalPlaces({ number: item.amount, currency: "PHP" }),
      ]);

      const productSheet = XLSX.utils.aoa_to_sheet([
        ["Sales Report - Product or Service"],
        ["Cutoff Name", cutoffName],
        ["Start Date", startDate],
        ["End Date", endDate],
        [],
        [
          "Product Code",
          "Name",
          "Net Quantity Sold",
          "Average Unit Price",
          "Discount",
          "Total Amount",
        ],
        ...productData,
      ]);
      XLSX.utils.book_append_sheet(
        workbook,
        productSheet,
        "Product or Service",
      );

      // Fetch ALL customer data for export
      const allCustomersResponse = await axios.get(
        `${BASE_URL}/salesReport/clients-tab-search`,
        {
          params: {
            startDate: selectedCutoff?.from,
            endDate: selectedCutoff?.to,
            searchFunction: "",
            filterColumn: "all",
            page: 1,
            limit: 999999, // Get all records
          },
        },
      );

      // Clients Sheet Data - Filter out rows where accountsReceivable is 0
      const clientData = allCustomersResponse.data.data
        .filter((item) => item.accountsReceivable !== 0)
        .map((item) => [
          item.customerName,
          formatTwoDecimalPlaces({
            number: item.lastAccountBalance,
            currency: "PHP",
          }),
          formatTwoDecimalPlaces({
            number: item.netQuantitySold,
            currency: null,
          }),
          formatTwoDecimalPlaces({
            number: item.averageUnitPrice || 0,
            currency: "PHP",
          }),
          formatTwoDecimalPlaces({
            number: item.newSalesAmount,
            currency: "PHP",
          }),
          formatTwoDecimalPlaces({
            number: item.accountsReceived,
            currency: "PHP",
          }),
          formatTwoDecimalPlaces({
            number: item.accountsReceivable,
            currency: "PHP",
          }),
        ]);

      const clientSheet = XLSX.utils.aoa_to_sheet([
        ["Sales Report - Clients"],
        ["Cutoff Name", cutoffName],
        ["Start Date", startDate],
        ["End Date", endDate],
        [],
        [
          "Client Name",
          "Last Account Balance",
          "Net Quantity Sold",
          "Average Unit Price",
          "New Sales Amount",
          "Accounts Received",
          "Accounts Receivable",
        ],
        ...clientData,
      ]);
      XLSX.utils.book_append_sheet(workbook, clientSheet, "Clients");

      // Apply styling
      const applyStyling = (sheet, labelRows) => {
        const range = XLSX.utils.decode_range(sheet["!ref"]);
        for (let R = range.s.r; R <= range.e.r; ++R) {
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const cell_address = { c: C, r: R };
            const cell_ref = XLSX.utils.encode_cell(cell_address);
            if (!sheet[cell_ref]) continue;
            sheet[cell_ref].s = {
              font: { bold: labelRows.includes(R) },
              fill: { fgColor: { rgb: "FFFFCC" } },
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

      applyStyling(overviewSheet, [0, 1, 2, 3, 5, 13]);
      applyStyling(productSheet, [0, 1, 2, 3, 5]);
      applyStyling(clientSheet, [0, 1, 2, 3, 5]);

      // Generate the Excel file
      const fileName = `Sales_Report_${startDate}_to_${endDate}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      swal({
        icon: "error",
        title: "Export Error",
        text: "Failed to export data. Please try again.",
      });
    }
  };

  // function to handle the client click
  const handleClientClick = (customerId) => {
    navigate(`/initUpdate/${customerId}`, {
      state: { from: "sales-report" },
    });
  };

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      {authrztn.includes("Reporting-View") ? (
        <>
          <div className="w-100 p-2 d-flex flex-row justify-content-between">
            <div className="d-flex flex-column title-custom">
              <span className="fs-3 text-uppercase">Sales Report</span>
            </div>
            <div>
              <div>
                <button className="btn btn-primary" onClick={toggleTable}>
                  {showTable ? "Hide Overview" : "Show Overview"}
                </button>
                {authrztn.includes("Reporting-IE") && (
                  <Button
                    variant="success"
                    onClick={exportToExcel}
                    className="ms-2"
                  >
                    Export to Excel
                  </Button>
                )}
              </div>
            </div>
          </div>
          <div className="w-100 row mx-auto mt-2">
            <h6>Accounting Period</h6>
            <div className="col-sm mb-2">
              <span>Cutoff</span>
              <Form.Select
                value={selectedCutoff.id}
                onChange={handleSelect}
                className="form-select"
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
                {cutOffs.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </Form.Select>
            </div>
            <div className="col-sm mb-2">
              <span>From</span>
              <DatePicker
                selected={selectedCutoff?.from}
                dateFormat="MMM/dd/yyyy"
                className="form-control"
                readOnly
              />
            </div>
            <div className="col-sm mb-2">
              <span>To</span>
              <DatePicker
                selected={selectedCutoff?.to}
                dateFormat="MMM/dd/yyyy"
                className="form-control"
                readOnly
              />
            </div>
            <div className="col-sm"></div>
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
                      <td>Total Sales for the Period: [Total Sales Amount]</td>
                      <td>
                        {formatTwoDecimalPlaces({
                          number: overview?.totalSales,
                          currency: "PHP",
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
                      <td>Average Sale Value: [Average Sale Amount]</td>
                      <td>
                        {formatTwoDecimalPlaces({
                          number: overview?.averageSalesValue,
                          currency: "PHP",
                        })}
                      </td>
                    </tr>
                    <tr>
                      <td>Last Accounts Receivable</td>
                      <td>
                        {formatTwoDecimalPlaces({
                          number: overview?.lastAccountsReceivable,
                          currency: "PHP",
                        })}
                      </td>
                    </tr>
                    <tr>
                      <td>Accounts Received</td>
                      <td>
                        {formatTwoDecimalPlaces({
                          number: overview?.accountsReceived,
                          currency: "PHP",
                        })}
                      </td>
                    </tr>
                    <tr>
                      <td>Accounts Receivable</td>
                      <td>
                        {formatTwoDecimalPlaces({
                          number: overview?.accountsReceivable,
                          currency: "PHP",
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
                      <td>Previous Period Sales: [Previous Amount]</td>
                      <td>
                        {formatTwoDecimalPlaces({
                          number: overview?.prevPeriodSales,
                          currency: "PHP",
                        })}
                      </td>
                    </tr>
                    <tr>
                      <td>Sales Growth Index: [Percentage Change]%</td>
                      <td>
                        {formatTwoDecimalPlaces({
                          number: overview?.salesGrowthIndex,
                          currency: null,
                        })}
                        %
                      </td>
                    </tr>
                    <tr>
                      <td>
                        Accounts receivable turnover ratio [Percentage Change]%
                      </td>
                      <td>
                        {formatTwoDecimalPlaces({
                          number: overview?.arTurnOverRatio,
                          currency: null,
                        })}
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
                        <h5>Sales Breakdown by Product or Service</h5>
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
                                Product Name
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

                      <div className="table-responsive pb-2">
                        <table className="table table-bordered table-striped">
                          <thead>
                            <tr>
                              <th>Product or Service Code</th>
                              <th>Name</th>
                              <th>Net Quantity Sold</th>
                              <th>Average Unit Price</th>
                              <th>Discount</th>
                              <th>Total Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {/* prettier-ignore */}
                            <React.Fragment>
                              {products.data.map((item) => (
                                <tr key={item.product_code}>
                                  <td>{item.product_code}</td>
                                  <td>{item.product_name}</td>
                                  <td>{formatTwoDecimalPlaces({ number: item.netQuantitySold, currency: null })}</td>
                                  <td>{formatTwoDecimalPlaces({ number: item.averageUnitPrice, currency: "PHP" })}</td>
                                  <td>{formatTwoDecimalPlaces({ number: item.discount, currency: null })}%</td>
                                  <td>{formatTwoDecimalPlaces({ number: item.amount, currency: "PHP" })}</td>
                                </tr>
                              ))}
                            </React.Fragment>
                          </tbody>
                        </table>
                        <PaginationControls {...products} />
                      </div>
                    </div>
                  </div>
                </div>
              </Tab>

              <Tab eventKey="clients" title="Clients">
                <div className="container-fluid">
                  <div className="row">
                    <div className="col-sm mb-3">
                      <div className="w-100 d-flex align-items-center mt-3 mb-3">
                        <h5>Sales Breakdown by Clients</h5>
                        <hr className="flex-grow-1 mx-3" />
                      </div>

                      <div className="mt-3 mb-4">
                        <div className="input-group mb-3">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Search"
                            value={clientSearchText}
                            onChange={(e) =>
                              setClientSearchText(e.target.value)
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
                                  clientFilterColumn === "all" ? "active" : ""
                                }`}
                                onClick={() => setClientFilterColumn("all")}
                              >
                                All
                              </button>
                            </li>
                            <li>
                              <button
                                className={`dropdown-item ${
                                  clientFilterColumn === "client_name"
                                    ? "active"
                                    : ""
                                }`}
                                onClick={() =>
                                  setClientFilterColumn("client_name")
                                }
                              >
                                Client Name
                              </button>
                            </li>
                            <li>
                              <button
                                className={`dropdown-item ${
                                  clientFilterColumn === "company_address"
                                    ? "active"
                                    : ""
                                }`}
                                onClick={() =>
                                  setClientFilterColumn("company_address")
                                }
                              >
                                Company Address
                              </button>
                            </li>
                            <li>
                              <button
                                className={`dropdown-item ${
                                  clientFilterColumn === "country"
                                    ? "active"
                                    : ""
                                }`}
                                onClick={() => setClientFilterColumn("country")}
                              >
                                Country
                              </button>
                            </li>
                            <li>
                              <button
                                className={`dropdown-item ${
                                  clientFilterColumn === "company_name"
                                    ? "active"
                                    : ""
                                }`}
                                onClick={() =>
                                  setClientFilterColumn("company_name")
                                }
                              >
                                Company Name
                              </button>
                            </li>
                            <li>
                              <button
                                className={`dropdown-item ${
                                  clientFilterColumn === "company_nature"
                                    ? "active"
                                    : ""
                                }`}
                                onClick={() =>
                                  setClientFilterColumn("company_nature")
                                }
                              >
                                Company Nature
                              </button>
                            </li>
                          </ul>
                        </div>
                      </div>
                      <div className="table-responsive">
                        <table className="table table-bordered table-striped">
                          <thead>
                            <tr>
                              <th>Client Name</th>
                              <th>Last Account Balance</th>
                              <th>Net Quantity Sold</th>
                              <th>Average Unit Price</th>
                              <th>New Sales Amount</th>
                              <th>Accounts Received</th>
                              <th>Accounts Receivable</th>
                            </tr>
                          </thead>
                          <tbody>
                            {/* prettier-ignore */}
                            <React.Fragment>
                              {customers.data.map((item) => (
                                <tr key={item.customerId}>
                                  <td 
                                    style={{
                                      color: "#333",
                                      cursor: "pointer",
                                      background: "none",
                                      border: "none",
                                      textDecoration: "underline",
                                    }}
                                    onClick={() => handleClientClick(item.customerId)}
                                    onMouseEnter={(e) => {
                                      e.target.style.color = "#0066cc";
                                      e.target.style.textDecoration = "underline";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.target.style.color = "#333";
                                      e.target.style.textDecoration = "underline";
                                    }}>{item.customerName}
                                  </td>
                                  <td>{formatTwoDecimalPlaces({ number: item.lastAccountBalance, currency: "PHP" })}</td>
                                  <td>{formatTwoDecimalPlaces({ number: item.netQuantitySold, currency: null })}</td>
                                  <td>{formatTwoDecimalPlaces({ number: item.averageUnitPrice, currency: "PHP" })}</td>
                                  <td>{formatTwoDecimalPlaces({ number: item.newSalesAmount, currency: "PHP" })}</td>
                                  <td>{formatTwoDecimalPlaces({ number: item.accountsReceived, currency: "PHP" })}</td>
                                  <td>{formatTwoDecimalPlaces({ number: item.accountsReceivable, currency: "PHP" })}</td>
                                </tr>
                              ))}
                            </React.Fragment>
                          </tbody>
                        </table>
                        <PaginationControls {...customers} />
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

export default NewSalesReport;
