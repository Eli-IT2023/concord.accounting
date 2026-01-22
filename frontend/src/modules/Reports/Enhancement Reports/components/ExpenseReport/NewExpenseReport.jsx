import React, { useState, useEffect } from "react";
import axios from "axios";
import swal from "sweetalert";
import "@fortawesome/fontawesome-free/css/all.min.css";
import BASE_URL from "../../../../../assets/global/url";
import "../../../../../assets/css/style.css";
import { MultiSelect } from "react-multi-select-component";
import { Form } from "react-bootstrap";
import { CSSTransition } from "react-transition-group";
import DatePicker from "react-datepicker";
import NoAccess from "../../../../../assets/img/NoAccess.png";
import useDecodeToken from "../../../../../hooks/customHook/useDecodeToken";
import { useServerPagination } from "../../../../../hooks/customHook/paginationHook/useServerPagination";
import { PaginationControls } from "../../../../../hooks/customHook/paginationHook/usePagination";
import * as XLSX from "xlsx";

const NewExpenseReport = ({ authrztn }) => {
  const userLoggedID = useDecodeToken();

  // For cutoff filter
  const [cutoffData, setCutoffData] = useState([]);
  const [selectedOptionsCutoff, setSelectedOptionsCutoff] = useState([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isInitialized, setIsInitialized] = useState(false); // Add this state

  // For search functionality
  const [expenseType1SearchText, setExpenseType1SearchText] = useState("");
  const [expenseType1FilterColumn, setExpenseType1FilterColumn] =
    useState("all");
  const [expenseType2SearchText, setExpenseType2SearchText] = useState("");
  const [expenseType2FilterColumn, setExpenseType2FilterColumn] =
    useState("all");

  // For pagination - Expense Type 1
  const expenseTypeOne = useServerPagination(
    isInitialized ? `${BASE_URL}/expensesReport/expense-type-one-search` : null, // Conditional URL
    10,
    {
      startDate: dateFrom,
      endDate: dateTo,
      searchFunction: expenseType1SearchText,
      filterColumn: expenseType1FilterColumn,
    }
  );

  // For pagination - Expense Type 2
  const expenseTypeTwo = useServerPagination(
    isInitialized ? `${BASE_URL}/expensesReport/expense-type-two-search` : null, // Conditional URL
    10,
    {
      startDate: dateFrom,
      endDate: dateTo,
      searchFunction: expenseType2SearchText,
      filterColumn: expenseType2FilterColumn,
    }
  );

  // For overview summary
  const [overview, setOverview] = useState({
    expenseTypeOneCurrentMonth: [],
    expenseTypeOneLastMonth: [],
    currentMonthTotalExpense: 0,
    lastMonthTotalExpense: 0,
    growthIndexTotalExpense: 0,
  });
  const [showTable, setShowTable] = useState(false);
  const toggleTable = () => {
    setShowTable(!showTable);
  };

  // Helper: Formats a number to 2 decimals, optionally as a specified currency
  const formatTwoDecimalPlaces = ({ number, currency }) => {
    const value = number || 0;

    return value?.toLocaleString("en-US", {
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
      const res = await axios.get(`${BASE_URL}/expensesReport/getCutoffs`);
      const sortedData = res.data.sort(
        (a, b) => new Date(b.from) - new Date(a.from)
      );
      setCutoffData(sortedData);

      if (sortedData.length > 0) {
        const defaultCutoff = sortedData[0];
        setSelectedOptionsCutoff(defaultCutoff.id.toString());
        setDateFrom(new Date(defaultCutoff.from).toISOString().split("T")[0]);
        setDateTo(new Date(defaultCutoff.to).toISOString().split("T")[0]);
        setIsInitialized(true); // Mark as initialized after setting dates
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Handle change cutoff
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
  };

  // Update pagination for Expense Type 1
  const getExpenseTypeOne = (cutoff) => {
    if (!isInitialized) return; // Prevent execution if not initialized

    expenseTypeOne.updateApiUrl(
      `${BASE_URL}/expensesReport/expense-type-one-search`
    );
    expenseTypeOne.updateParams({
      startDate: cutoff?.from || dateFrom,
      endDate: cutoff?.to || dateTo,
      searchFunction: expenseType1SearchText,
      filterColumn: expenseType1FilterColumn,
    });
  };

  // Update pagination for Expense Type 2
  const getExpenseTypeTwo = (cutoff) => {
    if (!isInitialized) return; // Prevent execution if not initialized

    expenseTypeTwo.updateApiUrl(
      `${BASE_URL}/expensesReport/expense-type-two-search`
    );
    expenseTypeTwo.updateParams({
      startDate: cutoff?.from || dateFrom,
      endDate: cutoff?.to || dateTo,
      searchFunction: expenseType2SearchText,
      filterColumn: expenseType2FilterColumn,
    });
  };

  // New fetching to get the overview summary for expense type 1
  const getOverview = async () => {
    if (!isInitialized || !dateFrom || !dateTo) return; // Add guard clause

    try {
      const res = await axios.get(`${BASE_URL}/expensesReport/overview`, {
        params: {
          startDate: dateFrom,
          endDate: dateTo,
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

  // Effect for Expense Type 1 search
  useEffect(() => {
    if (isInitialized && dateFrom && dateTo) {
      // Add initialization check
      getExpenseTypeOne();
    }
  }, [expenseType1SearchText, expenseType1FilterColumn, isInitialized]);

  // Effect for Expense Type 2 search
  useEffect(() => {
    if (isInitialized && dateFrom && dateTo) {
      // Add initialization check
      getExpenseTypeTwo();
    }
  }, [expenseType2SearchText, expenseType2FilterColumn, isInitialized]);

  // Reset search text when filter column changes
  useEffect(() => {
    setExpenseType1SearchText("");
  }, [expenseType1FilterColumn]);

  useEffect(() => {
    setExpenseType2SearchText("");
  }, [expenseType2FilterColumn]);

  // Update this effect to include initialization check
  useEffect(() => {
    if (isInitialized && dateFrom && dateTo) {
      // Add initialization check
      getExpenseTypeOne();
      getExpenseTypeTwo();
      getOverview();
    }
  }, [dateFrom, dateTo, isInitialized]);

  useEffect(() => {
    getCutoffs();
  }, []);

  // Dev note:
  const title = `Expense payments are made by order through a Bulk Payment transaction, 
    \nsince there is no option to select by specific expense category; the payment is applied in general. 
    \nTherefore, the payment for the Expenses journal was credited by order to ensure the accuracy of the journal.

    \n- dev note (Nov 25,2025)
  `;

  const exportToExcel = async () => {
    try {
      const workbook = XLSX.utils.book_new();

      // Overview Sheet Data
      // const overviewData = [
      //   ["Expense Report Overview"],
      //   [
      //     "Cutoff Name",
      //     cutoffData.find((c) => c.id.toString() === selectedOptionsCutoff)
      //       ?.name || "N/A",
      //   ],
      //   ["Start Date", dateFrom],
      //   ["End Date", dateTo],
      //   [],
      //   ["EXPENSE OVERVIEW"],
      //   [
      //     "Current Month Total Expense",
      //     formatTwoDecimalPlaces({
      //       number: overview?.currentMonthTotalExpense,
      //       currency: "PHP",
      //     }),
      //   ],
      //   [
      //     "Last Month Total Expense",
      //     formatTwoDecimalPlaces({
      //       number: overview?.lastMonthTotalExpense,
      //       currency: "PHP",
      //     }),
      //   ],
      //   [
      //     "Growth Index Total Expense",
      //     formatTwoDecimalPlaces({
      //       number: overview?.growthIndexTotalExpense,
      //       currency: null,
      //     }) + "%",
      //   ],
      // ];
      // const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData);
      // XLSX.utils.book_append_sheet(workbook, overviewSheet, "Overview");

      // Fetch ALL expense type 1 data for export
      const allExpenseType1Response = await axios.get(
        `${BASE_URL}/expensesReport/expense-type-one-search`,
        {
          params: {
            startDate: dateFrom,
            endDate: dateTo,
            searchFunction: "",
            filterColumn: "all",
            page: 1,
            limit: 999999,
          },
        }
      );

      // Expense Type 1 Sheet Data
      const expenseType1Data = allExpenseType1Response.data.data.map((item) => [
        item.expenses_type_one,
        formatTwoDecimalPlaces({ number: item.lastMonth, currency: "PHP" }),
        formatTwoDecimalPlaces({ number: item.currentMonth, currency: "PHP" }),
        formatTwoDecimalPlaces({ number: item.growthIndex, currency: null }) +
          "%",
      ]);

      const expenseType1Sheet = XLSX.utils.aoa_to_sheet([
        ["Expense Report - Expense Type 1"],
        [
          "Cutoff Name",
          cutoffData.find((c) => c.id.toString() === selectedOptionsCutoff)
            ?.name || "N/A",
        ],
        ["Start Date", dateFrom],
        ["End Date", dateTo],
        [],
        [
          "Category",
          "Last Month Amount",
          "Current Month Amount",
          "Growth Index %",
        ],
        ...expenseType1Data,
      ]);
      XLSX.utils.book_append_sheet(
        workbook,
        expenseType1Sheet,
        "Expense Type 1"
      );

      // Fetch ALL expense type 2 data for export
      const allExpenseType2Response = await axios.get(
        `${BASE_URL}/expensesReport/expense-type-two-search`,
        {
          params: {
            startDate: dateFrom,
            endDate: dateTo,
            searchFunction: "",
            filterColumn: "all",
            page: 1,
            limit: 999999,
          },
        }
      );

      // Expense Type 2 Sheet Data
      const expenseType2Data = allExpenseType2Response.data.data.map((item) => [
        item.sub_type,
        formatTwoDecimalPlaces({ number: item.lastMonth, currency: "PHP" }),
        formatTwoDecimalPlaces({ number: item.currentMonth, currency: "PHP" }),
        formatTwoDecimalPlaces({ number: item.growthIndex, currency: null }) +
          "%",
      ]);

      const expenseType2Sheet = XLSX.utils.aoa_to_sheet([
        ["Expense Report - Expense Type 2"],
        [
          "Cutoff Name",
          cutoffData.find((c) => c.id.toString() === selectedOptionsCutoff)
            ?.name || "N/A",
        ],
        ["Start Date", dateFrom],
        ["End Date", dateTo],
        [],
        [
          "Category",
          "Last Month Amount",
          "Current Month Amount",
          "Growth Index %",
        ],
        ...expenseType2Data,
      ]);
      XLSX.utils.book_append_sheet(
        workbook,
        expenseType2Sheet,
        "Expense Type 2"
      );

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

      // applyStyling(overviewSheet, [0, 1, 2, 3, 5]); // Overview sheet styling
      applyStyling(expenseType1Sheet, [0, 1, 2, 3, 5]);
      applyStyling(expenseType2Sheet, [0, 1, 2, 3, 5]);

      // Generate the Excel file
      const fileName = `Expense_Report_${dateFrom}_to_${dateTo}.xlsx`;
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

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      {authrztn.includes("Reporting-View") ? (
        <>
          <div className="w-100 p-2 d-flex flex-row justify-content-between">
            <div className="d-flex flex-column title-custom">
              <span className="fs-3 text-uppercase">Expenses Report</span>
            </div>

            <div className="d-flex align-items-end gap-4">
              <div>
                <button
                  className="btn btn-success ms-2"
                  onClick={exportToExcel}
                >
                  Export to Excel
                </button>
              </div>
              {userLoggedID === "11111111-1111-1111-1111-111111111111" && (
                <div>
                  <i
                    className="fa-solid fa-circle-info text-primary fs-6"
                    style={{ cursor: "pointer" }}
                    title={title}
                  ></i>
                </div>
              )}
            </div>
          </div>

          {/* Cutoff filter */}
          <div className="w-100 row mx-auto mt-2">
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
            <div className="col-sm" />
            <div className="col-sm" />
          </div>

          <div className="container-fluid mt-2">
            <div className="w-100 d-flex align-items-center mt-4">
              <h5>Summary Of Expenses</h5>
              <hr className="flex-grow-1 mx-3" />
            </div>

            <div className="row">
              <div className="col-sm mb-3">
                <div className="w-100 d-flex align-items-center mt-4">
                  <h5>Expenses Type 1</h5>
                  <hr className="flex-grow-1 mx-3" />
                </div>

                <div className="mt-2">
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search"
                      value={expenseType1SearchText}
                      onChange={(e) =>
                        setExpenseType1SearchText(e.target.value)
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
                            expenseType1FilterColumn === "all" ? "active" : ""
                          }`}
                          onClick={() => setExpenseType1FilterColumn("all")}
                        >
                          All
                        </button>
                      </li>
                      <li>
                        <button
                          className={`dropdown-item ${
                            expenseType1FilterColumn === "expenses_type_one"
                              ? "active"
                              : ""
                          }`}
                          onClick={() =>
                            setExpenseType1FilterColumn("expenses_type_one")
                          }
                        >
                          Expense Type
                        </button>
                      </li>
                      {/* <li>
                        <button
                          className={`dropdown-item ${
                            expenseType1FilterColumn === "description"
                              ? "active"
                              : ""
                          }`}
                          onClick={() =>
                            setExpenseType1FilterColumn("description")
                          }
                        >
                          Description
                        </button>
                      </li> */}
                    </ul>
                  </div>
                </div>

                <div className="w-100">
                  <div className="table-responsive">
                    <table className="table table-bordered mt-4">
                      <thead>
                        <tr>
                          <th>Category</th>
                          <th colSpan="2">Last Month</th>
                          <th colSpan="2">Current Month</th>
                          <th>Growth Index %</th>
                        </tr>
                        <tr>
                          <th></th>
                          <th colSpan="2">Amount</th>
                          <th colSpan="2">Amount</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {expenseTypeOne.data.map((item) => (
                          <tr key={item.expenses_one_id}>
                            <td>{item.expenses_type_one}</td>
                            <td colSpan="2">
                              {formatTwoDecimalPlaces({
                                number: item.lastMonth,
                                currency: "PHP",
                              })}
                            </td>
                            <td colSpan="2">
                              {formatTwoDecimalPlaces({
                                number: item.currentMonth,
                                currency: "PHP",
                              })}
                            </td>
                            <td>
                              {formatTwoDecimalPlaces({
                                number: item.growthIndex,
                                currency: null,
                              })}
                              %
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <PaginationControls {...expenseTypeOne} />
                  </div>
                </div>
              </div>

              <div className="col-sm mb-3">
                <div className="w-100 d-flex align-items-center mt-4">
                  <h5>Expenses Type 2</h5>
                  <hr className="flex-grow-1 mx-3" />
                </div>

                <div className="mt-2">
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search"
                      value={expenseType2SearchText}
                      onChange={(e) =>
                        setExpenseType2SearchText(e.target.value)
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
                            expenseType2FilterColumn === "all" ? "active" : ""
                          }`}
                          onClick={() => setExpenseType2FilterColumn("all")}
                        >
                          All
                        </button>
                      </li>
                      {/* <li>
                        <button
                          className={`dropdown-item ${
                            expenseType2FilterColumn === "expenses_type"
                              ? "active"
                              : ""
                          }`}
                          onClick={() =>
                            setExpenseType2FilterColumn("expenses_type")
                          }
                        >
                          Expense Type
                        </button>
                      </li> */}
                      <li>
                        <button
                          className={`dropdown-item ${
                            expenseType2FilterColumn === "sub_type"
                              ? "active"
                              : ""
                          }`}
                          onClick={() =>
                            setExpenseType2FilterColumn("sub_type")
                          }
                        >
                          Sub Type
                        </button>
                      </li>
                      {/* <li>
                        <button
                          className={`dropdown-item ${
                            expenseType2FilterColumn === "description"
                              ? "active"
                              : ""
                          }`}
                          onClick={() =>
                            setExpenseType2FilterColumn("description")
                          }
                        >
                          Description
                        </button>
                      </li> */}
                    </ul>
                  </div>
                </div>

                <div className="w-100">
                  <div className="table-responsive report-table scrollable-contents">
                    <table className="table table-bordered mt-4">
                      <thead>
                        <tr>
                          <th>Category</th>
                          <th colSpan="2">Last Month</th>
                          <th colSpan="2">Current Month</th>
                          <th>Growth Index %</th>
                        </tr>
                        <tr>
                          <th></th>
                          <th colSpan="2">Amount</th>
                          <th colSpan="2">Amount</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {expenseTypeTwo.data.map((item) => (
                          <tr key={item.id}>
                            <td>{item.sub_type}</td>
                            <td colSpan="2">
                              {formatTwoDecimalPlaces({
                                number: item.lastMonth,
                                currency: "PHP",
                              })}
                            </td>
                            <td colSpan="2">
                              {formatTwoDecimalPlaces({
                                number: item.currentMonth,
                                currency: "PHP",
                              })}
                            </td>
                            <td>
                              {formatTwoDecimalPlaces({
                                number: item.growthIndex,
                                currency: null,
                              })}
                              %
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <PaginationControls {...expenseTypeTwo} />
                  </div>
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

export default NewExpenseReport;
