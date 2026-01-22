import React, { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Button, Form, Tab, Tabs, Table } from "react-bootstrap";
import swal from "sweetalert";
import DataTable from "react-data-table-component";
import { customStyles } from "../../../assets/table-style";
import "@fortawesome/fontawesome-free/css/all.min.css";
import BASE_URL from "../../../assets/global/url";
import Select from "react-select";
import { Link } from "react-router-dom";
import { CSSTransition } from "react-transition-group";
import "../../../assets/css/style.css";
import * as XLSX from "xlsx";
import DatePicker from "react-datepicker";

const SalesReport1 = () => {
  const [showTable, setShowTable] = useState(false);

  const [cutoffList, setCutoffList] = useState([]);
  const [selectedCutoff_id, setSelectedCutoff_id] = useState("");
  const [thisFromdate, setThisFromdate] = useState("");
  const [thisTodate, setThisTodate] = useState("");

  const [salesReport, setSalesReport] = useState([]);
  const [productListData, setProductListData] = useState([]);
  const [prevCutOff, setPrevCutOff] = useState([]);

  const toggleTable = () => {
    setShowTable(!showTable);
  };

  const getCutoff = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/cutoff/getCutoffs`);

      if (res.data.length > 0) {
        const firstCutoff = res.data[0];
        setCutoffList(res.data);
        setSelectedCutoff_id(firstCutoff.id);
        setThisFromdate(firstCutoff.from);
        setThisTodate(firstCutoff.to);
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    getCutoff();
  }, []);

  const handleCutoffChange = (value) => {
    setSelectedCutoff_id(value);
    const selectedCutoff = cutoffList.find(
      (cutoff) => String(cutoff.id) === String(value)
    );

    if (selectedCutoff) {
      setThisFromdate(selectedCutoff.from);
      setThisTodate(selectedCutoff.to);
    }
  };

  const fetchSalesReport = () => {
    axios
      .get(`${BASE_URL}/salesReport/getSalesReport`, {
        params: {
          cutoff_fromdate: thisFromdate,
          cutoff_todate: thisTodate,
        },
      })
      .then((res) => {
        const { data } = res.data;
        setSalesReport(data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const fetchProductList = () => {
    axios
      .get(`${BASE_URL}/salesReport/getSalesInvoiceInventoryByProduct`, {
        params: {
          cutoff_fromdate: thisFromdate,
          cutoff_todate: thisTodate,
        },
      })
      .then((res) => {
        const { data, previousSalesAmount } = res.data;
        setProductListData(data);
        setPrevCutOff(previousSalesAmount);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  useEffect(() => {
    if (prevCutOff) {
      console.log(
        "********************************************prevCutOff (Updated): ",
        prevCutOff
      );
    }
  }, [prevCutOff]);

  useEffect(() => {
    if (thisFromdate && thisTodate) {
      fetchSalesReport();
      fetchProductList();
    }
  }, [thisFromdate, thisTodate]);

  const getTotalSalesAmount = () => {
    return productListData.reduce((acc, data) => acc + (data.subtotal || 0), 0);
  };

  const getPrevTotalSalesAmount = () => {
    return prevCutOff.reduce((acc, data) => acc + (data.subtotal || 0), 0);
  };

  const getSalesGrowthIndex = () => {
    const currentSales = getTotalSalesAmount();
    const previousSales = getPrevTotalSalesAmount();

    if (previousSales === 0) {
      return currentSales > 0 ? 100 : 0;
    }

    return ((currentSales - previousSales) / previousSales) * 100;
  };

  const getTotalTransactions = () => {
    return productListData.length;
  };

  const getAccountsReceivable = () => {
    return productListData.reduce(
      (acc, data) =>
        acc +
        (!data.sales_invoice.payAdded
          ? data.sales_invoice.total_amount || 0
          : 0),
      0
    );
  };

  const getPreviousPeriodSales = () => {
    return productListData.reduce(
      (acc, data) => acc + (data.sales_invoice?.total_amount || 0),
      0
    );
  };

  const getAverageSaleValue = () => {
    const totalSales = getTotalSalesAmount();
    const totalTransactions = getTotalTransactions();
    return totalTransactions > 0
      ? (totalSales / totalTransactions).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : "0.00";
  };

  const getAccountsReceivableTurnover = () => {
    const totalSales = getTotalSalesAmount();
    const accountsReceivable = getAccountsReceivable();
    const lastAccountsReceivable = getTotalLastAccountsReceivable();

    if (accountsReceivable === 0 || lastAccountsReceivable === 0) {
      return 0;
    }

    const avgAccountsReceivable =
      (parseFloat(accountsReceivable) + parseFloat(lastAccountsReceivable)) / 2;
    return totalSales / avgAccountsReceivable;
  };

  const getAccountsReceivableTurnoverPercentageChange = () => {
    const currentTurnover = getAccountsReceivableTurnover();
    const previousTurnover =
      getPrevTotalSalesAmount() / getTotalLastAccountsReceivable();

    if (previousTurnover === 0) {
      return currentTurnover > 0 ? 100 : 0;
    }

    return ((currentTurnover - previousTurnover) / previousTurnover) * 100;
  };

  // const groupedSalesReport = salesReport.reduce((acc, item) => {
  //   const productName =
  //     item.sales_invoice.customer_id || "N/A";

  //     console.log("**********************************************productName: ", productName);

  //   if (!acc[productName]) {
  //     acc[productName] = {
  //       productName,
  //       quantity: 0,
  //       totalAmount: 0,
  //       transactions: [],
  //     };
  //   }

  //   acc[productName].quantity += item.quantity || 0;
  //   acc[productName].totalAmount += item.subtotal || 0;
  //   acc[productName].transactions.push(item);

  //   return acc;
  // }, {});

  // const groupedSalesArray = Object.values(groupedSalesReport).map((item) => ({
  //   ...item,
  //   averageUnitPrice: item.quantity > 0 ? item.totalAmount / item.quantity : 0,
  // }));

  const groupedProductList = productListData.reduce((acc, item) => {
    const productName =
      item.stock_management?.product_list?.product_name || "Unknown";

    if (!acc[productName]) {
      acc[productName] = {
        productName,
        totalQuantity: 0,
        totalAmount: 0,
        unitPrice: item.unit_price || 0,
        discount: item.discount_item || 0,
        productCode: item.stock_management.product_list.product_code,
      };
    }

    acc[productName].totalQuantity += item.quantity || 0;
    acc[productName].totalAmount += (item.subtotal || 0) * (item.rate || 1);

    return acc;
  }, {});

  const uniqueCustomers = Array.from(
    salesReport
      .reduce((map, data) => {
        // Ensure `sales_invoice` exists before accessing its properties
        if (!data?.sales_invoice || !data.sales_invoice.customer) {
          return map; // Skip this entry if it's missing data
        }

        const customer = data.sales_invoice.customer;
        const customerId = customer.customer_id;
        const invoiceDate = data.sales_invoice.invoice_date;
        const status = data.sales_invoice.status;

        if (!map.has(customerId)) {
          map.set(customerId, {
            name: customer.first_name
              ? `${customer.first_name} ${customer.last_name} ${
                  customer.company_name ?? ""
                }`.trim()
              : "N/A",
            quantity: 0,
            salesAmount: 0,
            totalPrice: 0,
            priceCount: 0,
            lastAccountBalance: 0,
            accountsReceived: 0,
            accountsReceivable: 0,
            average_price:
              data.average_price || 0 * (data.sales_invoice.rate || 1),
          });
        }

        if (
          invoiceDate >= thisFromdate &&
          invoiceDate <= thisTodate &&
          (status === "Approved" ||
            status === "Collected" ||
            status === "For-Collected")
        ) {
          map.get(customerId).quantity += data.quantity || 0;

          const totalAmount =
            (data.sales_invoice.total_amount || 0) *
            (data.sales_invoice.rate || 1);
          map.get(customerId).salesAmount = totalAmount;

          const averagePrice = data.average_price || 0;
          if (averagePrice > 0) {
            map.get(customerId).totalPrice += averagePrice;
            map.get(customerId).priceCount += 1;
          }
        }

        if (invoiceDate <= thisFromdate && status === "Approved") {
          const totalAmount =
            (data.sales_invoice.total_amount || 0) *
            (data.sales_invoice.rate || 1);
          map.get(customerId).lastAccountBalance += totalAmount;
        }

        if (
          invoiceDate >= thisFromdate &&
          invoiceDate <= thisTodate &&
          status === "Collected"
        ) {
          const totalAmount =
            (data.sales_invoice.total_amount || 0) *
            (data.sales_invoice.rate || 1);
          map.get(customerId).accountsReceived += totalAmount;
        }

        if (
          invoiceDate >= thisFromdate &&
          invoiceDate <= thisTodate &&
          status === "Approved"
        ) {
          const totalAmount =
            (data.sales_invoice.total_amount || 0) *
            (data.sales_invoice.rate || 1);
          map.get(customerId).accountsReceivable = totalAmount;
        }

        return map;
      }, new Map())
      .values()
  );

  const customersWithAveragePrice = uniqueCustomers.map((customer) => {
    const averagePrice =
      customer.priceCount > 0 ? customer.totalPrice / customer.priceCount : 0;
    return { ...customer, averagePrice };
  });

  const getTotalAccountsReceived = () => {
    return customersWithAveragePrice.reduce(
      (acc, data) => acc + (data.accountsReceived || 0),
      0
    );
  };

  const getTotalLastAccountsReceivable = () => {
    return customersWithAveragePrice
      .reduce((acc, data) => acc + (data.lastAccountBalance || 0), 0)
      .toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
  };

  // export
  const exportToExcel = () => {
    // Create a workbook
    const wb = XLSX.utils.book_new();

    // Prepare data for Excel export in columnar format
    const excelData = [];

    // Add title and cutoff information
    const selectedCutoff = cutoffList.find(
      (cutoff) => String(cutoff.id) === String(selectedCutoff_id)
    );
    const cutoffName = selectedCutoff ? selectedCutoff.name : "N/A";
    const fromDate = thisFromdate || "N/A";
    const toDate = thisTodate || "N/A";

    excelData.push(["SALES REPORT", "", "", "", "", "", ""]);
    excelData.push(["Cutoff Name:", cutoffName, "", "", "", "", ""]);
    excelData.push(["From:", fromDate, "", "To:", toDate, "", ""]);
    excelData.push([""]); // Empty row

    // Sales Overview Section
    excelData.push(["SALES OVERVIEW", "", "", "", "", "", ""]);
    excelData.push(["Metric", "Value", "", "", "", "", ""]);

    // Sales Overview Rows
    excelData.push([
      "Total Sales for the Period",
      getTotalSalesAmount().toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      "",
      "",
      "",
      "",
      "",
    ]);
    excelData.push([
      "Number of Transactions",
      getTotalTransactions(),
      "",
      "",
      "",
      "",
      "",
    ]);
    excelData.push([
      "Average Sale Value",
      getAverageSaleValue(),
      "",
      "",
      "",
      "",
      "",
    ]);
    excelData.push([
      "Last Accounts Receivable",
      getTotalLastAccountsReceivable(),
      "",
      "",
      "",
      "",
      "",
    ]);
    excelData.push([
      "Accounts Received",
      getTotalAccountsReceived().toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      "",
      "",
      "",
      "",
      "",
    ]);
    excelData.push([
      "Accounts Receivable",
      getAccountsReceivable().toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      "",
      "",
      "",
      "",
      "",
    ]);

    // Comparison Section
    excelData.push([""]); // Empty row
    excelData.push(["COMPARISON TO PREVIOUS PERIOD", "", "", "", "", "", ""]);
    excelData.push([
      "Previous Period Sales",
      getPrevTotalSalesAmount().toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      "",
      "",
      "",
      "",
      "",
    ]);
    excelData.push([
      "Sales Growth Index",
      getSalesGrowthIndex().toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) + "%",
      "",
      "",
      "",
      "",
      "",
    ]);
    excelData.push([
      "Accounts receivable turnover ratio",
      getAccountsReceivableTurnoverPercentageChange().toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) + "%",
      "",
      "",
      "",
      "",
      "",
    ]);

    excelData.push([""]); // Empty row

    // Product/Service Section
    excelData.push(["PRODUCT/SERVICE BREAKDOWN", "", "", "", "", "", ""]);
    excelData.push([
      "Product Code",
      "Name",
      "Quantity Sold",
      "Unit Price",
      "Discount",
      "Total Amount",
      "",
    ]);

    // Product/Service Rows
    Object.values(groupedProductList).forEach((data) => {
      excelData.push([
        data.productCode || "",
        data.productName || "",
        Number(data.totalQuantity || 0).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        Number(data.unitPrice || 0).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        (data.discount || 0) + "%",
        Number(data.totalAmount || 0).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        "",
      ]);
    });

    excelData.push([""]); // Empty row

    // Clients Section
    excelData.push(["CLIENT BREAKDOWN", "", "", "", "", "", ""]);
    excelData.push([
      "Client Name",
      "Last Account Balance",
      "Quantity Sold",
      "Average Unit Price",
      "New Sales Amount",
      "Accounts Received",
      "Accounts Receivable",
    ]);

    // Clients Rows
    customersWithAveragePrice.forEach((data) => {
      excelData.push([
        data.name || "",
        Number(data.lastAccountBalance || 0).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        Number(data.quantity || 0).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        Number(data.averagePrice || 0).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        Number(data.salesAmount || 0).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        Number(data.accountsReceived || 0).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        Number(data.accountsReceivable || 0).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
      ]);
    });

    // Create a worksheet
    const ws = XLSX.utils.aoa_to_sheet(excelData);

    // Apply styling by setting column widths and cell styles
    const wscols = [
      { wch: 30 }, // First column width
      { wch: 20 }, // Second column
      { wch: 15 }, // Third column
      { wch: 15 }, // Fourth column
      { wch: 15 }, // Fifth column
      { wch: 20 }, // Sixth column
      { wch: 20 }, // Seventh column
    ];
    ws["!cols"] = wscols;

    // Apply styling to headers and totals
    for (let i = 0; i < excelData.length; i++) {
      // Create cell addresses for all columns
      const cellAddresses = [];
      for (let c = 0; c < 7; c++) {
        cellAddresses.push(XLSX.utils.encode_cell({ r: i, c }));
      }

      // Style main title
      if (excelData[i][0] === "SALES REPORT") {
        cellAddresses.forEach((addr) => {
          if (!ws[addr]) ws[addr] = {};
          ws[addr].s = {
            font: { sz: 16, bold: true, color: { rgb: "000000" } },
            fill: { fgColor: { rgb: "D3D3D3" } },
          };
        });
      }

      // Style section headers
      if (
        excelData[i][0] === "SALES OVERVIEW" ||
        excelData[i][0] === "COMPARISON TO PREVIOUS PERIOD" ||
        excelData[i][0] === "PRODUCT/SERVICE BREAKDOWN" ||
        excelData[i][0] === "CLIENT BREAKDOWN"
      ) {
        cellAddresses.forEach((addr) => {
          if (!ws[addr]) ws[addr] = {};
          ws[addr].s = {
            font: { sz: 14, bold: true, color: { rgb: "000000" } },
            fill: { fgColor: { rgb: "E6E6E6" } },
          };
        });
      }

      // Style column headers
      if (
        excelData[i][0] === "Metric" ||
        excelData[i][0] === "Product Code" ||
        excelData[i][0] === "Client Name"
      ) {
        cellAddresses.forEach((addr) => {
          if (!ws[addr]) ws[addr] = {};
          ws[addr].s = {
            font: { sz: 12, bold: true, color: { rgb: "000000" } },
            fill: { fgColor: { rgb: "F0F0F0" } },
          };
        });
      }

      // Format all number cells
      if (
        i > 4 &&
        typeof excelData[i][1] === "string" &&
        excelData[i][1].includes(",")
      ) {
        cellAddresses.forEach((addr, idx) => {
          if (!ws[addr]) ws[addr] = {};
          if (
            idx === 1 ||
            idx === 2 ||
            idx === 3 ||
            idx === 4 ||
            idx === 5 ||
            idx === 6
          ) {
            ws[addr].s = { numFmt: "#,##0.00" };
          }
        });
      }
    }

    // Merge cells for title and section headers
    ws["!merges"] = [
      // Merge title row
      { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
      // Merge cutoff name row
      { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
      // Merge section headers
      { s: { r: 4, c: 0 }, e: { r: 4, c: 6 } },
      { s: { r: 12, c: 0 }, e: { r: 12, c: 6 } },
      { s: { r: 17, c: 0 }, e: { r: 17, c: 6 } },
      {
        s: { r: 17 + Object.values(groupedProductList).length + 2, c: 0 },
        e: { r: 17 + Object.values(groupedProductList).length + 2, c: 6 },
      },
    ];

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, "Sales Report");

    // Generate the Excel file
    const fileName = `Sales_Report_${fromDate}_to_${toDate}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="w-100 p-2 d-flex flex-row justify-content-between">
        <div className="d-flex flex-column title-custom">
          <span className="fs-3 text-uppercase">Sales Report</span>
        </div>
        <div>
          <div>
            <button className="btn btn-primary" onClick={toggleTable}>
              {showTable ? "Hide Overview" : "Show Overview"}
            </button>
            <Button variant="success" onClick={exportToExcel} className="ms-2">
              Export to Excel
            </Button>
          </div>
        </div>
      </div>
      <div className="w-100 row mx-auto mt-2">
        <h6>Accounting Period</h6>
        <div className="col-sm mb-2">
          <span>Cutoff Name</span>
          <Form.Select
            value={selectedCutoff_id}
            onChange={(e) => handleCutoffChange(e.target.value)}
            className="form-select"
          >
            {cutoffList.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </Form.Select>
        </div>
        <div className="col-sm mb-2">
          <span>From</span>
          {/* <input
            value={thisFromdate}
            type="date"
            readOnly
            onChange={(e) => setThisFromdate(e.target.value)}
            name=""
            className="form-control"
            id=""
          /> */}
          <DatePicker
            selected={thisFromdate}
            dateFormat="MMM dd, yyyy"
            className="form-control"
            readOnly
          />
        </div>
        <div className="col-sm mb-2">
          <span>To</span>
          {/* <input
            value={thisTodate}
            type="date"
            readOnly
            onChange={(e) => setThisTodate(e.target.value)}
            name=""
            className="form-control"
            id=""
          /> */}
          <DatePicker
            selected={thisTodate}
            dateFormat="MMM dd, yyyy"
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
                    {getTotalSalesAmount().toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                </tr>
                <tr>
                  <td>
                    Number of Transactions: [Total Number of Transactions]
                  </td>
                  <td>{getTotalTransactions()}</td>
                </tr>
                <tr>
                  <td>Average Sale Value: [Average Sale Amount]</td>
                  <td>
                    {getAverageSaleValue().toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                </tr>
                <tr>
                  <td>Last Accounts Receivable</td>
                  <td>
                    {getTotalLastAccountsReceivable().toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                </tr>
                <tr>
                  <td>Accounts Received</td>
                  <td>
                    {getTotalAccountsReceived().toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                </tr>
                <tr>
                  <td>Accounts Receivable</td>
                  <td>
                    {getAccountsReceivable().toLocaleString("en-US", {
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
                  <td>Previous Period Sales: [Previous Amount]</td>
                  <td>
                    {getPrevTotalSalesAmount().toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                </tr>
                <tr>
                  <td>Sales Growth Index: [Percentage Change]%</td>
                  <td>
                    {getSalesGrowthIndex().toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    %
                  </td>
                </tr>
                <tr>
                  <td>
                    Accounts receivable turnover ratio [Percentage Change]%
                  </td>
                  <td>
                    {getAccountsReceivableTurnoverPercentageChange().toLocaleString(
                      "en-US",
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}
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
                  <div className="table-responsive">
                    <table className="table table-bordered table-striped">
                      <thead>
                        <tr>
                          <th>Product or Service Code</th>
                          <th>Name</th>
                          <th>Quantity Sold</th>
                          <th>Unit Price</th>
                          <th>Discount</th>
                          <th>Total Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* {productListData.length > 0 ? (
                          productListData.map((data, i) => (
                            <tr key={i}>
                              <td>
                                {data.stock_management
                                  ? data.stock_management.product_list
                                      .product_code
                                  : "N/A"}
                              </td>
                              <td>
                                {data.stock_management
                                  ? data.stock_management.product_list
                                      .product_name
                                  : "N/A"}
                              </td>
                              <td>{data.quantity || 0}</td>
                              <td>{data.unit_price || 0}</td>
                              <td>{data.discount_item + "%" || 0}</td>
                              <td>{data.subtotal || 0}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6">No data available</td>
                          </tr>
                        )} */}

                        {Object.values(groupedProductList).map((data, i) => (
                          <tr key={i}>
                            <td>{data.productCode}</td>
                            <td>{data.productName}</td>
                            <td>
                              {Number(data.totalQuantity).toLocaleString(
                                "en-US",
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }
                              )}
                            </td>
                            <td>
                              {Number(data.unitPrice).toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td>{data.discount + "%"}</td>
                            <td>
                              {Number(data.totalAmount).toLocaleString(
                                "en-US",
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
                  <div className="table-responsive">
                    <table className="table table-bordered table-striped">
                      <thead>
                        <tr>
                          <th>Client Name</th>
                          <th>Last Account Balance</th>
                          <th>Quantity Sold</th>
                          <th>Average Unit Price</th>
                          <th>New Sales Amount</th>
                          <th>Accounts Received</th>
                          <th>Accounts Receivable</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customersWithAveragePrice.map((data, i) => (
                          <tr key={i}>
                            <td>{data.name}</td>
                            <td>
                              {Number(data.lastAccountBalance).toLocaleString(
                                "en-US",
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }
                              )}
                            </td>
                            <td>
                              {Number(data.quantity).toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td>
                              {Number(data.averagePrice).toLocaleString(
                                "en-US",
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }
                              )}
                            </td>
                            <td>
                              {Number(data.salesAmount).toLocaleString(
                                "en-US",
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }
                              )}
                            </td>
                            <td>
                              {Number(data.accountsReceived).toLocaleString(
                                "en-US",
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }
                              )}
                            </td>
                            <td>
                              {Number(data.accountsReceivable).toLocaleString(
                                "en-US",
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </Tab>
        </Tabs>
      </div>
    </div>
  );
};

export default SalesReport1;
