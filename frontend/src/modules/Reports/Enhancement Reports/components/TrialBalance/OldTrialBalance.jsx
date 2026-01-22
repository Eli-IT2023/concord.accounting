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
const OldTrialBalance = ({ authrztn }) => {
  const [cutoffData, setCutoffData] = useState([]);
  const [selectedOptionsCutoff, setSelectedOptionsCutoff] = useState([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [currentAssetsData, setCurrentAssetsData] = useState({});
  const [currentLiabilitiesData, setCurrentLiabilitiesData] = useState({});
  const [currentAdditionalItemsData, setCurrentAdditionalItemsData] = useState(
    {}
  );
  const [currentDeductionItemsData, setCurrentDeductionItemsData] = useState(
    {}
  );

  const getCutoffs = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/trialBalanceReport/getCutoffs`);
      const sortedData = res.data.sort(
        (a, b) => new Date(b.from) - new Date(a.from)
      );
      setCutoffData(sortedData);

      if (sortedData.length > 0) {
        const defaultCutoff = sortedData[0];
        setSelectedOptionsCutoff(defaultCutoff.id.toString());
        setDateFrom(new Date(defaultCutoff.from).toISOString().split("T")[0]);
        setDateTo(new Date(defaultCutoff.to).toISOString().split("T")[0]);

        fetchCurrentAssetsData(defaultCutoff.from, defaultCutoff.to);
        fetchCurrentLiabilitiesData(defaultCutoff.from, defaultCutoff.to);
        fetchCurrentAdditionalItemsData(defaultCutoff.from, defaultCutoff.to);
        fetchCurrentDeductionItemsData(defaultCutoff.from, defaultCutoff.to);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleCutoffChange = (e) => {
    const selectedId = e.target.value;
    setSelectedOptionsCutoff(selectedId);

    const selectedCutoff = cutoffData.find(
      (cutoff) => cutoff.id.toString() === selectedId
    );

    if (selectedCutoff) {
      setDateFrom(new Date(selectedCutoff.from).toISOString().split("T")[0]);
      setDateTo(new Date(selectedCutoff.to).toISOString().split("T")[0]);
    }
    fetchCurrentAssetsData(selectedCutoff.from, selectedCutoff.to);
    fetchCurrentLiabilitiesData(selectedCutoff.from, selectedCutoff.to);
    fetchCurrentAdditionalItemsData(selectedCutoff.from, selectedCutoff.to);
    fetchCurrentDeductionItemsData(selectedCutoff.from, selectedCutoff.to);
  };

  const fetchCurrentAssetsData = (dateFrom, dateTo) => {
    axios
      .get(BASE_URL + "/trialBalanceReport/getCurrentAssetsDataReport", {
        params: {
          dateFrom: dateFrom,
          dateTo: dateTo,
        },
      })
      .then((res) => {
        const {
          beginningTotalCash,
          debitCash,
          creditCash,
          endOfTotalCash,
          beginningTotalBank,
          debitBank,
          creditBank,
          endOfTotalBank,
          pastCollection,
          currentCollection,
          beginningAssetAmount,
          currentAssetAmountDebit,
          currentAssetAmountCredit,
          endTotalAssetAmount,
        } = res.data;
        const totalSumofBeginningTotal =
          (beginningTotalCash || 0) +
          (beginningTotalBank || 0) +
          (pastCollection || 0) +
          (beginningAssetAmount || 0);

        const totalSumofDebit =
          (debitCash || 0) +
          (debitBank || 0) +
          (currentCollection || 0) +
          (currentAssetAmountDebit || 0);

        const totalSumofCredit =
          (creditCash || 0) +
          (creditBank || 0) +
          (currentAssetAmountCredit || 0);

        const totalSumofEndTotal =
          (endOfTotalCash || 0) +
          (endOfTotalBank || 0) +
          (currentCollection || 0) +
          (endTotalAssetAmount || 0);

        setCurrentAssetsData((prev) => ({
          ...prev,
          beginningTotalCash: beginningTotalCash,
          debitCash: debitCash || 0,
          creditCash: creditCash || 0,
          endOfTotalCash: endOfTotalCash,
          beginningTotalBank: beginningTotalBank,
          debitBank: debitBank || 0,
          creditBank: creditBank || 0,
          endOfTotalBank: endOfTotalBank,
          pastCollection: pastCollection || 0,
          currentCollection: currentCollection || 0,
          beginningAssetAmount: beginningAssetAmount,
          currentAssetAmountDebit: currentAssetAmountDebit || 0,
          currentAssetAmountCredit: currentAssetAmountCredit || 0,
          endTotalAssetAmount: endTotalAssetAmount,
          totalSumofBeginningTotal,
          totalSumofDebit,
          totalSumofCredit,
          totalSumofEndTotal,
        }));
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const fetchCurrentLiabilitiesData = (dateFrom, dateTo) => {
    axios
      .get(`${BASE_URL}/trialBalanceReport/getCurrentLiabilitiesDataReport`, {
        params: {
          dateFrom: dateFrom,
          dateTo: dateTo,
        },
      })
      .then((res) => {
        const {
          pastAmountIssuedCheck,
          currentAmountIssuedCheck,
          beginningLiabilitiesAmount,
          currentLiabilitiesAmountDebit,
          currentLiabilitiesAmountCredit,
          endTotalLiabilitiesAmount,
        } = res.data;

        const totalSumofBeginningLiabilitiesTotal =
          (pastAmountIssuedCheck || 0) + (beginningLiabilitiesAmount || 0);

        const totalSumofLiabilitiesDebit = currentLiabilitiesAmountDebit || 0;

        const totalSumofLiabilitiesCredit =
          (currentAmountIssuedCheck || 0) +
          (currentLiabilitiesAmountCredit || 0);

        const totalSumofEndTotalLiabilities =
          (currentAmountIssuedCheck || 0) + (endTotalLiabilitiesAmount || 0);

        setCurrentLiabilitiesData((prev) => ({
          ...prev,
          pastAmountIssuedCheck,
          currentAmountIssuedCheck,
          beginningLiabilitiesAmount,
          currentLiabilitiesAmountDebit,
          currentLiabilitiesAmountCredit,
          endTotalLiabilitiesAmount,
          totalSumofBeginningLiabilitiesTotal,
          totalSumofLiabilitiesDebit,
          totalSumofLiabilitiesCredit,
          totalSumofEndTotalLiabilities,
        }));
      })
      .catch((err) => {
        console.error("Error fetching current liabilities data:", err);
      });
  };

  const fetchCurrentAdditionalItemsData = (dateFrom, dateTo) => {
    axios
      .get(`${BASE_URL}/trialBalanceReport/getAdditionalItemsDataReport`, {
        params: {
          dateFrom: dateFrom,
          dateTo: dateTo,
        },
      })
      .then((res) => {
        const {
          capitalAmount,
          pastCollected,
          currentCollected,
          pastOtherIncome,
          currentOtherIncome,
        } = res.data;

        const totalSumofBeginningAdditionItemsTotal =
          (capitalAmount || 0) + (pastCollected || 0) + (pastOtherIncome || 0);

        const totalSumofAdditionItemsDebit =
          (capitalAmount || 0) +
          (currentCollected || 0) +
          (currentOtherIncome || 0);

        const totalSumofAdditionItemsCredit = 0;

        const totalSumofEndTotalAdditionItems =
          (capitalAmount || 0) +
          (currentCollected || 0) +
          (currentOtherIncome || 0);

        setCurrentAdditionalItemsData((prev) => ({
          ...prev,
          capitalAmount,
          pastCollected,
          currentCollected,
          pastOtherIncome,
          currentOtherIncome,
          totalSumofBeginningAdditionItemsTotal,
          totalSumofAdditionItemsDebit,
          totalSumofAdditionItemsCredit,
          totalSumofEndTotalAdditionItems,
        }));
      })
      .catch((err) => {
        console.error("Error fetching current liabilities data:", err);
      });
  };

  const fetchCurrentDeductionItemsData = (dateFrom, dateTo) => {
    axios
      .get(`${BASE_URL}/trialBalanceReport/getDeductionItemsDataReport`, {
        params: {
          dateFrom: dateFrom,
          dateTo: dateTo,
        },
      })
      .then((res) => {
        const { pastExpenses, currentExpenses } = res.data;

        setCurrentDeductionItemsData((prev) => ({
          ...prev,
          pastExpenses,
          currentExpenses,
        }));
      })
      .catch((err) => {
        console.error("Error fetching current liabilities data:", err);
      });
  };

  const clearFilter = () => {
    setDateFrom("");
    setDateTo("");
    setSelectedOptionsCutoff([]);
    setCurrentAssetsData({});
    setCurrentLiabilitiesData({});
    setCurrentAdditionalItemsData({});
    setCurrentDeductionItemsData({});
  };

  useEffect(() => {
    getCutoffs();
  }, []);

  // Add this function to your component
  const exportToExcel = () => {
    // Create a workbook
    const wb = XLSX.utils.book_new();

    // Prepare data for Excel export in columnar format
    const excelData = [];

    // Add title and date range
    excelData.push(["TRIAL BALANCE REPORT", "", "", ""]);
    excelData.push(["Accounting Period", "", "", ""]);
    excelData.push([`From: ${dateFrom}`, `To: ${dateTo}`, "", ""]);
    excelData.push([""]); // Empty row

    // Current Assets Section
    excelData.push(["CURRENT ASSETS", "", "", "", ""]);
    excelData.push([
      "Subject",
      "Beginning Total",
      "Addition (Debit)",
      "Deduction (Credit)",
      "End of Total",
    ]);

    // Current Assets Rows
    excelData.push([
      "Cash Account",
      currentAssetsData.beginningTotalCash || 0,
      currentAssetsData.debitCash || 0,
      currentAssetsData.creditCash || 0,
      currentAssetsData.endOfTotalCash || 0,
    ]);
    excelData.push([
      "Bank Account",
      currentAssetsData.beginningTotalBank || 0,
      currentAssetsData.debitBank || 0,
      currentAssetsData.creditBank || 0,
      currentAssetsData.endOfTotalBank || 0,
    ]);
    excelData.push([
      "Collection Check / Outstanding Checks",
      currentAssetsData.pastCollection || 0,
      currentAssetsData.currentCollection || 0,
      "-- -- --",
      currentAssetsData.currentCollection || 0,
    ]);
    excelData.push([
      "Other Current Asset",
      currentAssetsData.beginningAssetAmount || 0,
      currentAssetsData.currentAssetAmountDebit || 0,
      currentAssetsData.currentAssetAmountCredit || 0,
      currentAssetsData.endTotalAssetAmount || 0,
    ]);
    excelData.push([
      "TOTAL",
      currentAssetsData.totalSumofBeginningTotal || 0,
      currentAssetsData.totalSumofDebit || 0,
      currentAssetsData.totalSumofCredit || 0,
      currentAssetsData.totalSumofEndTotal || 0,
    ]);

    excelData.push([""]); // Empty row

    // Current Liabilities Section
    excelData.push(["CURRENT LIABILITIES", "", "", "", ""]);
    excelData.push([
      "Subject",
      "Beginning Total",
      "Addition (Debit)",
      "Deduction (Credit)",
      "End of Total",
    ]);

    // Current Liabilities Rows
    excelData.push([
      "Posted Payable Checks",
      currentLiabilitiesData.pastAmountIssuedCheck || 0,
      "-- -- --",
      currentLiabilitiesData.currentAmountIssuedCheck || 0,
      currentLiabilitiesData.currentAmountIssuedCheck || 0,
    ]);
    excelData.push([
      "Other Current Liabilities",
      currentLiabilitiesData.beginningLiabilitiesAmount || 0,
      currentLiabilitiesData.currentLiabilitiesAmountDebit || 0,
      currentLiabilitiesData.currentLiabilitiesAmountCredit || 0,
      currentLiabilitiesData.endTotalLiabilitiesAmount || 0,
    ]);
    excelData.push([
      "TOTAL",
      currentLiabilitiesData.totalSumofBeginningLiabilitiesTotal || 0,
      currentLiabilitiesData.totalSumofLiabilitiesDebit || 0,
      currentLiabilitiesData.totalSumofLiabilitiesCredit || 0,
      currentLiabilitiesData.totalSumofEndTotalLiabilities || 0,
    ]);

    excelData.push([""]); // Empty row

    // Additional Items Section
    excelData.push(["ADDITIONAL ITEMS", "", "", "", ""]);
    excelData.push([
      "Subject",
      "Beginning Total",
      "Addition (Debit)",
      "Deduction (Credit)",
      "End of Total",
    ]);

    // Additional Items Rows
    excelData.push([
      "Startup Capital",
      currentAdditionalItemsData.capitalAmount || 0,
      currentAdditionalItemsData.capitalAmount || 0,
      "-- -- --",
      currentAdditionalItemsData.capitalAmount || 0,
    ]);
    excelData.push([
      "Main Business Income",
      currentAdditionalItemsData.pastCollected || 0,
      currentAdditionalItemsData.currentCollected || 0,
      "-- -- --",
      currentAdditionalItemsData.currentCollected || 0,
    ]);
    excelData.push([
      "Other Income",
      currentAdditionalItemsData.pastOtherIncome || 0,
      currentAdditionalItemsData.currentOtherIncome || 0,
      "-- -- --",
      currentAdditionalItemsData.currentOtherIncome || 0,
    ]);
    excelData.push([
      "TOTAL",
      currentAdditionalItemsData.totalSumofBeginningAdditionItemsTotal || 0,
      currentAdditionalItemsData.totalSumofAdditionItemsDebit || 0,
      currentAdditionalItemsData.totalSumofAdditionItemsCredit || 0,
      currentAdditionalItemsData.totalSumofEndTotalAdditionItems || 0,
    ]);

    excelData.push([""]); // Empty row

    // Deduction Items Section
    excelData.push(["DEDUCTION ITEMS", "", "", "", ""]);
    excelData.push([
      "Subject",
      "Beginning Total",
      "Addition (Debit)",
      "Deduction (Credit)",
      "End of Total",
    ]);

    // Deduction Items Rows
    excelData.push([
      "Expenses",
      currentDeductionItemsData.pastExpenses || 0,
      "-- -- --",
      currentDeductionItemsData.currentExpenses || 0,
      currentDeductionItemsData.currentExpenses || 0,
    ]);
    excelData.push(["TOTAL", "-- -- --", "-- -- --", "-- -- --", "-- -- --"]);

    // Create a worksheet
    const ws = XLSX.utils.aoa_to_sheet(excelData);

    // Apply styling by setting column widths and cell styles
    const wscols = [
      { wch: 40 }, // Subject column width
      { wch: 20 }, // Beginning Total
      { wch: 20 }, // Addition (Debit)
      { wch: 20 }, // Deduction (Credit)
      { wch: 20 }, // End of Total
    ];
    ws["!cols"] = wscols;

    // Apply styling to headers and totals
    for (let i = 0; i < excelData.length; i++) {
      const cellAddress1 = XLSX.utils.encode_cell({ r: i, c: 0 });
      const cellAddress2 = XLSX.utils.encode_cell({ r: i, c: 1 });
      const cellAddress3 = XLSX.utils.encode_cell({ r: i, c: 2 });
      const cellAddress4 = XLSX.utils.encode_cell({ r: i, c: 3 });
      const cellAddress5 = XLSX.utils.encode_cell({ r: i, c: 4 });

      // Style section headers (CURRENT ASSETS, CURRENT LIABILITIES, etc.)
      if (
        excelData[i][0] === "CURRENT ASSETS" ||
        excelData[i][0] === "CURRENT LIABILITIES" ||
        excelData[i][0] === "ADDITIONAL ITEMS" ||
        excelData[i][0] === "DEDUCTION ITEMS"
      ) {
        if (!ws[cellAddress1]) ws[cellAddress1] = {};
        ws[cellAddress1].s = {
          font: { sz: 14, bold: true, color: { rgb: "000000" } },
          fill: { fgColor: { rgb: "D3D3D3" } },
        };
      }

      // Style column headers
      if (
        excelData[i][0] === "Subject" ||
        excelData[i][0] === "Beginning Total" ||
        excelData[i][0] === "Addition (Debit)" ||
        excelData[i][0] === "Deduction (Credit)" ||
        excelData[i][0] === "End of Total"
      ) {
        if (!ws[cellAddress1]) ws[cellAddress1] = {};
        if (!ws[cellAddress2]) ws[cellAddress2] = {};
        if (!ws[cellAddress3]) ws[cellAddress3] = {};
        if (!ws[cellAddress4]) ws[cellAddress4] = {};
        if (!ws[cellAddress5]) ws[cellAddress5] = {};

        ws[cellAddress1].s = {
          font: { sz: 12, bold: true, color: { rgb: "000000" } },
          fill: { fgColor: { rgb: "E6E6E6" } },
        };
        ws[cellAddress2].s = {
          font: { sz: 12, bold: true, color: { rgb: "000000" } },
          fill: { fgColor: { rgb: "E6E6E6" } },
        };
        ws[cellAddress3].s = {
          font: { sz: 12, bold: true, color: { rgb: "000000" } },
          fill: { fgColor: { rgb: "E6E6E6" } },
        };
        ws[cellAddress4].s = {
          font: { sz: 12, bold: true, color: { rgb: "000000" } },
          fill: { fgColor: { rgb: "E6E6E6" } },
        };
        ws[cellAddress5].s = {
          font: { sz: 12, bold: true, color: { rgb: "000000" } },
          fill: { fgColor: { rgb: "E6E6E6" } },
        };
      }

      // Style totals
      if (excelData[i][0] === "TOTAL") {
        if (!ws[cellAddress1]) ws[cellAddress1] = {};
        if (!ws[cellAddress2]) ws[cellAddress2] = {};
        if (!ws[cellAddress3]) ws[cellAddress3] = {};
        if (!ws[cellAddress4]) ws[cellAddress4] = {};
        if (!ws[cellAddress5]) ws[cellAddress5] = {};

        ws[cellAddress1].s = {
          font: { sz: 12, bold: true, color: { rgb: "000000" } },
          fill: { fgColor: { rgb: "D3D3D3" } },
        };
        ws[cellAddress2].s = {
          font: { sz: 12, bold: true, color: { rgb: "000000" } },
          fill: { fgColor: { rgb: "D3D3D3" } },
          numFmt: '"₱"#,##0.00',
        };
        ws[cellAddress3].s = {
          font: { sz: 12, bold: true, color: { rgb: "000000" } },
          fill: { fgColor: { rgb: "D3D3D3" } },
          numFmt: '"₱"#,##0.00',
        };
        ws[cellAddress4].s = {
          font: { sz: 12, bold: true, color: { rgb: "000000" } },
          fill: { fgColor: { rgb: "D3D3D3" } },
          numFmt: '"₱"#,##0.00',
        };
        ws[cellAddress5].s = {
          font: { sz: 12, bold: true, color: { rgb: "000000" } },
          fill: { fgColor: { rgb: "D3D3D3" } },
          numFmt: '"₱"#,##0.00',
        };
      }

      // Format all number cells with currency format
      if (
        i > 4 && // Skip headers
        excelData[i][0] !== "TOTAL" && // Skip totals (already formatted)
        excelData[i][0] !== "CURRENT ASSETS" &&
        excelData[i][0] !== "CURRENT LIABILITIES" &&
        excelData[i][0] !== "ADDITIONAL ITEMS" &&
        excelData[i][0] !== "DEDUCTION ITEMS" &&
        excelData[i][0] !== "Subject" &&
        excelData[i][0] !== "Beginning Total" &&
        excelData[i][0] !== "Addition (Debit)" &&
        excelData[i][0] !== "Deduction (Credit)" &&
        excelData[i][0] !== "End of Total" &&
        excelData[i][0] !== "" &&
        excelData[i][0] !== "TRIAL BALANCE REPORT" &&
        excelData[i][0] !== "Accounting Period" &&
        !excelData[i][0]?.includes("From:") &&
        !excelData[i][0]?.includes("To:")
      ) {
        if (!ws[cellAddress2]) ws[cellAddress2] = {};
        if (!ws[cellAddress3]) ws[cellAddress3] = {};
        if (!ws[cellAddress4]) ws[cellAddress4] = {};
        if (!ws[cellAddress5]) ws[cellAddress5] = {};

        ws[cellAddress2].s = { numFmt: '"₱"#,##0.00' };
        ws[cellAddress3].s = { numFmt: '"₱"#,##0.00' };
        ws[cellAddress4].s = { numFmt: '"₱"#,##0.00' };
        ws[cellAddress5].s = { numFmt: '"₱"#,##0.00' };
      }
    }

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, "Trial Balance");

    // Generate the Excel file
    const fileName = `Trial_Balance_${dateFrom}_to_${dateTo}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };
  return (
    <div className="h-100 w-100 border bg-white custom-container">
      {authrztn.includes("Reporting-View") ? (
        <>
          <div className="w-100 p-2 d-flex flex-row justify-content-between">
            <div className="d-flex flex-column title-custom">
              <span className="fs-3 text-uppercase">Trial Balance</span>
            </div>
            {authrztn.includes("Reporting-IE") && (
              <div>
                <Button
                  variant="success"
                  className="ms-2"
                  onClick={exportToExcel}
                >
                  Export to Excel
                </Button>
              </div>
            )}
          </div>
          <div className="container-fluid mt-2 p-0">
            {/* <div className="row p-2 mx-auto">
          <div className="col-sm w-100 p-3 payable-card">
            <div className="w-100 border p-3 shadow-sm rounded h-100">
              <div className=" d-flex flex-row align-items-center payable-icon">
                <i class="bx bx-bar-chart-alt fs-3 h-100"></i>
                <h5>Current Asset - Current Liabilities</h5>
              </div>

              <div className=" mt-2 d-flex flex-column payable-card-desc">
                <h1 className="payable-amount text-success text-center">
                  280,000.00
                </h1>
                <span className="text-secondary d-none">
                  INCREASE <strong>12%</strong> VS LAST MONTH
                </span>
              </div>
            </div>
          </div>
          <div className="col-sm w-100 p-3 payable-card">
            <div className="w-100 border p-3 shadow-sm rounded h-100">
              <div className=" d-flex flex-row align-items-center payable-icon">
                <i class="bx bx-bar-chart-alt fs-3 h-100"></i>
                <h5>Additional Items - Deduction Items</h5>
              </div>

              <div className=" mt-2 d-flex flex-column payable-card-desc">
                <h1 className="payable-amount text-success text-center">
                  280,000.00
                </h1>
                <span className="text-secondary d-none">
                  INCREASE <strong>12%</strong> VS LAST MONTH
                </span>
              </div>
            </div>
          </div>
          <div className="col-sm w-100 p-3 payable-card">
            <div className="w-100 border p-3 shadow-sm rounded h-100">
              <div className=" d-flex flex-row align-items-center payable-icon">
                <i class="bx bx-bar-chart-alt fs-3 h-100"></i>
                <h5>Trial Balance</h5>
              </div>

              <div className=" mt-2 d-flex flex-column payable-card-desc">
                <h1 className="payable-amount text-danger text-center">0.00</h1>
                <span className="text-secondary d-none">
                  INCREASE <strong>12%</strong> VS LAST MONTH
                </span>
              </div>
            </div>
          </div>
        </div> */}
          </div>
          <div className="w-100 row mx-auto">
            <h6>Accounting Period</h6>
            <div className="col-sm mb-2">
              <label htmlFor="subject2">Cutoff</label>
              <Form.Select
                id="cutoffSelect"
                value={selectedOptionsCutoff}
                onChange={handleCutoffChange}
                onMouseDown={(e) => {
                  if (cutoffData.length === 0) {
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
                {cutoffData.map((cutoff) => (
                  <option key={cutoff.id} value={cutoff.id}>
                    {cutoff.name}
                  </option>
                ))}
              </Form.Select>
            </div>
            <div className="col-sm mb-2">
              <span>From</span>
              {/* <input
            type="date"
            value={dateFrom}
            name=""
            className="form-control"
            readOnly
            id=""
          /> */}
              <DatePicker
                selected={dateFrom}
                dateFormat="MMM/dd/yyyy"
                className="form-control"
                readOnly
              />
            </div>
            <div className="col-sm mb-2">
              <span>To</span>
              {/* <input
            type="date"
            value={dateTo}
            name=""
            className="form-control"
            readOnly
            id=""
          /> */}
              <DatePicker
                selected={dateTo}
                dateFormat="MMM/dd/yyyy"
                className="form-control"
                readOnly
              />
            </div>
            <div className="col-sm d-flex flex-row align-items-end mb-2 filter-btn-container">
              {/* <button className="btn">Apply Filter</button> */}
              <button className="btn btn-secondary" onClick={clearFilter}>
                Clear Filter
              </button>
            </div>
            <div className="col-sm"></div>
          </div>

          <div className="w-100 d-flex align-items-center mt-4">
            <h5>Cash Transaction Tracking</h5>
            <hr className="flex-grow-1 mx-3" />
          </div>
          <div className="container-fluid mt-4">
            <div className="row mx-auto mt-3">
              <div className="mb-2">
                <div className="w-100 d-flex align-items-center">
                  <p>Current Assets</p>
                  <hr className="flex-grow-1 mx-3" />
                </div>
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th>Beginning Total</th>
                        <th>Addition (Debit)</th>
                        <th>Deduction (Credit)</th>
                        <th>End of Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Cash Account</td>
                        <td>
                          {currentAssetsData.beginningTotalCash?.toLocaleString(
                            "en-US",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          ) || 0.0}
                        </td>
                        <td>
                          {currentAssetsData.debitCash?.toLocaleString(
                            "en-US",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          ) || 0.0}
                        </td>
                        <td>
                          {currentAssetsData.creditCash?.toLocaleString(
                            "en-US",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          ) || 0.0}
                        </td>
                        <td>
                          {currentAssetsData.endOfTotalCash?.toLocaleString(
                            "en-US",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          ) || 0.0}
                        </td>
                      </tr>
                      <tr>
                        <td>Bank Account</td>
                        <td>
                          {currentAssetsData.beginningTotalBank?.toLocaleString(
                            "en-US",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          ) || 0.0}
                        </td>
                        <td>
                          {currentAssetsData.debitBank?.toLocaleString(
                            "en-US",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          ) || 0.0}
                        </td>
                        <td>
                          {currentAssetsData.creditBank?.toLocaleString(
                            "en-US",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          ) || 0.0}
                        </td>
                        <td>
                          {currentAssetsData.endOfTotalBank?.toLocaleString(
                            "en-US",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          ) || 0.0}
                        </td>
                      </tr>
                      <tr>
                        <td>Collection Check / Outstanding Checks</td>
                        <td>
                          {currentAssetsData.pastCollection?.toLocaleString(
                            "en-US",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          ) || 0.0}
                        </td>
                        <td>
                          {currentAssetsData.currentCollection?.toLocaleString(
                            "en-US",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          ) || 0.0}
                        </td>
                        <td>-- -- --</td>
                        <td>
                          {currentAssetsData.currentCollection?.toLocaleString(
                            "en-US",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          ) || 0.0}
                        </td>
                      </tr>
                      <tr>
                        <td>Other Current Asset</td>
                        <td>
                          {currentAssetsData.beginningAssetAmount?.toLocaleString(
                            "en-US",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          ) || 0.0}
                        </td>
                        <td>
                          {currentAssetsData.currentAssetAmountDebit?.toLocaleString(
                            "en-US",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          ) || 0.0}
                        </td>
                        <td>
                          {currentAssetsData.currentAssetAmountCredit?.toLocaleString(
                            "en-US",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          ) || 0.0}
                        </td>
                        <td>
                          {currentAssetsData.endTotalAssetAmount?.toLocaleString(
                            "en-US",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          ) || 0.0}
                        </td>
                      </tr>
                      <tr className="table-primary">
                        <td colSpan="1">
                          <strong>Total:</strong>
                        </td>
                        <td>
                          <strong className="peso">
                            {currentAssetsData.totalSumofBeginningTotal?.toLocaleString(
                              "en-US",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            ) || 0.0}
                          </strong>
                        </td>
                        <td>
                          <strong className="peso">
                            {currentAssetsData.totalSumofDebit?.toLocaleString(
                              "en-US",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            ) || 0.0}
                          </strong>
                        </td>
                        <td>
                          <strong className="peso">
                            {currentAssetsData.totalSumofCredit?.toLocaleString(
                              "en-US",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            ) || 0.0}
                          </strong>
                        </td>
                        <td>
                          <strong className="peso">
                            {currentAssetsData.totalSumofEndTotal?.toLocaleString(
                              "en-US",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            ) || 0.0}
                          </strong>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="mb-2">
                <div className="w-100 d-flex align-items-center">
                  <p>Current Liabilities</p>
                  <hr className="flex-grow-1 mx-3" />
                </div>
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th>Beginning Total</th>
                        <th>Addition (Debit)</th>
                        <th>Deduction (Credit)</th>
                        <th>End of Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Posted Payable Checks</td>
                        <td>
                          {currentLiabilitiesData.pastAmountIssuedCheck?.toLocaleString(
                            "en-US",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          ) || 0.0}
                        </td>
                        <td>-- -- --</td>
                        <td>
                          {currentLiabilitiesData.currentAmountIssuedCheck?.toLocaleString(
                            "en-US",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          ) || 0.0}
                        </td>
                        <td>
                          {currentLiabilitiesData.currentAmountIssuedCheck?.toLocaleString(
                            "en-US",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          ) || 0.0}
                        </td>
                      </tr>
                      <tr>
                        <td>Main Business Payable</td>
                        <td>-- -- --</td>
                        <td>-- -- --</td>
                        <td>-- -- --</td>
                        <td>-- -- --</td>
                      </tr>
                      <tr>
                        <td>Other Payables</td>
                        <td>-- -- --</td>
                        <td>-- -- --</td>
                        <td>-- -- --</td>
                        <td>-- -- --</td>
                      </tr>
                      <tr>
                        <td>Other Current Liabilities</td>
                        <td>
                          {currentLiabilitiesData.beginningLiabilitiesAmount?.toLocaleString(
                            "en-US",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          ) || 0.0}
                        </td>
                        <td>
                          {currentLiabilitiesData.currentLiabilitiesAmountDebit?.toLocaleString(
                            "en-US",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          ) || 0.0}
                        </td>
                        <td>
                          {currentLiabilitiesData.currentLiabilitiesAmountCredit?.toLocaleString(
                            "en-US",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          ) || 0.0}
                        </td>
                        <td>
                          {currentLiabilitiesData.endTotalLiabilitiesAmount?.toLocaleString(
                            "en-US",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          ) || 0.0}
                        </td>
                      </tr>
                      <tr className="table-primary">
                        <td colSpan="1">
                          <strong>Total:</strong>
                        </td>
                        <td>
                          <strong className="peso">
                            {currentLiabilitiesData.totalSumofBeginningLiabilitiesTotal?.toLocaleString(
                              "en-US",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            ) || 0.0}
                          </strong>
                        </td>
                        <td>
                          <strong className="peso">
                            {currentLiabilitiesData.totalSumofLiabilitiesDebit?.toLocaleString(
                              "en-US",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            ) || 0.0}
                          </strong>
                        </td>
                        <td>
                          <strong className="peso">
                            {currentLiabilitiesData.totalSumofLiabilitiesCredit?.toLocaleString(
                              "en-US",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            ) || 0.0}
                          </strong>
                        </td>
                        <td>
                          <strong className="peso">
                            {currentLiabilitiesData.totalSumofEndTotalLiabilities?.toLocaleString(
                              "en-US",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            ) || 0.0}
                          </strong>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="mb-2 d-none">
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <tbody>
                      <tr className="table-secondary">
                        <td>
                          <strong>Current Asset - Current Liabilities</strong>
                        </td>
                        <td>
                          <strong className="peso">280,000.00</strong>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="mb-2">
                <div className="w-100 d-flex align-items-center">
                  <p>Additional Items</p>
                  <hr className="flex-grow-1 mx-3" />
                </div>
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th>Beginning Total</th>
                        <th>Addition (Debit)</th>
                        <th>Deduction (Credit)</th>
                        <th>End of Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Startup Capital</td>
                        <td>
                          {currentAdditionalItemsData.capitalAmount?.toLocaleString(
                            "en-US",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          ) || 0.0}
                        </td>
                        <td>
                          {currentAdditionalItemsData.capitalAmount?.toLocaleString(
                            "en-US",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          ) || 0.0}
                        </td>
                        <td>-- -- --</td>
                        <td>
                          {currentAdditionalItemsData.capitalAmount?.toLocaleString(
                            "en-US",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          ) || 0.0}
                        </td>
                      </tr>
                      <tr>
                        <td>Main Business Income</td>
                        <td>
                          {currentAdditionalItemsData.pastCollected?.toLocaleString(
                            "en-US",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          ) || 0.0}
                        </td>
                        <td>
                          {currentAdditionalItemsData.currentCollected?.toLocaleString(
                            "en-US",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          ) || 0.0}
                        </td>
                        <td>-- -- -</td>
                        <td>
                          {currentAdditionalItemsData.currentCollected?.toLocaleString(
                            "en-US",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          ) || 0.0}
                        </td>
                      </tr>
                      <tr>
                        <td>Other Income</td>
                        <td>
                          {currentAdditionalItemsData.pastOtherIncome?.toLocaleString(
                            "en-US",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          ) || 0.0}
                        </td>
                        <td>
                          {currentAdditionalItemsData.currentOtherIncome?.toLocaleString(
                            "en-US",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          ) || 0.0}
                        </td>
                        <td>-- -- --</td>
                        <td>
                          {currentAdditionalItemsData.currentOtherIncome?.toLocaleString(
                            "en-US",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          ) || 0.0}
                        </td>
                      </tr>
                      <tr className="table-primary">
                        <td colSpan="1">
                          <strong>Total:</strong>
                        </td>
                        <td>
                          <strong className="peso">
                            {currentAdditionalItemsData.totalSumofBeginningAdditionItemsTotal?.toLocaleString(
                              "en-US",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            ) || 0.0}
                          </strong>
                        </td>
                        <td>
                          <strong className="peso">
                            {currentAdditionalItemsData.totalSumofAdditionItemsDebit?.toLocaleString(
                              "en-US",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            ) || 0.0}
                          </strong>
                        </td>
                        <td>
                          <strong className="peso">-- -- --</strong>
                        </td>
                        <td>
                          <strong className="peso">
                            {currentAdditionalItemsData.totalSumofEndTotalAdditionItems?.toLocaleString(
                              "en-US",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            ) || 0.0}
                          </strong>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="mb-2">
                <div className="w-100 d-flex align-items-center">
                  <p>Deduction Items</p>
                  <hr className="flex-grow-1 mx-3" />
                </div>
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th>Beginning Total</th>
                        <th>Addition (Debit)</th>
                        <th>Deduction (Credit)</th>
                        <th>End of Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Addition of Fixed Assets</td>
                        <td>TBA</td>
                        <td>TBA</td>
                        <td>TBA</td>
                        <td>TBA</td>
                        {/* <td>-- -- --</td>
                    <td>20,000.00</td>
                    <td>-- -- --</td>
                    <td>20,000.00</td> */}
                      </tr>
                      <tr>
                        <td>Main-Business Purchase</td>
                        <td>TBA</td>
                        <td>TBA</td>
                        <td>TBA</td>
                        <td>TBA</td>
                        {/* <td>-- -- -</td>
                    <td>50,000.00</td>
                    <td>-- -- -</td>
                    <td>50,000.00</td> */}
                      </tr>
                      <tr>
                        <td>Expenses</td>
                        <td>
                          {currentDeductionItemsData.pastExpenses?.toLocaleString(
                            "en-US",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          ) || 0.0}
                        </td>
                        <td>
                          {currentDeductionItemsData.currentExpenses?.toLocaleString(
                            "en-US",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          ) || 0.0}
                        </td>
                        <td>-- -- --</td>
                        <td>
                          {currentDeductionItemsData.currentExpenses?.toLocaleString(
                            "en-US",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          ) || 0.0}
                        </td>
                      </tr>
                      <tr className="table-primary">
                        <td colSpan="1">
                          <strong>Total:</strong>
                        </td>
                        <td>
                          <strong className="peso">-- -- --</strong>
                        </td>
                        <td>
                          <strong className="peso">-- -- --</strong>
                        </td>
                        <td>
                          <strong className="peso">-- -- --</strong>
                        </td>
                        <td>
                          <strong className="peso">-- -- --</strong>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="mb-2 d-none">
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <tbody>
                      <tr className="table-secondary">
                        <td>
                          <strong>Additional Items - Deduction Items</strong>
                        </td>
                        <td>
                          <strong className="peso">280,000.00</strong>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
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

export default OldTrialBalance;
