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
const NewTrialBalance = ({ authrztn }) => {
  // For Cutoff filter
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

  // States per section
  const [currentAssets, setCurrentAssets] = useState({});
  const [currentLiabilities, setCurrentLiabilities] = useState({});
  const [additionalItems, setAdditionalItems] = useState({});

  // Helper: Formats a number to 2 decimal places, optionally as currency.
  const formatTwoDecimalPlaces = ({ number, currency }) => {
    const value = number || 0;
    return value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      ...(currency && {
        style: "currency",
        currency,
      }),
    });
  };

  // Get the default cutoff
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

        getTrialBalance(defaultCutoff.from, defaultCutoff.to);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Handle cutoff change
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

    getTrialBalance(selectedCutoff.from, selectedCutoff.to);
  };

  // Fetches current assets, liabilities, additions, and deductions for a trial balance within the given date range.
  const getTrialBalance = async (startDate, endDate) => {
    try {
      const trialBalanceEndpoint = `${BASE_URL}/trialBalanceReport`;

      const params = {
        startDate,
        endDate,
      };

      // prettier-ignore
      const [currentAssets, currentLiabilities, additionalItems, deductionItems] = await Promise.allSettled([
        axios.get(`${trialBalanceEndpoint}/current-assets`, { params }),
        axios.get(`${trialBalanceEndpoint}/current-liabilities`, { params }),
        axios.get(`${trialBalanceEndpoint}/additional-items`, { params }),
        axios.get(`${trialBalanceEndpoint}/deduction-items`, { params })
      ]);

      setCurrentAssets(currentAssets.value.data);
      setCurrentLiabilities(currentLiabilities.value.data);
      setAdditionalItems(additionalItems.value.data);

      console.log(deductionItems.value.data);
    } catch (error) {
      console.error(error);
    }
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

          {/* Cutoff Filter */}
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
              <DatePicker
                selected={dateFrom}
                dateFormat="MMM/dd/yyyy"
                className="form-control"
                readOnly
              />
            </div>
            <div className="col-sm mb-2">
              <span>To</span>
              <DatePicker
                selected={dateTo}
                dateFormat="MMM/dd/yyyy"
                className="form-control"
                readOnly
              />
            </div>
            <div className="col-sm"></div>
          </div>

          <div className="w-100 d-flex align-items-center mt-4">
            <h5>Cash Transaction Tracking</h5>
            <hr className="flex-grow-1 mx-3" />
          </div>
          <div className="container-fluid mt-4">
            <div className="row mx-auto mt-3">
              {/* Current Assets Section */}
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
                      {/* prettier-ignore */}
                      <React.Fragment>
                        <tr>
                          <td>Cash Account</td>
                          <td>{formatTwoDecimalPlaces({ number: currentAssets.cashAccount?.beginningTotal, currency: "PHP" })}</td>
                          <td>{formatTwoDecimalPlaces({ number: currentAssets.cashAccount?.debit, currency: "PHP" })}</td>
                          <td>{formatTwoDecimalPlaces({ number: currentAssets.cashAccount?.credit, currency: "PHP" })}</td>
                          <td>{formatTwoDecimalPlaces({ number: currentAssets.cashAccount?.endingTotal, currency: "PHP" })}</td>
                        </tr>
                        <tr>
                          <td>Bank Account</td>
                          <td>{formatTwoDecimalPlaces({ number: currentAssets.bankAccount?.beginningTotal, currency: "PHP" })}</td>
                          <td>{formatTwoDecimalPlaces({ number: currentAssets.bankAccount?.debit, currency: "PHP" })}</td>
                          <td>{formatTwoDecimalPlaces({ number: currentAssets.bankAccount?.credit, currency: "PHP" })}</td>
                          <td>{formatTwoDecimalPlaces({ number: currentAssets.bankAccount?.endingTotal, currency: "PHP" })}</td>
                        </tr>
                        <tr>
                          <td>Collection Check / Outstanding Checks</td>
                          <td>{formatTwoDecimalPlaces({ number: currentAssets.collectionCheck?.beginningTotal, currency: "PHP" })}</td>
                          <td>{formatTwoDecimalPlaces({ number: currentAssets.collectionCheck?.debit, currency: "PHP" })}</td>
                          <td>{formatTwoDecimalPlaces({ number: currentAssets.collectionCheck?.credit, currency: "PHP" })}</td>
                          <td>{formatTwoDecimalPlaces({ number: currentAssets.collectionCheck?.endingTotal, currency: "PHP" })}</td>
                        </tr>
                        <tr>
                          <td>Other Current Asset</td>
                          <td>{formatTwoDecimalPlaces({ number: currentAssets.otherCurrentAsset?.beginningTotal, currency: "PHP" })}</td>
                          <td>{formatTwoDecimalPlaces({ number: currentAssets.otherCurrentAsset?.debit, currency: "PHP" })}</td>
                          <td>{formatTwoDecimalPlaces({ number: currentAssets.otherCurrentAsset?.credit, currency: "PHP" })}</td>
                          <td>{formatTwoDecimalPlaces({ number: currentAssets.otherCurrentAsset?.endingTotal, currency: "PHP" })}</td>
                        </tr>
                        <tr className="table-primary">
                          <td colSpan="1">
                            <strong>Total:</strong>
                          </td>
                          <td>
                            <strong>
                              {formatTwoDecimalPlaces({ number: currentAssets.currentAssetsTotals?.beginningBalanceTotal, currency: "PHP" })}
                            </strong>
                          </td>
                          <td>
                            <strong>
                              {formatTwoDecimalPlaces({ number: currentAssets.currentAssetsTotals?.debitTotal, currency: "PHP" })}
                            </strong>
                          </td>
                          <td>
                            <strong>
                              {formatTwoDecimalPlaces({ number: currentAssets.currentAssetsTotals?.creditTotal, currency: "PHP" })}
                            </strong>
                          </td>
                          <td>
                            <strong>
                              {formatTwoDecimalPlaces({ number: currentAssets.currentAssetsTotals?.endingBalanceTotal, currency: "PHP" })}
                            </strong>
                          </td>
                        </tr>
                      </React.Fragment>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Current Liabilities Section */}
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
                      {/* prettier-ignore */}
                      <React.Fragment>
                      <tr>
                        <td>Posted Payable Checks</td>
                        <td>{formatTwoDecimalPlaces({ number: currentLiabilities.postedPayableChecks?.beginningTotal, currency: "PHP" })}</td>
                        <td>{formatTwoDecimalPlaces({ number: currentLiabilities.postedPayableChecks?.debit, currency: "PHP" })}</td>
                        <td>{formatTwoDecimalPlaces({ number: currentLiabilities.postedPayableChecks?.credit, currency: "PHP" })}</td>
                        <td>{formatTwoDecimalPlaces({ number: currentLiabilities.postedPayableChecks?.endingTotal, currency: "PHP" })}</td>
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
                        <td>{formatTwoDecimalPlaces({ number: currentLiabilities.otherCurrentLiabilities?.beginningTotal, currency: "PHP" })}</td>
                        <td>{formatTwoDecimalPlaces({ number: currentLiabilities.otherCurrentLiabilities?.debit, currency: "PHP" })}</td>
                        <td>{formatTwoDecimalPlaces({ number: currentLiabilities.otherCurrentLiabilities?.credit, currency: "PHP" })}</td>
                        <td>{formatTwoDecimalPlaces({ number: currentLiabilities.otherCurrentLiabilities?.endingTotal, currency: "PHP" })}</td>
                      </tr>
                      <tr className="table-primary">
                        <td colSpan="1">
                          <strong>Total:</strong>
                        </td>
                        <td>
                          <strong>
                            {formatTwoDecimalPlaces({ number: currentLiabilities.currentLiabilitiesTotals?.beginningBalanceTotal, currency: "PHP" })}
                          </strong>
                        </td>
                        <td>
                          <strong>
                            {formatTwoDecimalPlaces({ number: currentLiabilities.currentLiabilitiesTotals?.debitTotal, currency: "PHP" })}
                          </strong>
                        </td>
                        <td>
                          <strong>
                            {formatTwoDecimalPlaces({ number: currentLiabilities.currentLiabilitiesTotals?.creditTotal, currency: "PHP" })}
                          </strong>
                        </td>
                        <td>
                          <strong>
                            {formatTwoDecimalPlaces({ number: currentLiabilities.currentLiabilitiesTotals?.endingBalanceTotal, currency: "PHP" })}
                          </strong>
                        </td>
                      </tr>
                      </React.Fragment>
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

              {/* Additional Items section */}
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
                      {/* prettier-ignore */}
                      <React.Fragment>
                      <tr>
                        <td>Startup Capital</td>
                        <td>{formatTwoDecimalPlaces({ number: additionalItems.startupCapital?.startupBeginningTotal, currency: "PHP" })}</td>
                        <td>{formatTwoDecimalPlaces({ number: additionalItems.startupCapital?.debit, currency: "PHP" })}</td>
                        <td>-- -- --</td>
                        <td>{formatTwoDecimalPlaces({ number: additionalItems.startupCapital?.startupEndingTotal, currency: "PHP" })}</td>
                      </tr>
                      <tr>
                        <td>Main Business Income</td>
                        <td>{formatTwoDecimalPlaces({ number: additionalItems.mainBusinessIncome?.mainBusinessIncomeBeginningTotal, currency: "PHP" })}</td>
                        <td>{formatTwoDecimalPlaces({ number: additionalItems.mainBusinessIncome?.debit, currency: "PHP" })}</td>
                        <td>-- -- -</td>
                        <td>{formatTwoDecimalPlaces({ number: additionalItems.mainBusinessIncome?.mainBusinessIncomeEndingTotal, currency: "PHP" })}</td>
                      </tr>
                      <tr>
                        <td>Other Income</td>
                        <td>{formatTwoDecimalPlaces({ number: additionalItems.otherIncome?.otherIncomeBeginningTotal, currency: "PHP" })}</td>
                        <td>{formatTwoDecimalPlaces({ number: additionalItems.otherIncome?.debit, currency: "PHP" })}</td>
                        <td>-- -- --</td>
                        <td>{formatTwoDecimalPlaces({ number: additionalItems.otherIncome?.otherIncomeEndingTotal, currency: "PHP" })}</td>
                      </tr>
                      <tr className="table-primary">
                        <td colSpan="1">
                          <strong>Total:</strong>
                        </td>
                        <td>
                          <strong>
                            <td>{formatTwoDecimalPlaces({ number: additionalItems.additionalItemsTotals?.beginningBalanceTotal, currency: "PHP" })}</td>
                          </strong>
                        </td>
                        <td>
                          <strong>
                            <td>{formatTwoDecimalPlaces({ number: additionalItems.additionalItemsTotals?.debitTotal, currency: "PHP" })}</td>
                          </strong>
                        </td>
                        <td>
                          <strong className="peso">-- -- --</strong>
                        </td>
                        <td>
                          <strong>
                            <td>{formatTwoDecimalPlaces({ number: additionalItems.additionalItemsTotals?.endingBalanceTotal, currency: "PHP" })}</td>
                          </strong>
                        </td>
                      </tr>
                      </React.Fragment>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Deduction Items section */}
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

export default NewTrialBalance;
