import React, { useState, useEffect, useCallback } from "react";
import { Form } from "react-bootstrap";
import axios from "axios";
import swal from "sweetalert";
import { Modal, Button, OverlayTrigger, Tooltip } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import Select from "react-select";

import BASE_URL from "../../../assets/global/url";
import useDecodeToken from "../../../hooks/customHook/useDecodeToken";
import { PaginationControls } from "../../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../../hooks/customHook/paginationHook/useServerPagination";
import "../../../assets/css/lionchem.css";
import dayjs from "dayjs";

// utils
import dateFormat from "../../../utils/dateFormat";
import amountFormat from "../../../utils/amountFormat";

// import
import * as XLSX from "xlsx";

// Add jsPDF imports
import jsPDF from "jspdf";
import "jspdf-autotable";

// for rbac
import NoAccess from "../../../assets/img/NoAccess.png";
import { ThreeDot } from "react-loading-indicators";

// Custom debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const TaxReport = ({ authrztn, roleType, rbacUserRole }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [month, setMonth] = useState(dayjs().format("YYYY-MM"));
  const [year, setYear] = useState(dayjs().format("YYYY"));
  const [dateFilterType, setDateFilterType] = useState("month"); // "month" or "year"
  const [filterTransactionType, setFilterTransactionType] = useState("");
  const [searchText, setSearchText] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");
  const [taxReports, setTaxReports] = useState([]);
  const [loading, setLoading] = useState(false);

  // pagination
  const [paginationUrl, setPaginationUrl] = useState(
    `${BASE_URL}/TaxReport/fetchData`,
  );
  const pagination = useServerPagination(paginationUrl, 10);

  // Debounced search text
  const debouncedSearchText = useDebounce(searchText, 500); // 500ms delay

  // Effect to handle debounced search
  useEffect(() => {
    if (debouncedSearchText === "") {
      // If search is empty, revert to normal data
      setPaginationUrl(BASE_URL + "/TaxReport/fetchData");
      pagination.updateParams({});
    } else {
      console.log("this is the search value", debouncedSearchText);
      console.log("this is the filter column", filterColumn);

      // Set search URL and update params for search
      setPaginationUrl(BASE_URL + "/TaxReport/searchData");
      pagination.updateParams({
        search: debouncedSearchText,
        filterColumn: filterColumn,
      });
    }
  }, [debouncedSearchText, filterColumn]);

  // Generate years for dropdown (last 15 years + next 1 year) with current year at top
  const generateYearOptions = () => {
    const currentYear = dayjs().year();
    const years = [];

    // Add current year first
    years.push({
      value: currentYear.toString(),
      label: `${currentYear} (Current)`,
      isCurrent: true,
    });

    // Add future years
    for (let i = currentYear + 1; i <= currentYear; i++) {
      years.push({
        value: i.toString(),
        label: i.toString(),
        isCurrent: false,
      });
    }

    // Add past years in descending order
    for (let i = currentYear - 1; i >= currentYear - 15; i--) {
      years.push({
        value: i.toString(),
        label: i.toString(),
        isCurrent: false,
      });
    }

    return years;
  };

  const yearOptions = generateYearOptions();

  // Custom styles for React Select
  const customStyles = {
    control: (base, state) => ({
      ...base,
      borderColor: state.isFocused ? "#80bdff" : "#ced4da",
      boxShadow: state.isFocused
        ? "0 0 0 0.2rem rgba(0, 123, 255, 0.25)"
        : "none",
      "&:hover": {
        borderColor: state.isFocused ? "#80bdff" : "#adb5bd",
      },
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#007bff"
        : state.isFocused
          ? "#f8f9fa"
          : "white",
      color: state.isSelected ? "white" : "black",
      fontWeight: state.data.isCurrent ? "bold" : "normal",
    }),
    singleValue: (base) => ({
      ...base,
      color: "#495057",
    }),
  };

  // for filter
  const clearDataInputs = () => {
    setMonth(dayjs().format("YYYY-MM"));
    setYear(dayjs().format("YYYY"));
    setDateFilterType("month");
    setFilterTransactionType("");
    setSearchText("");
    setFilterColumn("all");
  };

  const handleFilter = () => {
    setPaginationUrl(BASE_URL + "/TaxReport/getFilteredData");
    pagination.updateParams({
      month: dateFilterType === "month" ? month : null,
      year: dateFilterType === "year" ? year : null,
      dateFilterType,
      filterTransactionType,
    });
  };

  const handleClearFilter = () => {
    setPaginationUrl(BASE_URL + "/TaxReport/fetchData");
    pagination.updateParams({});
    clearDataInputs();
  };

  const handleSearch = (value) => {
    setSearchText(value);
    // No need to call API here, the useEffect will handle it via debouncedSearchText
  };

  // Handle year change from React Select
  const handleYearChange = (selectedOption) => {
    setYear(selectedOption ? selectedOption.value : "");
  };

  // Get the current selected year option
  const getSelectedYearOption = () => {
    return yearOptions.find((option) => option.value === year) || null;
  };

  // Check if there's data available for export
  const checkDataAvailability = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/TaxReport/checkDataAvailability`,
        {
          params: {
            month: dateFilterType === "month" ? month : null,
            year: dateFilterType === "year" ? year : null,
            dateFilterType,
            filterTransactionType: filterTransactionType || "",
            search: searchText || "", // Include search text in export check
            filterColumn: filterColumn || "all", // Include filter column in export check
          },
        },
      );

      return response.data.hasData;
    } catch (error) {
      console.error("Error checking data availability:", error);
      return false;
    }
  };

  // for exports
  const handleExport = async (exportType) => {
    let formattedExportType = exportType;

    if (exportType === "pdf") {
      formattedExportType = "PDF";
    } else if (exportType === "excel") {
      formattedExportType = "Excel";
    }

    // First check if there's data available
    const hasData = await checkDataAvailability();

    if (!hasData) {
      let message = "No data available to export";

      if (dateFilterType === "month" && month) {
        const monthName = dayjs(month).format("MMMM YYYY");
        message += ` for ${monthName}`;
      } else if (dateFilterType === "year" && year) {
        message += ` for year ${year}`;
      }

      if (filterTransactionType) {
        message += ` with transaction type: ${filterTransactionType}`;
      }

      if (searchText) {
        message += ` and search: "${searchText}"`;
      }

      message += ".";

      swal({
        title: "No Data Available!",
        text: message,
        icon: "warning",
        button: "OK",
      });
      return;
    }

    // Show confirmation dialog only if there's data
    swal({
      title: "Are you sure?",
      text: `Do you want to export the data to ${formattedExportType}?`,
      icon: "warning",
      buttons: ["Cancel", "Yes, Export"],
      dangerMode: true,
    }).then(async (willExport) => {
      if (willExport) {
        try {
          console.log(`Starting ${exportType} export...`);
          console.log(
            `Current filters - Date Type: ${dateFilterType}, Month: ${month}, Year: ${year}, Transaction Type: ${filterTransactionType}, Search: ${searchText}`,
          );

          // Add your actual export logic here
          if (exportType === "pdf") {
            await exportToPDF();
          } else if (exportType === "excel") {
            await exportToExcel();
          }

          swal({
            title: "Success!",
            text: "Data exported successfully!",
            icon: "success",
            button: false,
            timer: 2000,
          });
        } catch (error) {
          console.error(`Error exporting to ${exportType}:`, error);
          swal({
            title: "Error!",
            text: `Failed to export to ${formattedExportType}`,
            icon: "error",
          });
        }
      } else {
        console.log(`Export to ${exportType} cancelled`);
      }
    });
  };

  // Actual export functions
  const exportToPDF = async () => {
    try {
      console.log("Exporting to PDF...");

      // Fetch all data with current filters (no pagination)
      const response = await axios.get(`${BASE_URL}/TaxReport/exportData`, {
        params: {
          month: dateFilterType === "month" ? month : null,
          year: dateFilterType === "year" ? year : null,
          dateFilterType,
          filterTransactionType: filterTransactionType || "",
          search: searchText || "",
          filterColumn: filterColumn || "all",
        },
      });

      const data = response.data;

      if (!data || data.length === 0) {
        swal({
          title: "No Data!",
          text: "No data available to export with the current filters.",
          icon: "warning",
        });
        return;
      }

      // Create new PDF document
      const doc = new jsPDF();

      // Add title
      let title = "WITHHOLDING TAX REPORT";
      let subtitle = "TAX SUMMARY";

      // Add filter information to title
      let filterInfo = "";
      if (dateFilterType === "month" && month) {
        const monthName = dayjs(month).format("MMMM YYYY");
        filterInfo += ` - ${monthName}`;
      } else if (dateFilterType === "year" && year) {
        filterInfo += ` - Year ${year}`;
      }
      if (filterTransactionType) {
        filterInfo += ` - ${filterTransactionType}`;
      }
      if (searchText) {
        filterInfo += ` - Search: "${searchText}"`;
      }

      // Set title
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(title, 14, 15);

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(subtitle + filterInfo, 14, 22);

      // Prepare table data
      const tableData = data.map((item, index) => [
        index + 1,
        item.transaction_number || "N/A",
        item.transaction_user?.full_name || "N/A",
        item.tax_type || "N/A",
        item.tax_rate ? `${amountFormat(item.tax_rate)} %` : "0.00 %",
        item.transaction_amount
          ? amountFormat(item.transaction_amount)
          : "0.00",
        item.tax_amount ? amountFormat(item.tax_amount) : "0.00",
        item.transaction_status || "N/A",
        item.transaction_date ? dateFormat(item.transaction_date) : "N/A",
      ]);

      // Define table columns
      const tableColumns = [
        "No.",
        "Transaction ID",
        "Customer/Supplier",
        "Tax Type",
        "Tax Rate",
        "Gross Amount",
        "Tax Deduction",
        "Status",
        "Date",
      ];

      // Add table to PDF
      doc.autoTable({
        head: [tableColumns],
        body: tableData,
        startY: 30,
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [235, 239, 244],
          textColor: [0, 0, 0],
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [248, 248, 248],
        },
        columnStyles: {
          0: { cellWidth: 10 }, // No.
          1: { cellWidth: 25 }, // Transaction ID
          2: { cellWidth: 30 }, // Customer/Supplier
          3: { cellWidth: 20 }, // Tax Type
          4: { cellWidth: 15 }, // Tax Rate
          5: { cellWidth: 20 }, // Gross Amount
          6: { cellWidth: 20 }, // Tax Deduction
          7: { cellWidth: 15 }, // Status
          8: { cellWidth: 20 }, // Date
        },
        margin: { top: 30 },
      });

      // Add footer with page numbers
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Page ${i} of ${pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: "center" },
        );
        doc.text(
          `Generated on: ${dayjs().format("YYYY-MM-DD HH:mm")}`,
          14,
          doc.internal.pageSize.height - 10,
        );
      }

      // Generate file name
      let fileName = "Tax_Report";
      if (dateFilterType === "month" && month) {
        const monthName = dayjs(month).format("MMMM_YYYY");
        fileName += `_${monthName}`;
      } else if (dateFilterType === "year" && year) {
        fileName += `_${year}`;
      }
      if (filterTransactionType) {
        fileName += `_${filterTransactionType}`;
      }
      if (searchText) {
        fileName += `_search_${searchText}`;
      }
      fileName += `.pdf`;

      // Save PDF
      doc.save(fileName);

      console.log("PDF export completed successfully!");
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      throw new Error("Failed to export to PDF");
    }
  };

  const exportToExcel = async () => {
    try {
      console.log("Exporting to Excel...");

      // Fetch all data with current filters (no pagination)
      const response = await axios.get(`${BASE_URL}/TaxReport/exportData`, {
        params: {
          month: dateFilterType === "month" ? month : null,
          year: dateFilterType === "year" ? year : null,
          dateFilterType,
          filterTransactionType: filterTransactionType || "",
          search: searchText || "",
          filterColumn: filterColumn || "all",
        },
      });

      const data = response.data;

      if (!data || data.length === 0) {
        swal({
          title: "No Data!",
          text: "No data available to export with the current filters.",
          icon: "warning",
        });
        return;
      }

      // Prepare data for Excel
      const excelData = data.map((item, index) => ({
        "No.": index + 1,
        "Transaction ID": item.transaction_number || "N/A",
        "Customer/Supplier": item.transaction_user?.full_name || "N/A",
        "Tax Type": item.tax_type || "N/A",
        "Tax Rate": item.tax_rate
          ? `${amountFormat(item.tax_rate)} %`
          : "0.00 %",
        "Gross Amount": item.transaction_amount
          ? amountFormat(item.transaction_amount)
          : "0.00",
        "Tax Deduction": item.tax_amount
          ? amountFormat(item.tax_amount)
          : "0.00",
        Status: item.transaction_status || "N/A",
        Date: item.transaction_date ? dateFormat(item.transaction_date) : "N/A",
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      const colWidths = [
        { wch: 5 }, // No.
        { wch: 15 }, // Transaction ID
        { wch: 25 }, // Customer/Supplier
        { wch: 15 }, // Tax Type
        { wch: 12 }, // Tax Rate
        { wch: 15 }, // Gross Amount
        { wch: 15 }, // Tax Deduction
        { wch: 12 }, // Status
        { wch: 15 }, // Date
      ];
      ws["!cols"] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Tax Report");

      // Generate file name based on filters
      let fileName = "Tax_Report";
      if (dateFilterType === "month" && month) {
        const monthName = dayjs(month).format("MMMM_YYYY");
        fileName += `_${monthName}`;
      } else if (dateFilterType === "year" && year) {
        fileName += `_${year}`;
      }
      if (filterTransactionType) {
        fileName += `_${filterTransactionType}`;
      }
      if (searchText) {
        fileName += `_search_${searchText}`;
      }
      fileName += `.xlsx`;

      // Export to Excel
      XLSX.writeFile(wb, fileName);

      console.log("Excel export completed successfully!");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      throw new Error("Failed to export to Excel");
    }
  };

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      {isLoading ? (
        <div className="loading-container">
          <ThreeDot
            variant="brick-stack"
            color="#6290FE"
            size="large"
            text="Loading Data..."
            textColor=""
          />
        </div>
      ) : authrztn.includes("TaxReport-View") ? (
        <>
          <div className="w-100 p-2 d-flex flex-row justify-content-between align-items-center">
            <div className="d-flex flex-column title-custom">
              <span className="fs-3">WITHHOLDING TAX REPORT</span>
              <span>TAX SUMMARY</span>
            </div>
            <div className="d-flex flex-row gap-2">
              <button
                className="btn btn-outline-danger"
                onClick={() => handleExport("pdf")}
              >
                <i className="fa-regular fa-file-pdf me-1"></i> Export to PDF
              </button>
              <button
                className="btn btn-outline-success"
                onClick={() => handleExport("excel")}
              >
                <i className="fa-regular fa-file-excel me-1"></i> Export to
                Excel
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="container-fluid mt-4">
            <div className="row align-items-end">
              {/* Date Filter Type */}
              <div className="col-md-2 col-sm-6 mb-3">
                <label htmlFor="dateFilterType">Date Range</label>
                <select
                  name="dateFilterType"
                  id="dateFilterType"
                  className="form-select"
                  value={dateFilterType}
                  onChange={(e) => setDateFilterType(e.target.value)}
                >
                  <option value="month">By Month</option>
                  <option value="year">By Year</option>
                </select>
              </div>

              {/* Month/Year Selector */}
              <div className="col-md-2 col-sm-6 mb-3">
                <label htmlFor="date">
                  {dateFilterType === "month" ? "Month" : "Year"}
                </label>
                {dateFilterType === "month" ? (
                  <input
                    value={month}
                    type="month"
                    name="date"
                    id="date"
                    className="form-control"
                    onChange={(e) => setMonth(e.target.value)}
                  />
                ) : (
                  <Select
                    value={getSelectedYearOption()}
                    onChange={handleYearChange}
                    options={yearOptions}
                    styles={customStyles}
                    placeholder="Select Year"
                    isSearchable
                    isClearable
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                )}
              </div>

              <div className="col-md-2 col-sm-6 mb-3 ">
                <label htmlFor="transactionType">Transaction Type</label>
                <select
                  name="transactionType"
                  id="transactionType"
                  className="form-select"
                  value={filterTransactionType}
                  onChange={(e) => setFilterTransactionType(e.target.value)}
                >
                  <option value="" disabled>
                    Select Type
                  </option>
                  <option value="Sales">Sales Invoice</option>
                  <option value="Purchase">Purchase Order</option>
                </select>
              </div>

              <div className="col-md-3 col-sm-6 mb-3 d-flex justify-content-start align-items-end gap-2 ">
                <button
                  type="button"
                  className="btn btn-dark"
                  onClick={handleFilter}
                >
                  Apply Filter
                </button>
                <button
                  className="btn btn-light border"
                  onClick={handleClearFilter}
                >
                  Clear Filter
                </button>
              </div>
            </div>
            <div className="row">
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search"
                  value={searchText}
                  onChange={(e) => handleSearch(e.target.value)}
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
                        filterColumn === "all" ? "active" : ""
                      }`}
                      onClick={() => setFilterColumn("all")}
                    >
                      All
                    </button>
                  </li>
                  <li>
                    <button
                      className={`dropdown-item ${
                        filterColumn === "transactionUser" ? "active" : ""
                      }`}
                      onClick={() => setFilterColumn("transactionUser")}
                    >
                      Customer/Supplier
                    </button>
                  </li>
                  <li>
                    <button
                      className={`dropdown-item ${
                        filterColumn === "taxRate" ? "active" : ""
                      }`}
                      onClick={() => setFilterColumn("taxRate")}
                    >
                      Tax Rate
                    </button>
                  </li>
                  <li>
                    <button
                      className={`dropdown-item ${
                        filterColumn === "date" ? "active" : ""
                      }`}
                      onClick={() => setFilterColumn("date")}
                    >
                      Date
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* TABLE */}
          <div className="container-fluid mt-3">
            <div className="table-responsive">
              <table className="table table-hover" id="taxReportTable">
                <thead className="bg-light">
                  <tr>
                    <th
                      className="text-muted"
                      style={{
                        backgroundColor: "#EBEFF4",
                        cursor: "pointer",
                        padding: "0.3rem 0.5rem",
                        whiteSpace: "nowrap",
                        fontSize: "0.85rem",
                      }}
                    >
                      <div className="d-flex flex-row align-items-center ">
                        Transaction ID
                        <span className="d-flex flex-column mx-2">
                          <i
                            className="fa-solid fa-chevron-up"
                            style={{ fontSize: 8 }}
                          ></i>
                          <i
                            className="fa-solid fa-chevron-down"
                            style={{ fontSize: 8 }}
                          ></i>
                        </span>
                      </div>
                    </th>
                    <th
                      className="text-muted"
                      style={{
                        backgroundColor: "#EBEFF4",
                        cursor: "pointer",
                        padding: "0.3rem 0.5rem",
                        whiteSpace: "nowrap",
                        fontSize: "0.85rem",
                      }}
                    >
                      <div className="d-flex flex-row align-items-center">
                        Customer/Supplier
                        <span className="d-flex flex-column mx-2">
                          <i
                            className="fa-solid fa-chevron-up"
                            style={{ fontSize: 8 }}
                          ></i>
                          <i
                            className="fa-solid fa-chevron-down"
                            style={{ fontSize: 8 }}
                          ></i>
                        </span>
                      </div>
                    </th>

                    <th
                      className="text-muted"
                      style={{
                        backgroundColor: "#EBEFF4",
                        cursor: "pointer",
                        padding: "0.3rem 0.5rem",
                        whiteSpace: "nowrap",
                        fontSize: "0.85rem",
                      }}
                    >
                      <div className="d-flex flex-row align-items-center">
                        Tax Type
                        <span className="d-flex flex-column mx-2">
                          <i
                            className="fa-solid fa-chevron-up"
                            style={{ fontSize: 8 }}
                          ></i>
                          <i
                            className="fa-solid fa-chevron-down"
                            style={{ fontSize: 8 }}
                          ></i>
                        </span>
                      </div>
                    </th>

                    <th
                      className="text-muted"
                      style={{
                        backgroundColor: "#EBEFF4",
                        cursor: "pointer",
                        padding: "0.3rem 0.5rem",
                        whiteSpace: "nowrap",
                        fontSize: "0.85rem",
                      }}
                    >
                      <div className="d-flex flex-row align-items-center">
                        Tax Rate
                        <span className="d-flex flex-column mx-2">
                          <i
                            className="fa-solid fa-chevron-up"
                            style={{ fontSize: 8 }}
                          ></i>
                          <i
                            className="fa-solid fa-chevron-down"
                            style={{ fontSize: 8 }}
                          ></i>
                        </span>
                      </div>
                    </th>

                    <th
                      className="text-muted"
                      style={{
                        backgroundColor: "#EBEFF4",
                        cursor: "pointer",
                        padding: "0.3rem 0.5rem",
                        whiteSpace: "nowrap",
                        fontSize: "0.85rem",
                      }}
                    >
                      <div className="d-flex flex-row align-items-center">
                        Gross Amount
                        <span className="d-flex flex-column mx-2">
                          <i
                            className="fa-solid fa-chevron-up"
                            style={{ fontSize: 8 }}
                          ></i>
                          <i
                            className="fa-solid fa-chevron-down"
                            style={{ fontSize: 8 }}
                          ></i>
                        </span>
                      </div>
                    </th>
                    <th
                      className="text-muted"
                      style={{
                        backgroundColor: "#EBEFF4",
                        cursor: "pointer",
                        padding: "0.3rem 0.5rem",
                        whiteSpace: "nowrap",
                        fontSize: "0.85rem",
                      }}
                    >
                      <div className="d-flex flex-row align-items-center">
                        Tax Deduction
                        <span className="d-flex flex-column mx-2">
                          <i
                            className="fa-solid fa-chevron-up"
                            style={{ fontSize: 8 }}
                          ></i>
                          <i
                            className="fa-solid fa-chevron-down"
                            style={{ fontSize: 8 }}
                          ></i>
                        </span>
                      </div>
                    </th>
                    <th
                      className="text-muted"
                      style={{
                        backgroundColor: "#EBEFF4",
                        cursor: "pointer",
                        padding: "0.3rem 0.5rem",
                        whiteSpace: "nowrap",
                        fontSize: "0.85rem",
                      }}
                    >
                      <div className="d-flex flex-row align-items-center">
                        Status
                        <span className="d-flex flex-column mx-2">
                          <i
                            className="fa-solid fa-chevron-up"
                            style={{ fontSize: 8 }}
                          ></i>
                          <i
                            className="fa-solid fa-chevron-down"
                            style={{ fontSize: 8 }}
                          ></i>
                        </span>
                      </div>
                    </th>
                    <th
                      className="text-muted"
                      style={{
                        backgroundColor: "#EBEFF4",
                        cursor: "pointer",
                        padding: "0.3rem 0.5rem",
                        whiteSpace: "nowrap",
                        fontSize: "0.85rem",
                      }}
                    >
                      <div className="d-flex flex-row align-items-center">
                        Date
                        <span className="d-flex flex-column mx-2">
                          <i
                            className="fa-solid fa-chevron-up"
                            style={{ fontSize: 8 }}
                          ></i>
                          <i
                            className="fa-solid fa-chevron-down"
                            style={{ fontSize: 8 }}
                          ></i>
                        </span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pagination.loading ? (
                    <tr>
                      <td colSpan="8" className="text-center">
                        Loading...
                      </td>
                    </tr>
                  ) : pagination.error ? (
                    <tr>
                      <td colSpan="8" className="text-center text-danger">
                        Error loading data
                      </td>
                    </tr>
                  ) : pagination.data.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center">
                        No data available
                      </td>
                    </tr>
                  ) : (
                    pagination.data.map((item) => (
                      <tr key={item.id}>
                        <td>{item.transaction_number}</td>
                        <td>{item.transaction_user?.full_name || "N/A"}</td>
                        <td>{item.tax_type}</td>
                        <td>{amountFormat(item.tax_rate)}%</td>
                        <td>{amountFormat(item.transaction_amount)}</td>
                        <td>{amountFormat(item.tax_amount)}</td>
                        <td>{item.transaction_status}</td>
                        <td>{dateFormat(item.transaction_date)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <PaginationControls {...pagination} />
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

export default TaxReport;
