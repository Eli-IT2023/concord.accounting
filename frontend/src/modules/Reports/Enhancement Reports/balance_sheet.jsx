import React, { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Button, Form, Tab, Tabs, Table } from "react-bootstrap";
import swal from "sweetalert";
import DataTable from "react-data-table-component";
import { customStyles } from "../../../assets/table-style";
import "@fortawesome/fontawesome-free/css/all.min.css";
import BASE_URL from "../../../assets/global/url";
import Select from "react-select";
import { Link, useParams, useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import DatePicker from "react-datepicker";
import NoAccess from "../../../assets/img/NoAccess.png";

const BalanceSheet1 = ({ authrztn }) => {
  const { module, id, fromdate, todate } = useParams();
  const [thisFromdate, setThisFromdate] = useState("");
  const [thisTodate, setThisTodate] = useState("");

  const [cutoffList, setCutoffList] = useState([]);
  const [selectedCutoff_id, setSelectedCutoff_id] = useState("");
  const [activeTab, setActiveTab] = useState("assetTab");

  const [assets, setAssets] = useState({});
  const [liabilities, setLiabilities] = useState({});
  const [ownersEquity, setOwnersEquity] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    if (module && id && fromdate && todate) {
      setThisFromdate(fromdate);
      setThisTodate(todate);
    } else {
      setThisFromdate("");
      setThisTodate("");
    }
  }, []);

  const getCutoff = async () => {
    await axios
      .get(`${BASE_URL}/cutoff/getCutoffs`)
      .then((res) => {
        const cutoffList_id = res.data[0].id;
        const cutoff_fromdate = res.data[0].from;
        const cutoff_todate = res.data[0].to;

        setCutoffList(res.data);
        setSelectedCutoff_id(cutoffList_id);
        setThisFromdate(cutoff_fromdate || "");
        setThisTodate(cutoff_todate || "");

        // if (activeTab === "assetTab") {
        //   getAssets(cutoffList_id, cutoff_fromdate, cutoff_todate);
        // } else if (activeTab === "liabilties") {
        //   getLiabilities(cutoffList_id, cutoff_fromdate, cutoff_todate);
        // } else {
        //   getOwnersEquity(cutoffList_id, cutoff_fromdate, cutoff_todate);
        // }
        getAssets(cutoffList_id, cutoff_fromdate, cutoff_todate);
        getLiabilities(cutoffList_id, cutoff_fromdate, cutoff_todate);
        getOwnersEquity(cutoffList_id, cutoff_fromdate, cutoff_todate);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  useEffect(() => {
    getCutoff();
  }, [activeTab]);

  const getAssets = async (cutoffList_id, cutoff_fromdate, cutoff_todate) => {
    // console.log(`cutoffList_id: ${cutoffList_id}`);

    await axios
      .get(`${BASE_URL}/balance_sheet/getAssets`, {
        params: {
          cutoffList_id,
          cutoff_fromdate,
          cutoff_todate,
        },
      })
      .then((res) => {
        setAssets(res.data);
        console.log(res.data.totalStockManagement);
      });
  };

  const getLiabilities = async (
    cutoffList_id,
    cutoff_fromdate,
    cutoff_todate
  ) => {
    // console.log(`cutoffList_id: ${cutoffList_id}`);

    await axios
      .get(`${BASE_URL}/balance_sheet/getLiabilities`, {
        params: {
          cutoffList_id,
          cutoff_fromdate,
          cutoff_todate,
        },
      })
      .then((res) => {
        setLiabilities(res.data);
      });
  };
  const getOwnersEquity = async (
    cutoffList_id,
    cutoff_fromdate,
    cutoff_todate
  ) => {
    axios
      .get(`${BASE_URL}/balance_sheet/getOwnersEquity`, {
        params: {
          cutoffList_id,
          cutoff_fromdate,
          cutoff_todate,
        },
      })
      .then((res) => {
        setOwnersEquity(res.data);
      });
  };

  // console.log(selectedCutoff);

  // Fix the handleCutoffChange function
  const handleCutoffChange = (value) => {
    console.log(value);
    setSelectedCutoff_id(value);
    // Ensure dates are strings, use empty string as fallback
    const cutoff_fromdate =
      cutoffList.find((cutoff) => String(cutoff.id) === String(value)).from ||
      "";
    const cutoff_todate =
      cutoffList.find((cutoff) => String(cutoff.id) === String(value)).to || "";

    setThisFromdate(cutoff_fromdate);
    setThisTodate(cutoff_todate);

    // if (activeTab === "assetTab") {
    //   getAssets(value, cutoff_fromdate, cutoff_todate);
    // } else if (activeTab === "liabilties") {
    //   getLiabilities(value, cutoff_fromdate, cutoff_todate);
    // } else {
    //   getOwnersEquity(value, cutoff_fromdate, cutoff_todate);
    // }
    getAssets(value, cutoff_fromdate, cutoff_todate);
    getLiabilities(value, cutoff_fromdate, cutoff_todate);
    getOwnersEquity(value, cutoff_fromdate, cutoff_todate);
  };

  const exportToExcel = () => {
    // Get the selected cutoff details
    const selectedCutoff = cutoffList.find(
      (cutoff) => cutoff.id === selectedCutoff_id
    );
    const currentCutoffName = selectedCutoff ? selectedCutoff.name : "";

    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // Prepare the data to match your table structure exactly
    const sheetData = [
      // Header with cutoff information
      ["BALANCE SHEET"],
      [`Cutoff: ${currentCutoffName} (${thisFromdate} to ${thisTodate})`],
      [], // Empty row

      // Assets Section
      ["FIXED ASSET SECTION"],
      [],
      ["ASSETS", "", ""],
      ["Subject 1", "Subject 2", "Amount (₱)"],

      // Current Assets
      [
        "Current Assets",
        "Cash and Cash Equivalents",
        assets?.totalFundsAmount || 0,
      ],
      ["", "Accounts Receivable", assets?.totalAccountsReceivable || 0],
      [
        "",
        "",
        (assets?.totalFundsAmount || 0) +
          (assets?.totalAccountsReceivable || 0),
      ],

      // Inventory
      [
        "Inventory",
        "",
        assets?.totalStockManagement?.reduce(
          (sum, data) => sum + data.total_stock * data.average_price || 0,
          0
        ) || 0,
      ],
      [
        "",
        "",
        assets?.totalStockManagement?.reduce(
          (sum, data) => sum + data.total_stock * data.average_price || 0,
          0
        ) || 0,
      ],

      // Prepaid Expenses
      ["Prepaid Expenses", "", assets?.totalPrepaidExpenses || 0],
      ["", "", assets?.totalPrepaidExpenses || 0],

      // Net Fixed Asset
      [
        "Net Fixed Asset",
        "Fixed Asset Original Values",
        assets?.totalFixedAssetOriginalValues || 0,
      ],
      [
        "",
        "Cumulative Discount",
        assets?.totalFixedAssetCummulativeDiscount || 0,
      ],
      ["", "Impairment of Fixed Asset", assets?.totalFixedAssetImpairment || 0],
      [
        "",
        "",
        (assets?.totalFixedAssetImpairment || 0) +
          (assets?.totalFixedAssetCummulativeDiscount || 0),
      ],

      // Other Current Assets
      ["Other Current Assets", "", assets?.totalOtherCurrentAssets || 0],
      ["", "", assets?.totalOtherCurrentAssets || 0],

      // Total Current Assets
      [
        "TOTAL CURRENT ASSETS",
        "",
        (assets?.totalOtherCurrentAssets || 0) +
          (assets?.totalPrepaidExpenses || 0) +
          (assets?.totalStockManagement?.reduce(
            (sum, data) => sum + data.total_stock * data.average_price || 0,
            0
          ) || 0) +
          (assets?.totalAccountsReceivable || 0) +
          (assets?.totalFundsAmount || 0) +
          (assets?.totalFixedAssetCummulativeDiscount || 0) +
          (assets?.totalFixedAssetImpairment || 0),
      ],

      [], // Empty row

      // Liabilities Section
      ["LIABILITIES SECTION"],
      [],
      ["LIABILITIES", "", ""],
      ["Subject 1", "Subject 2", "Amount (₱)"],

      // Current Liabilities
      [
        "Current Liabilities",
        "Bank Payable",
        liabilities?.OverAllTotalBankTransactions || 0,
      ],
      ["", "Purchase Payable", liabilities?.totalPayable || 0],
      ["", "Expenses Payable", liabilities?.totalExpenses || 0],
      ["", "Loans", liabilities?.totalLoanBalance || 0],
      [
        "",
        "",
        (liabilities?.OverAllTotalBankTransactions || 0) +
          (liabilities?.totalPayable || 0) +
          (liabilities?.totalExpenses || 0),
      ],

      // Short-Term Debt
      ["Short-Term Debt", "", 0],
      ["", "", 0],

      // Accrued Liabilities
      ["Accrued Liabilities", "", 0],
      ["", "", 0],

      // Other Current Liabilities
      [
        "Other Current Liabilities",
        "",
        liabilities?.totalOtherCurrentLiabilities || 0,
      ],
      ["", "", liabilities?.totalOtherCurrentLiabilities || 0],

      // Total Current Liabilities
      [
        "TOTAL CURRENT LIABILITIES",
        "",
        (liabilities?.OverAllTotalBankTransactions || 0) +
          (liabilities?.totalPayable || 0) +
          (liabilities?.totalExpenses || 0) +
          (liabilities?.totalOtherCurrentLiabilities || 0),
      ],

      [], // Empty row

      // Owners Equity Section
      ["OWNERS EQUITY SECTION"],
      [],
      ["OWNERS EQUITY", "", ""],
      ["Subject 1", "Amount (₱)"],

      // Capital
      ["Capital", ownersEquity?.totalOwnersEquity || 0],
      ["", ownersEquity?.totalOwnersEquity || 0],

      // Retained Earnings
      ["Retained Earnings", ownersEquity?.retainedEarnings || 0],
      ["", ownersEquity?.retainedEarnings || 0],

      // Total Equity
      [
        "TOTAL EQUITY",
        (ownersEquity?.totalOwnersEquity || 0) +
          (ownersEquity?.retainedEarnings || 0),
      ],
    ];

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    // Set column widths
    ws["!cols"] = [
      { wch: 30 }, // Subject 1 column
      { wch: 30 }, // Subject 2 column
      { wch: 20 }, // Amount column
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Balance Sheet");

    // Generate file and download
    const fileName = `Balance_Sheet_${currentCutoffName.replace(
      /\s+/g,
      "_"
    )}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      {authrztn.includes("Reporting-View") ? (
        <>
          <div className="w-100 p-2 d-flex flex-row justify-content-between">
            <div className="d-flex flex-column title-custom">
              <span className="fs-3 text-uppercase">
                {" "}
                {module && id && fromdate && todate && module === "cutoff" && (
                  <Link
                    to={`/accounting/view-cutoff/${id}`}
                    className="text-dark mx-2"
                  >
                    <i class="fa-solid fa-arrow-left"></i>
                  </Link>
                )}
                {module && id && module === "earnings" && (
                  <Link
                    to={`/accounting/view-earnings/${id}`}
                    className="text-dark mx-2"
                  >
                    <i class="fa-solid fa-arrow-left"></i>
                  </Link>
                )}
                Final Balance Sheet
              </span>
            </div>
            <div>
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
            {/* <div>
          <button className="btn btn-primary">Post Cutoff</button>
        </div> */}
          </div>

          <div className="w-100 row mx-auto mt-2">
            <h6>Accounting Period</h6>
            <div className="col-sm mb-2">
              <span>Cutoff</span>
              <Form.Select
                value={selectedCutoff_id}
                onChange={(e) => handleCutoffChange(e.target.value)}
                className="form-select"
                onMouseDown={(e) => {
                  if (cutoffList.length === 0) {
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
                dateFormat="MMM/dd/yyyy"
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
                dateFormat="MMM/dd/yyyy"
                className="form-control"
                readOnly
              />
            </div>
            {/* {!module && (
          <div className="col-sm d-flex flex-row align-items-end mb-2 filter-btn-container">
            <button className="btn">Apply Filter</button>
            <button className="btn btn-secondary">Clear Filter</button>
          </div>
        )} */}
            <div className="col-sm"></div>
          </div>

          <div className="container-fluid mt-2">
            <div className="container-fluid">
              <div className="row">
                {/* Assets Section */}
                <div className="w-100 d-flex align-items-center mt-4">
                  <h4 className="text-success">Fixed Asset Section</h4>
                  <hr className="flex-grow-1 mx-3" />
                </div>
                <div className="col-sm mb-3">
                  <div className="w-100 d-flex align-items-center mt-4">
                    <h5>Assets</h5>
                    <hr className="flex-grow-1 mx-3" />
                  </div>
                  {/* Fixed Asset Data */}
                  <div className="w-100">
                    <table className="table table-bordered mt-4">
                      <thead>
                        <tr>
                          <th>Subject 1</th>
                          <th>Subject 2</th>
                          <th className="text-end">Amount (₱)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Current Assets */}
                        <tr>
                          <td rowSpan="3">Current Assets</td>
                          <td>Cash and Cash Equivalents</td>
                          <td className="text-end">
                            {assets?.totalFundsAmount
                              ? assets.totalFundsAmount.toLocaleString(
                                  "en-US",
                                  {
                                    style: "currency",
                                    currency: "PHP",
                                    maximumFractionDigits: 2,
                                    minimumFractionDigits: 2,
                                  }
                                )
                              : "₱0.00"}
                          </td>
                        </tr>

                        <tr>
                          <td>Accounts Receivable</td>
                          <td className="text-end">
                            {assets?.totalAccountsReceivable
                              ? assets.totalAccountsReceivable.toLocaleString(
                                  "en-US",
                                  {
                                    style: "currency",
                                    currency: "PHP",
                                    maximumFractionDigits: 2,
                                    minimumFractionDigits: 2,
                                  }
                                )
                              : "₱0.00"}
                          </td>
                        </tr>

                        <tr>
                          <td></td>
                          <td className="text-end">
                            <strong className="text-success total-amount">
                              {(
                                assets?.totalFundsAmount +
                                assets?.totalAccountsReceivable
                              ).toLocaleString("en-US", {
                                style: "currency",
                                currency: "PHP",
                                maximumFractionDigits: 2,
                                minimumFractionDigits: 2,
                              })}
                            </strong>
                          </td>
                        </tr>

                        {/* Inventory */}
                        <tr>
                          <td rowSpan="2">Inventory</td>
                          <td></td>
                          <td className="text-end">
                            {assets?.totalStockManagement
                              ? assets.totalStockManagement
                                  .reduce(
                                    (sum, data) =>
                                      sum +
                                        data.total_stock * data.average_price ||
                                      0,
                                    0
                                  )
                                  .toLocaleString("en-US", {
                                    style: "currency",
                                    currency: "PHP",
                                    maximumFractionDigits: 2,
                                    minimumFractionDigits: 2,
                                  })
                              : "₱0.00"}
                          </td>
                        </tr>
                        <tr>
                          <td></td>
                          <td className="text-end">
                            <strong className="text-success total-amount">
                              {assets?.totalStockManagement
                                ? assets.totalStockManagement
                                    .reduce(
                                      (sum, data) =>
                                        sum +
                                          data.total_stock *
                                            data.average_price || 0,
                                      0
                                    )
                                    .toLocaleString("en-US", {
                                      style: "currency",
                                      currency: "PHP",
                                      maximumFractionDigits: 2,
                                      minimumFractionDigits: 2,
                                    })
                                : "₱0.00"}
                            </strong>
                          </td>
                        </tr>

                        {/* Prepaid Expenses */}
                        <tr>
                          <td rowSpan="2">Prepaid Expenses</td>
                          <td></td>
                          <td className="text-end">
                            {assets?.totalPrepaidExpenses
                              ? assets.totalPrepaidExpenses.toLocaleString(
                                  "en-US",
                                  {
                                    style: "currency",
                                    currency: "PHP",
                                    maximumFractionDigits: 2,
                                    minimumFractionDigits: 2,
                                  }
                                )
                              : "₱0.00"}
                          </td>
                        </tr>
                        <tr>
                          <td></td>
                          <td className="text-end">
                            <strong className="text-success total-amount">
                              {assets?.totalPrepaidExpenses
                                ? assets.totalPrepaidExpenses.toLocaleString(
                                    "en-US",
                                    {
                                      style: "currency",
                                      currency: "PHP",
                                      maximumFractionDigits: 2,
                                      minimumFractionDigits: 2,
                                    }
                                  )
                                : "₱0.00"}
                            </strong>
                          </td>
                        </tr>

                        {/* Current Assets */}
                        {/* <tr>
                      <td rowSpan="3">Net Fixed Asset</td>
                      <td>Fixed Asset Original Values </td>
                      <td className="text-end">
                        {assets?.totalFixedAssetOriginalValues
                          ? assets.totalFixedAssetOriginalValues.toLocaleString(
                              "en-US",
                              {
                                style: "currency",
                                currency: "PHP",
                                maximumFractionDigits: 2,
                                minimumFractionDigits: 2,
                              }
                            )
                          : "₱0.00"}
                      </td>
                    </tr>

                    <tr>
                      <td>Cumulative Discount</td>
                      <td className="text-end">
                        {assets?.totalFixedAssetCummulativeDiscount
                          ? assets.totalFixedAssetCummulativeDiscount.toLocaleString(
                              "en-US",
                              {
                                style: "currency",
                                currency: "PHP",
                                maximumFractionDigits: 2,
                                minimumFractionDigits: 2,
                              }
                            )
                          : "₱0.00"}
                      </td>
                    </tr>
                    <tr>
                      <td>Impairment of Fixed Asset</td>
                      <td className="text-end">
                        {assets?.totalFixedAssetImpairment
                          ? assets.totalFixedAssetImpairment.toLocaleString(
                              "en-US",
                              {
                                style: "currency",
                                currency: "PHP",
                                maximumFractionDigits: 2,
                                minimumFractionDigits: 2,
                              }
                            )
                          : "₱0.00"}
                      </td>
                    </tr> */}

                        <tr>
                          <td></td>
                          <td></td>
                          <td className="text-end">
                            <strong className="text-success total-amount">
                              {
                                // assets?.totalFixedAssetImpairment +
                                // assets?.totalFixedAssetCummulativeDiscount
                                (
                                  assets.totalFixedAssetOriginalValues -
                                  assets?.totalFixedAssetCummulativeDiscount
                                ).toLocaleString("en-US", {
                                  style: "currency",
                                  currency: "PHP",
                                  maximumFractionDigits: 2,
                                  minimumFractionDigits: 2,
                                })
                              }
                            </strong>
                          </td>
                        </tr>

                        {/* Other Current Assets */}
                        <tr>
                          <td rowSpan="2">Other Current Assets</td>
                          <td></td>
                          <td className="text-end">
                            {assets?.totalOtherCurrentAssets
                              ? assets.totalOtherCurrentAssets.toLocaleString(
                                  "en-US",
                                  {
                                    style: "currency",
                                    currency: "PHP",
                                    maximumFractionDigits: 2,
                                    minimumFractionDigits: 2,
                                  }
                                )
                              : "₱0.00"}
                          </td>
                        </tr>
                        <tr>
                          <td></td>
                          <td className="text-end">
                            <strong className="text-success total-amount">
                              {assets?.totalOtherCurrentAssets
                                ? assets.totalOtherCurrentAssets.toLocaleString(
                                    "en-US",
                                    {
                                      style: "currency",
                                      currency: "PHP",
                                      maximumFractionDigits: 2,
                                      minimumFractionDigits: 2,
                                    }
                                  )
                                : "₱0.00"}
                            </strong>
                          </td>
                        </tr>

                        {/* Total Current Assets */}
                        <tr className="table-primary">
                          <td colSpan="2">
                            <strong>Total Current Assets</strong>
                          </td>
                          <td className="text-end">
                            <strong>
                              {/* {(
                                assets?.totalOtherCurrentAssets +
                                assets?.totalPrepaidExpenses +
                                assets?.totalStockManagement +
                                assets?.totalAccountsReceivable +
                                assets?.totalFundsAmount
                              ).toLocaleString("en-US", {
                                style: "currency",
                                currency: "PHP",
                              })} */}
                              {assets?.totalOtherCurrentAssets ||
                              assets?.totalPrepaidExpenses ||
                              assets?.totalStockManagement?.reduce(
                                (sum, data) =>
                                  sum + data.total_stock * data.average_price ||
                                  0,
                                0
                              ) ||
                              assets?.totalAccountsReceivable ||
                              assets?.totalFundsAmount ||
                              assets?.totalFixedAssetOriginalValues ||
                              assets?.totalFixedAssetCummulativeDiscount ||
                              assets?.totalFixedAssetImpairment
                                ? (
                                    assets.totalOtherCurrentAssets +
                                    assets.totalPrepaidExpenses +
                                    assets.totalStockManagement?.reduce(
                                      (sum, data) =>
                                        sum +
                                          data.total_stock *
                                            data.average_price || 0,
                                      0
                                    ) +
                                    assets.totalAccountsReceivable +
                                    assets.totalFundsAmount +
                                    (assets.totalFixedAssetOriginalValues -
                                      assets?.totalFixedAssetCummulativeDiscount)
                                  )
                                    // assets.totalFixedAssetCummulativeDiscount +
                                    // assets.totalFixedAssetImpairment
                                    .toLocaleString("en-US", {
                                      style: "currency",
                                      currency: "PHP",
                                      maximumFractionDigits: 2,
                                      minimumFractionDigits: 2,
                                    })
                                : "₱0.00"}
                            </strong>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Non-Current Assets Section */}
                <div className="col-sm mb-3">
                  <div className="w-100 d-flex align-items-center mt-4">
                    <h5>Non-Current Assets</h5>
                    <hr className="flex-grow-1 mx-3" />
                  </div>
                  <div className="w-100">
                    <table className="table table-bordered mt-4">
                      <thead>
                        <tr>
                          <th>Subject 1</th>
                          <th>Subject 2</th>
                          <th className="text-end">Amount (₱)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Property, Plant, and Equipment (PP&E)
                         */}
                        <tr>
                          <td rowSpan="2">
                            Property, Plant, and Equipment (PP&E)
                          </td>
                          <td></td>
                          <td className="text-end">0</td>
                        </tr>
                        <tr>
                          <td></td>
                          <td className="text-end">
                            <strong className="text-success total-amount">
                              0
                            </strong>
                          </td>
                        </tr>

                        {/* Net Fixed Asset */}
                        <tr>
                          <td rowSpan="3">Net Fixed Asset</td>
                          <td>Fixed Asset Original Values </td>
                          <td className="text-end">
                            {assets?.totalFixedAssetOriginalValues
                              ? assets.totalFixedAssetOriginalValues.toLocaleString(
                                  "en-US",
                                  {
                                    style: "currency",
                                    currency: "PHP",
                                    maximumFractionDigits: 2,
                                    minimumFractionDigits: 2,
                                  }
                                )
                              : "₱0.00"}
                          </td>
                        </tr>

                        <tr>
                          <td>Cumulative Discount</td>
                          <td className="text-end">
                            {" "}
                            {assets?.totalFixedAssetCummulativeDiscount
                              ? assets.totalFixedAssetCummulativeDiscount.toLocaleString(
                                  "en-US",
                                  {
                                    style: "currency",
                                    currency: "PHP",
                                    maximumFractionDigits: 2,
                                    minimumFractionDigits: 2,
                                  }
                                )
                              : "₱0.00"}
                          </td>
                        </tr>
                        <tr>
                          <td>Impairment of Fixed Asset</td>
                          <td className="text-end">
                            {" "}
                            {assets?.totalFixedAssetImpairment
                              ? assets.totalFixedAssetImpairment.toLocaleString(
                                  "en-US",
                                  {
                                    style: "currency",
                                    currency: "PHP",
                                    maximumFractionDigits: 2,
                                    minimumFractionDigits: 2,
                                  }
                                )
                              : "₱0.00"}
                          </td>
                        </tr>

                        {/* Intangible Assets
                         */}
                        <tr>
                          <td rowSpan="2">Intangible Assets</td>
                          <td></td>
                          <td className="text-end">0.00</td>
                        </tr>
                        <tr>
                          <td></td>
                          <td className="text-end">
                            <strong className="text-success total-amount">
                              0.00
                            </strong>
                          </td>
                        </tr>

                        {/* Investments
                         */}
                        <tr>
                          <td rowSpan="2">Investments</td>
                          <td></td>
                          <td className="text-end">0.00</td>
                        </tr>
                        <tr>
                          <td></td>
                          <td className="text-end">
                            <strong className="text-success total-amount">
                              0.00
                            </strong>
                          </td>
                        </tr>

                        {/* Other Non-Current Assets */}
                        <tr>
                          <td rowSpan="2">Other Non-Current Assets</td>
                          <td></td>
                          <td className="text-end">0.00</td>
                        </tr>
                        <tr>
                          <td></td>
                          <td className="text-end">
                            <strong className="text-success total-amount">
                              0.00
                            </strong>
                          </td>
                        </tr>

                        {/* Total Non-Current Assets */}
                        <tr className="table-primary">
                          <td colSpan="2">
                            <strong>Total Non-Current Assets</strong>
                          </td>
                          <td className="text-end">
                            <strong className="peso">0.00</strong>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <div className="container-fluid">
              <div className="row">
                <div className="w-100 d-flex align-items-center mt-4">
                  <h4 className="text-success">Liabilities Section</h4>
                  <hr className="flex-grow-1 mx-3" />
                </div>
                {/* liabilities Section */}
                <div className="col-sm mb-3">
                  <div className="w-100 d-flex align-items-center mt-4">
                    <h5>Liabilities</h5>
                    <hr className="flex-grow-1 mx-3" />
                  </div>
                  {/* Fixed Asset Data */}
                  <div className="w-100">
                    <table className="table table-bordered mt-4">
                      <thead>
                        <tr>
                          <th>Subject 1</th>
                          <th>Subject 2</th>
                          <th className="text-end">Amount (₱)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Current Liabilities */}
                        <tr>
                          <td rowSpan="5">Accounts Payable</td>
                          <td>Bank Payable</td>
                          <td className="text-end">
                            {liabilities?.OverAllTotalBankTransactions
                              ? liabilities?.OverAllTotalBankTransactions.toLocaleString(
                                  "en-US",
                                  {
                                    style: "currency",
                                    currency: "PHP",
                                    maximumFractionDigits: 2,
                                    minimumFractionDigits: 2,
                                  }
                                )
                              : "₱0.00"}
                          </td>
                        </tr>
                        <tr>
                          <td>Purchase Payable</td>
                          <td className="text-end">
                            {liabilities?.totalPayable
                              ? liabilities?.totalPayable.toLocaleString(
                                  "en-US",
                                  {
                                    style: "currency",
                                    currency: "PHP",
                                    maximumFractionDigits: 2,
                                    minimumFractionDigits: 2,
                                  }
                                )
                              : "₱0.00"}
                          </td>
                        </tr>
                        <tr>
                          <td>Expenses Payable</td>
                          <td className="text-end">
                            {liabilities?.totalExpenses
                              ? liabilities?.totalExpenses.toLocaleString(
                                  "en-US",
                                  {
                                    style: "currency",
                                    currency: "PHP",
                                    maximumFractionDigits: 2,
                                    minimumFractionDigits: 2,
                                  }
                                )
                              : "₱0.00"}
                          </td>
                        </tr>
                        <tr>
                          <td>Loans</td>
                          <td className="text-end">
                            {" "}
                            {liabilities?.totalLoanBalance
                              ? liabilities?.totalLoanBalance.toLocaleString(
                                  "en-US",
                                  {
                                    style: "currency",
                                    currency: "PHP",
                                    maximumFractionDigits: 2,
                                    minimumFractionDigits: 2,
                                  }
                                )
                              : "₱0.00"}
                          </td>
                        </tr>
                        <tr>
                          <td></td>
                          <td className="text-end">
                            <strong className="text-success">
                              {liabilities?.OverAllTotalBankTransactions ||
                              liabilities?.totalPayable ||
                              liabilities?.totalExpenses
                                ? (
                                    liabilities?.OverAllTotalBankTransactions +
                                    liabilities?.totalPayable +
                                    liabilities?.totalExpenses
                                  ).toLocaleString("en-US", {
                                    style: "currency",
                                    currency: "PHP",
                                    maximumFractionDigits: 2,
                                    minimumFractionDigits: 2,
                                  })
                                : "₱0.00"}
                            </strong>
                          </td>
                        </tr>
                        {/* Short-Term Debt */}
                        <tr>
                          <td rowSpan="2">Short-Term Debt</td>
                          <td></td>
                          <td className="text-end peso">0.00</td>
                        </tr>
                        <tr>
                          <td></td>
                          <td className="text-end">
                            <strong className="text-success total-amount peso">
                              0.00
                            </strong>
                          </td>
                        </tr>
                        {/* Accrued Liabilities
                         */}
                        <tr>
                          <td rowSpan="2">Accrued Liabilities</td>
                          <td></td>
                          <td className="text-end peso">0.00</td>
                        </tr>
                        <tr>
                          <td></td>
                          <td className="text-end">
                            <strong className="text-success total-amount peso">
                              0.00
                            </strong>
                          </td>
                        </tr>

                        {/*  Other Current Liabilities */}
                        <tr>
                          <td rowSpan="2"> Other Current Liabilities</td>
                          <td></td>
                          <td className="text-end">
                            {liabilities?.totalOtherCurrentLiabilities
                              ? liabilities?.totalOtherCurrentLiabilities.toLocaleString(
                                  "en-US",
                                  {
                                    style: "currency",
                                    currency: "PHP",
                                    maximumFractionDigits: 2,
                                    minimumFractionDigits: 2,
                                  }
                                )
                              : "₱0.00"}
                          </td>
                        </tr>
                        <tr>
                          <td></td>
                          <td className="text-end">
                            <strong className="text-success total-amount">
                              {liabilities?.totalOtherCurrentLiabilities
                                ? liabilities?.totalOtherCurrentLiabilities.toLocaleString(
                                    "en-US",
                                    {
                                      style: "currency",
                                      currency: "PHP",
                                      maximumFractionDigits: 2,
                                      minimumFractionDigits: 2,
                                    }
                                  )
                                : "₱0.00"}
                            </strong>
                          </td>
                        </tr>

                        <tr className="table-primary">
                          <td colSpan="2">
                            <strong>Total Current Liabilities</strong>
                          </td>
                          <td className="text-end">
                            <strong className="">
                              {liabilities?.OverAllTotalBankTransactions ||
                              liabilities?.totalPayable ||
                              liabilities?.totalExpenses ||
                              liabilities?.totalOtherCurrentLiabilities
                                ? (
                                    liabilities?.OverAllTotalBankTransactions +
                                    liabilities?.totalPayable +
                                    liabilities?.totalExpenses +
                                    liabilities?.totalOtherCurrentLiabilities
                                  ).toLocaleString("en-US", {
                                    style: "currency",
                                    currency: "PHP",
                                    maximumFractionDigits: 2,
                                    minimumFractionDigits: 2,
                                  })
                                : "₱0.00"}
                            </strong>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Non-Current liabilities Section */}
                <div className="col-sm mb-3">
                  <div className="w-100 d-flex align-items-center mt-4">
                    <h5>Non-Current Liabilities</h5>
                    <hr className="flex-grow-1 mx-3" />
                  </div>
                  <div className="w-100">
                    <table className="table table-bordered mt-4">
                      <thead>
                        <tr>
                          <th>Subject 1</th>
                          <th>Subject 2</th>
                          <th className="text-end">Amount (₱)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Long-Term Debt */}
                        <tr>
                          <td rowSpan="2">Long-Term Debt</td>
                          <td></td>
                          <td className="text-end peso">0.00</td>
                        </tr>
                        <tr>
                          <td></td>
                          <td className="text-end peso">
                            <strong className="text-success total-amount">
                              0.00
                            </strong>
                          </td>
                        </tr>

                        {/* Deferred Tax Liabilities
                         */}
                        <tr>
                          <td rowSpan="2">Deferred Tax Liabilities</td>
                          <td></td>
                          <td className="text-end peso">0.00</td>
                        </tr>
                        <tr>
                          <td></td>
                          <td className="text-end">
                            <strong className="text-success total-amount peso">
                              0.00
                            </strong>
                          </td>
                        </tr>

                        {/* Other Non-Current Liabilities
                         */}
                        <tr>
                          <td rowSpan="2">Other Non-Current Liabilities</td>
                          <td></td>
                          <td className="text-end peso">0.00</td>
                        </tr>
                        <tr>
                          <td></td>
                          <td className="text-end">
                            <strong className="text-success total-amount peso">
                              0.00
                            </strong>
                          </td>
                        </tr>
                        {/* Total Non-Current Liabilities */}
                        <tr className="table-primary">
                          <td colSpan="2">
                            <strong>Total Non-Current Liabilities</strong>
                          </td>
                          <td className="text-end">
                            <strong className="peso">0.00</strong>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <div className="container-fluid">
              <div className="w-100 d-flex align-items-center mt-4">
                <h4 className="text-success">Owners' Equity Section</h4>
                <hr className="flex-grow-1 mx-3" />
              </div>
              {/* Owner Equity data here */}
              <div className="w-100">
                <table className="table table-bordered mt-4">
                  <thead>
                    <tr>
                      <th>Subject 1</th>
                      {/* <th>Subject 2</th> */}
                      <th className="text-end">Amount (₱)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Capital
                     */}
                    <tr>
                      <td rowSpan="2">Capital</td>
                      {/* <td></td> */}
                      <td className="text-end">
                        {ownersEquity?.totalOwnersEquity
                          ? ownersEquity?.totalOwnersEquity.toLocaleString(
                              "en-US",
                              {
                                style: "currency",
                                currency: "PHP",
                                maximumFractionDigits: 2,
                                minimumFractionDigits: 2,
                              }
                            )
                          : "₱0.00"}
                      </td>
                    </tr>
                    <tr>
                      {/* <td></td> */}
                      <td className="text-end">
                        <strong className="text-success total-amount">
                          {ownersEquity?.totalOwnersEquity
                            ? ownersEquity?.totalOwnersEquity.toLocaleString(
                                "en-US",
                                {
                                  style: "currency",
                                  currency: "PHP",
                                  maximumFractionDigits: 2,
                                  minimumFractionDigits: 2,
                                }
                              )
                            : "₱0.00"}
                        </strong>
                      </td>
                    </tr>

                    {/* Deferred Tax Liabilities
                     */}
                    <tr>
                      <td rowSpan="2">Retained Earnings</td>
                      {/* <td></td> */}
                      <td className="text-end">
                        {ownersEquity?.retainedEarnings
                          ? ownersEquity?.retainedEarnings.toLocaleString(
                              "en-US",
                              {
                                style: "currency",
                                currency: "PHP",
                                maximumFractionDigits: 2,
                                minimumFractionDigits: 2,
                              }
                            )
                          : "₱0.00"}
                      </td>
                    </tr>
                    <tr>
                      {/* <td></td> */}
                      <td className="text-end">
                        <strong className="text-success total-amount">
                          {ownersEquity?.retainedEarnings
                            ? ownersEquity?.retainedEarnings.toLocaleString(
                                "en-US",
                                {
                                  style: "currency",
                                  currency: "PHP",
                                  maximumFractionDigits: 2,
                                  minimumFractionDigits: 2,
                                }
                              )
                            : "₱0.00"}
                        </strong>
                      </td>
                    </tr>

                    {/* Total Equity */}
                    <tr className="table-primary">
                      <td colSpan="1">
                        <strong>Total Equity</strong>
                      </td>
                      <td className="text-end">
                        <strong className="">
                          {ownersEquity?.totalOwnersEquity ||
                          ownersEquity?.retainedEarnings
                            ? (
                                ownersEquity?.totalOwnersEquity +
                                ownersEquity?.retainedEarnings
                              ).toLocaleString("en-US", {
                                style: "currency",
                                currency: "PHP",
                                maximumFractionDigits: 2,
                                minimumFractionDigits: 2,
                              })
                            : "₱0.00"}
                        </strong>
                      </td>
                    </tr>
                    <tr className="table-primary">
                      <td>
                        {" "}
                        <strong>Total Liabilities and Equity</strong>
                      </td>
                      <td className="text-end">
                        <strong>TBA</strong>
                      </td>
                    </tr>
                    <tr className="table-primary">
                      <td>
                        <strong>Balance Checking</strong>
                      </td>
                      <td className="text-end">
                        <strong>TBA</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
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

export default BalanceSheet1;
