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
import { useServerPagination } from "../../../../../hooks/customHook/paginationHook/useServerPagination";

const PurchaseReport1 = ({ authrztn }) => {
  const [showTable, setShowTable] = useState(false);

  // For fetchings
  const [productTable, setProductTable] = useState([]);
  const [supplierTable, setSupplierTable] = useState([]);
  const [supplierPaginationTable, setSupplierPaginationTable] = useState([]);
  const [productPaginationTable, setProductPaginationTable] = useState([]);
  const [prevCutOffSupplier, setPrevCutOffSupplier] = useState([]);
  const [purchaseGrowthIdx, setPurchaseGrowthIdx] = useState(0);
  const [cutOffs, setCutOffs] = useState([]); // state for all cut off
  const [payable, setPayable] = useState([]); // state for all payable filtered by purchaseDate

  const [selectedCutOff, setSelectedCutOff] = useState(""); // state for input select
  const [cutOffDate, setCutOffDate] = useState(""); // state for input date
  const [accountsPayableTurnOverRatio, setAccountsPayableTurnOverRatio] =
    useState(0);
  const supplierPagination = useServerPagination(
    `${BASE_URL}/purchase_report/supplier/table-pagination`,
    10,
    {
      startDate: cutOffDate?.from,
      endDate: cutOffDate?.to,
    }
  );

  const productPagination = useServerPagination(
    `${BASE_URL}/purchase_report/product/table-pagination`,
    10,
    {
      startDate: cutOffDate?.from,
      endDate: cutOffDate?.to,
    }
  );

  const toggleTable = () => {
    setShowTable(!showTable);
  };

  const fetchProduct = async (cutOff) => {
    await axios
      .get(`${BASE_URL}/purchase_report/getProductReport`, {
        params: {
          startDate: cutOff?.from,
          endDate: cutOff?.to,
        },
      })
      .then((res) => {
        setProductTable(res.data);
        console.log(res.data, "product data===============");
      });
  };

  const fetchSupplierProductPagination = (cutOff) => {
    supplierPagination.updateParams({
      startDate: cutOff?.from,
      endDate: cutOff?.to,
    });

    productPagination.updateParams({
      startDate: cutOff?.from,
      endDate: cutOff?.to,
    });
  };

  const fetchSupplier = async (cutOff) => {
    await axios
      .get(`${BASE_URL}/purchase_report/getSupplierReport`, {
        params: {
          startDate: cutOff?.from,
          endDate: cutOff?.to,
        },
      })
      .then((res) => {
        setSupplierTable(
          res.data.data.sort(function (a, b) {
            return a.vendorId - b.vendorId;
          })
        );
      });
  };

  const fetchPayable = async (cutOff) => {
    await axios
      .get(`${BASE_URL}/purchase_report/getPayable`, {
        params: {
          startDate: cutOff?.from,
          endDate: cutOff?.to,
        },
      })
      .then((res) => {
        setPayable(res.data);
      });
  };

  const fetchPrevCutOffSupplier = async (cutOffDate, cutOffs) => {
    const mappedCutOffDate = cutOffs?.map((item) => {
      return item.to;
    }); // get all end date
    const sortedDate = mappedCutOffDate.sort(
      (a, b) => new Date(a) - new Date(b)
    );
    let index = sortedDate.indexOf(cutOffDate?.to); // current cut off end date
    let prevDate = sortedDate[parseInt(index) - 1]; // get the previous cut off end date
    const filteredCutOffDate = cutOffs?.find((item) => {
      return item.to == prevDate;
    }); // returns previous cut off date in object form
    await axios
      .get(`${BASE_URL}/purchase_report/getSupplierReport`, {
        params: {
          startDate: filteredCutOffDate?.from,
          endDate: filteredCutOffDate?.to,
        },
      })
      .then((res) => {
        setPrevCutOffSupplier(res.data.data);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const fetchCutoff = async () => {
    await axios
      .get(`${BASE_URL}/purchase_report/getCutoffs`)
      .then(async (res) => {
        let defaultCutOff = res.data[0];
        // get the latest date for default cut off
        for (let index = 1; index < res.data.length; index++) {
          if (res.data[index].to > defaultCutOff.to) {
            defaultCutOff = res.data[index];
          }
        }
        setCutOffs(res.data); // store all cut off
        setSelectedCutOff(defaultCutOff); // set default cut off
        fetchSupplier(defaultCutOff);
        fetchSupplierProductPagination(defaultCutOff);
        fetchProduct(defaultCutOff);
        fetchPayable(defaultCutOff);
        purchaseGrowthIndex(defaultCutOff, res.data);
        fetchPrevCutOffSupplier(defaultCutOff, res.data);
        apTurnOverRatio(defaultCutOff);
      });
  };

  // set start and end date for input date
  const startAndEndDate = useCallback(() => {
    const [filteredCutoff] = cutOffs.filter((item) => {
      return item.id === selectedCutOff?.id;
    });

    setCutOffDate(filteredCutoff); // set state for input date
    // fetchPrevCutOffSupplier(filteredCutoff, cutOffs);
  }, [cutOffs, selectedCutOff]);

  // handle change select cutoff date
  const handleSelect = (e) => {
    const [filteredCutoff] = cutOffs.filter((item) => {
      return item.id == e.target.value;
    });

    setSelectedCutOff(filteredCutoff);
    fetchSupplier(filteredCutoff);
    fetchSupplierProductPagination(filteredCutoff);
    fetchProduct(filteredCutoff);
    fetchPayable(filteredCutoff);
    fetchPrevCutOffSupplier(filteredCutoff, cutOffs);
    purchaseGrowthIndex(filteredCutoff, cutOffs);
    apTurnOverRatio(filteredCutoff);
  };

  // Total purchase for the period
  const totalPurchase = () => {
    let totalPurchase = 0;
    supplierTable.forEach((item) => {
      totalPurchase += item.amount;
    });
    return totalPurchase;
  };

  // Average Purchase Value
  const averagePurchase = totalPurchase() / payable?.length;

  // Last Accounts Payable
  const lastAccountsPayable = () => {
    let payables = [...payable];
    let lastAccountsPayable = payables[0];
    for (let index = 1; index < payables.length; index++) {
      if (payables[index].purchaseDate > lastAccountsPayable.purchaseDate) {
        lastAccountsPayable = payables[index];
      }
    }
    return (
      lastAccountsPayable?.totalPrice *
      lastAccountsPayable?.currency?.currency_rate
    );
  };

  // Accounts Paid
  const totalAccountsPaid = supplierTable.reduce((total, value) => {
    return total + value.amountsPaid;
  }, 0);

  // Accounts Payable
  const totalAccountsPayable = supplierTable.reduce((total, value) => {
    return total + value.totalAccountsPayable;
  }, 0);

  // Previous period purchase
  const prevTotalPurchase = () => {
    let totalPurchase = 0;
    prevCutOffSupplier.forEach((item) => {
      totalPurchase += item.amount;
    });
    return totalPurchase;
  };

  // console.log(`payable: ${JSON.stringify(payable)}`);
  // Purchase Growth Index
  const purchaseGrowthIndex = async (cutOffDate, cutOffs) => {
    try {
      // ----- For current cutoff total purchase -----
      let supplierTable = [];
      await axios
        .get(`${BASE_URL}/purchase_report/getSupplierReport`, {
          params: {
            startDate: cutOffDate?.from,
            endDate: cutOffDate?.to,
          },
        })
        .then((res) => {
          supplierTable = res.data.data;
        });
      let totalPurchase = 0;
      supplierTable.forEach((item) => {
        totalPurchase += item.amount;
      });

      // ----- For previous cutoff total purchase -----
      let prevCutOffSupplierTable = [];
      const mappedCutOffDate2 = cutOffs?.map((item) => {
        return item.to;
      }); // get all end date
      const sortedDate2 = mappedCutOffDate2.sort(
        (a, b) => new Date(a) - new Date(b)
      );
      let indexEndDate = sortedDate2.indexOf(cutOffDate?.to); // current cut off end date index
      let prevDate = sortedDate2[parseInt(indexEndDate) - 1]; // get the previous cut off end date
      const filteredCutOffDate = cutOffs?.find((item) => {
        return item.to == prevDate;
      }); // returns previous cut off date in object form
      await axios
        .get(`${BASE_URL}/purchase_report/getSupplierReport`, {
          params: {
            startDate: filteredCutOffDate?.from,
            endDate: filteredCutOffDate?.to,
          },
        })
        .then((res) => {
          prevCutOffSupplierTable = res.data.data;
        })
        .catch((error) => {
          console.log(error);
        });
      let prevTotalPurchase = 0;
      prevCutOffSupplierTable.forEach((item) => {
        prevTotalPurchase += item.amount;
      });

      // ----- Difference between Current purchase period and Previous purchase period -----
      let absoluteChange = totalPurchase - prevTotalPurchase;

      // ----- For Last period purchase -----
      const mappedCutOffDate = cutOffs?.map((item) => {
        return { startDate: item.from, endDate: item.to };
      }); // get all end date
      const sortedDate = mappedCutOffDate?.sort(
        (a, b) => new Date(a.startDate) - new Date(b.startDate)
      );
      let index = sortedDate.findIndex((item) => {
        return item.endDate == cutOffDate?.to;
      }); // current cut off end date index
      const lastPeriodPurchaseDate = sortedDate
        .slice(0, index)
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
      const res = await axios.get(
        `${BASE_URL}/purchase_report/getSupplierReport`,
        {
          params: {
            startDate: lastPeriodPurchaseDate[0]?.startDate,
            endDate:
              lastPeriodPurchaseDate[lastPeriodPurchaseDate.length - 1]
                ?.endDate,
          },
        }
      );
      const lastPeriodPurchase = res.data.data.reduce((total, value) => {
        return total + value.amount;
      }, 0);

      if (lastPeriodPurchase === 0) {
        return setPurchaseGrowthIdx(0);
      } // avoid growthRate to divide by 0;

      // ----- Purchase Growth Index Result in Percentage -----
      let growthRate = absoluteChange / prevTotalPurchase;
      const purchaseGrowthIndexResult = (growthRate && growthRate * 100) || 0;
      setPurchaseGrowthIdx(purchaseGrowthIndexResult);
    } catch (error) {
      console.error(error);
    }
  };

  const apTurnOverRatio = async (cutOffDate) => {
    // For Current purchase total
    let supplierTable = [];
    await axios
      .get(`${BASE_URL}/purchase_report/getSupplierReport`, {
        params: {
          startDate: cutOffDate?.from,
          endDate: cutOffDate?.to,
        },
      })
      .then((res) => {
        supplierTable = res.data.data;
      });
    let totalPurchase = 0;
    supplierTable.forEach((item) => {
      totalPurchase += item.amount;
    });

    // For Current Accounts Paid
    const totalAccountsPaid = supplierTable.reduce((total, value) => {
      return total + value.amountsPaid;
    }, 0);

    // For Last Accounts Payable
    let payables = [];
    await axios
      .get(`${BASE_URL}/purchase_report/getPayable`, {
        params: {
          startDate: cutOffDate?.from,
          endDate: cutOffDate?.to,
        },
      })
      .then((res) => {
        payables = res.data;
      });
    let lastAccountsPayable = payables[0];
    for (let index = 1; index < payables.length; index++) {
      if (payables[index].purchaseDate > lastAccountsPayable.purchaseDate) {
        lastAccountsPayable = payables[index];
      }
    }
    const lastAccountsPayableTotal =
      lastAccountsPayable?.totalPrice *
      lastAccountsPayable?.currency?.currency_rate;

    // Accounts Payable Turn Over Ratio Result in Percentage
    const accountsPayableTurnOverRatioTotal =
      (totalAccountsPaid / (lastAccountsPayableTotal + totalPurchase)) * 100 ||
      0;
    setAccountsPayableTurnOverRatio(accountsPayableTurnOverRatioTotal);
  };

  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();

    // Overview Data with Headers
    const overviewData = [
      ["Accounting Period", selectedCutOff.name],
      ["Start Date", cutOffDate.from],
      ["End Date", cutOffDate.to],
      [],
      ["Total purchase for the Period", totalPurchase()],
      ["Number of Transactions", payable.length],
      ["Average purchase Value", averagePurchase],
      ["Last Accounts Payable", lastAccountsPayable()],
      ["Accounts Paid", totalAccountsPaid],
      ["Accounts Payable", totalAccountsPayable],
      ["Previous Period purchase", prevTotalPurchase()],
      ["Purchase Growth Index", purchaseGrowthIdx],
      ["Accounts payable turnover ratio", accountsPayableTurnOverRatio],
    ];
    const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData);
    XLSX.utils.book_append_sheet(workbook, overviewSheet, "Overview");

    // Product or Service Data
    const productData = productTable.map((item) => [
      item.productCode,
      item.productName,
      item.totalWeight,
      item.averageUnitPrice,
      item.totalAmount,
    ]);
    const productSheet = XLSX.utils.aoa_to_sheet([
      ["Accounting Period", selectedCutOff.name, "", "", ""],
      ["Start Date", cutOffDate.from, "", "", ""],
      ["End Date", cutOffDate.to, "", "", ""],
      [],
      [
        "Product Code",
        "Name",
        "Purchase Quantity",
        "Average Unit Price",
        "Amount",
      ],
      ...productData,
    ]);
    XLSX.utils.book_append_sheet(workbook, productSheet, "Product or Service");

    // Supplier Data
    const supplierData = supplierTable.map((item) => [
      item.companyName,
      item.lastAccountBalance,
      item.totalNetWeight,
      item.averageUnitPrice,
      item.amount,
      item.amountsPaid,
      item.totalAccountsPayable,
    ]);
    const supplierSheet = XLSX.utils.aoa_to_sheet([
      ["Accounting Period", selectedCutOff.name, "", "", "", "", ""],
      ["Start Date", cutOffDate.from, "", "", "", "", ""],
      ["End Date", cutOffDate.to, "", "", "", "", ""],
      [],
      [
        "Vendor Name",
        "Last Account Balance",
        "Purchase Quantity",
        "Average Unit Price",
        "Amount",
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

    applyStyling(overviewSheet, [0, 1, 2, 4]); // Bold headers and labels
    applyStyling(productSheet, [0, 1, 2, 4]);
    applyStyling(supplierSheet, [0, 1, 2, 4]);

    // Export the workbook
    XLSX.writeFile(workbook, "PurchaseReport.xlsx");
  };

  useEffect(() => {
    fetchCutoff();
  }, []);

  useEffect(() => {
    if (supplierPagination.data) {
      setSupplierPaginationTable(supplierPagination.data);
    }

    if (productPagination.data) {
      setProductPaginationTable(productPagination.data);
    }
  }, [supplierPagination.data, productPagination.data]);

  useEffect(() => {
    startAndEndDate();
  }, [selectedCutOff]);
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
                {/* <input
              type="date"
              value={cutOffDate?.from || ""}
              readOnly
              name="cutoff-start-date"
              className="form-control"
              id="cutoff-start-date"
            /> */}
                <DatePicker
                  selected={cutOffDate?.from}
                  dateFormat="MMM/dd/yyyy"
                  className="form-control"
                  readOnly
                />
              </div>
              <div className="col-sm mb-2">
                <span>To</span>
                {/* <input
              type="date"
              value={cutOffDate?.to || ""}
              readOnly
              name="cutoff-end-date"
              className="form-control"
              id="cutoff-end-date"
            /> */}
                <DatePicker
                  selected={cutOffDate?.to}
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
                        {totalPurchase()?.toLocaleString("en-PH", {
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
                      <td>{payable.length}</td>
                    </tr>
                    <tr>
                      <td>Average purchase Value: [Average purchase Amount]</td>
                      <td>
                        {isNaN(averagePurchase)
                          ? "₱0.00"
                          : averagePurchase?.toLocaleString("en-PH", {
                              style: "currency",
                              currency: "PHP",
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                      </td>
                    </tr>
                    <tr>
                      <td>Last Accounts Payable</td>
                      <td>
                        {isNaN(lastAccountsPayable())
                          ? "₱0.00"
                          : lastAccountsPayable()?.toLocaleString("en-PH", {
                              style: "currency",
                              currency: "PHP",
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                      </td>
                    </tr>
                    <tr>
                      <td>Accounts Paid</td>
                      <td>
                        {totalAccountsPaid?.toLocaleString("en-PH", {
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
                        {totalAccountsPayable?.toLocaleString("en-PH", {
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
                        {prevTotalPurchase()?.toLocaleString("en-PH", {
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
                        {purchaseGrowthIdx.toLocaleString("en-US", {
                          maximumFractionDigits: 2,
                          minimumFractionDigits: 2,
                        }) || 0}
                        %
                      </td>
                    </tr>
                    <tr>
                      <td>
                        Accounts Payable Turnover Ratio [Percentage Change]%
                      </td>
                      <td>
                        {accountsPayableTurnOverRatio.toLocaleString("en-US", {
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
                      <div className="table-responsive">
                        <table className="table table-bordered table-striped">
                          <thead>
                            <tr>
                              <th>Product or Service Code</th>
                              <th>Name</th>
                              <th>Purchase Quantity</th>
                              <th>Average Unit Price</th>
                              <th>Discount</th>
                              <th>Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {productPaginationTable.map((item) => (
                              <tr key={item.productCode}>
                                <td>{item.productCode}</td>
                                <td>{item.productName}</td>
                                <td>
                                  {item.totalWeight.toLocaleString("en-PH", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </td>
                                <td>
                                  {item.averageUnitPrice?.toLocaleString(
                                    "en-PH",
                                    {
                                      style: "currency",
                                      currency: "PHP",
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )}
                                </td>
                                <td>TBA</td>
                                <td>
                                  {item.totalAmount?.toLocaleString("en-PH", {
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
                          <PaginationControls {...productPagination} />
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
                      <div className="table-responsive">
                        <table className="table table-bordered table-striped">
                          <thead>
                            <tr>
                              <th>Vendor Name</th>
                              <th>Last Account Balance</th>
                              <th>Purchase Quantity</th>
                              <th>Average Unit Price</th>
                              <th>New Purchase Amount</th>
                              <th>Accounts Paid</th>
                              <th>Accounts Payable</th>
                            </tr>
                          </thead>
                          <tbody>
                            {supplierPaginationTable.map((item, index) => (
                              <tr key={index}>
                                <td>
                                  {item.vendorName === null
                                    ? item.companyName
                                    : `${item.companyName} ${item.vendorName}`}
                                </td>
                                <td>
                                  {item.lastAccountBalance?.toLocaleString(
                                    "en-PH",
                                    {
                                      style: "currency",
                                      currency: "PHP",
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )}
                                </td>
                                <td>
                                  {item.totalNetWeight.toLocaleString("en-US", {
                                    maximumFractionDigits: 2,
                                    minimumFractionDigits: 2,
                                  })}
                                </td>
                                <td>
                                  {item.averageUnitPrice?.toLocaleString(
                                    "en-PH",
                                    {
                                      style: "currency",
                                      currency: "PHP",
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )}
                                </td>
                                <td>
                                  {item.amount?.toLocaleString("en-PH", {
                                    style: "currency",
                                    currency: "PHP",
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </td>
                                <td>
                                  {item.amountsPaid?.toLocaleString("en-PH", {
                                    style: "currency",
                                    currency: "PHP",
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </td>
                                <td>
                                  {item.totalAccountsPayable?.toLocaleString(
                                    "en-PH",
                                    {
                                      style: "currency",
                                      currency: "PHP",
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )}
                                </td>
                              </tr>
                            ))}
                            {/* <tr>
                          <td>#001</td>
                          <td>Supplier A</td>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td></td>
                        </tr>
                        <tr>
                          <td>#002</td>
                          <td>Supplier B</td>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td></td>
                        </tr>
                        <tr>
                          <td>#003</td>
                          <td>Supplier C</td>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td></td>
                        </tr>
                        <tr>
                          <td>#004</td>
                          <td>Supplier D</td>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td></td>
                        </tr>
                        <tr>
                          <td>#005</td>
                          <td>Supplier D</td>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td></td>
                        </tr> */}
                          </tbody>
                        </table>
                        <div className="pb-2">
                          <PaginationControls {...supplierPagination} />
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

export default PurchaseReport1;
