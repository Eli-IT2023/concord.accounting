import "@fortawesome/fontawesome-free/css/all.min.css";
import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { Button, Carousel, Form, Modal } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import swal from "sweetalert";

import BASE_URL from "../../../assets/global/url";
import dateTimeFormat from "../../../utils/dateTimeFormat";
import { PaginationControls } from "../../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../../hooks/customHook/paginationHook/useServerPagination";
import useDecodeToken from "../../../hooks/customHook/useDecodeToken";
import { handleExportToExcel } from "./batchEntryExcel";
import { handleExportToPDF } from "./batchPDFExport";
import BatchTicketModal from "./batchTicketModal";
const BatchEntry = ({ authrztn, roleType }) => {
  const userLoggedID = useDecodeToken();
  const [showBatchPreview, setShowBatchPreview] = useState(false);
  const [currentBatchId, setCurrentBatchId] = useState(null);
  const [batchTicketData, setBatchTicketData] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const navigate = useNavigate();
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const [appliedFromDate, setAppliedFromDate] = useState("");
  const [appliedToDate, setAppliedToDate] = useState("");
  const [appliedStatus, setAppliedStatus] = useState("");

  const [selectedRows, setSelectedRows] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [searchCategory, setSearchCategory] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [isSearchMode, setIsSearchMode] = useState(false);

  const { apiUrl, apiParams } = useMemo(() => {
    if (isSearchMode && searchText) {
      const params = { searchText };
      if (searchCategory !== "all") {
        params.searchCategory = searchCategory;
      }
      return {
        apiUrl: BASE_URL + "/batchEntry/getBatchEntryBySearch",
        apiParams: params,
      };
    } else {
      const params = {};

      if (appliedFromDate) params.fromDate = appliedFromDate;
      if (appliedToDate) params.toDate = appliedToDate;
      if (appliedStatus) params.status = appliedStatus;

      // If all filters are empty, ensure we send undefined values
      if (!appliedFromDate && !appliedToDate && !appliedStatus) {
        params.fromDate = undefined;
        params.toDate = undefined;
        params.status = undefined;
      }

      return {
        apiUrl: BASE_URL + "/batchEntry/getBatchEntryData",
        apiParams: params,
      };
    }
  }, [
    isSearchMode,
    searchText,
    searchCategory,
    appliedFromDate,
    appliedToDate,
    appliedStatus,
  ]);

  const pagination = useServerPagination(apiUrl, 10, apiParams);

  const [totalForPrinting, setTotalForPrinting] = useState(0);
  const [totalPrinted, setTotalPrinted] = useState(0);
  const [totalBatchTicket, setTotalBatchTicket] = useState(0);

  const [show, setShow] = useState(false);
  const [remarksReprint, setRemarksReprint] = useState("");
  const [validated, setValidated] = useState(false);

  const handleShow = () => {
    if (selectedRows.length === 0) {
      swal({
        title: "No Selection",
        text: "Please select at least one item to request for reprint",
        icon: "warning",
        button: "OK",
      });
      return;
    }
    setShow(true);
  };

  const handleClose = () => {
    setShow(false);
    setRemarksReprint("");
    setValidated(false);
  };

  const fetchCounts = async (fromDateParam, toDateParam) => {
    try {
      const params = new URLSearchParams();
      if (fromDateParam) params.append("fromDate", fromDateParam);
      if (toDateParam) params.append("toDate", toDateParam);

      const response = await fetch(
        `${BASE_URL}/batchEntry/getCounts?${params}`
      );
      const data = await response.json();

      setTotalForPrinting(data.forPrinting || 0);
      setTotalPrinted(data.printed || 0);
      setTotalBatchTicket(data.total || 0);
    } catch (error) {
      console.error("Error fetching counts:", error);
    }
  };

  useEffect(() => {
    pagination.updateParams(apiParams);
  }, [apiParams]);

  useEffect(() => {
    if (!isSearchMode) {
      fetchCounts(appliedFromDate, appliedToDate);
      pagination.updateParams(apiParams);
    }
  }, [appliedFromDate, appliedToDate, isSearchMode]);

  const applyFilters = () => {
    if (isSearchMode) {
      setIsSearchMode(false);
      setSearchText("");
      setSearchCategory("all");
    }

    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
    setAppliedStatus(selectedStatus);
  };

  const clearFilters = () => {
    setFromDate("");
    setToDate("");
    setSelectedStatus("");
    setAppliedFromDate("");
    setAppliedToDate("");
    setAppliedStatus("");
    setIsSearchMode(false);
    setSearchText("");
    setSearchCategory("all");

    pagination.updateParams({
      fromDate: undefined,
      toDate: undefined,
      status: undefined,
      __forceReset: Date.now(), // Add a timestamp to force refresh
    });

    fetchCounts("", "");
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRows([]);
      setSelectAll(false);
    } else {
      const allIds =
        pagination.data?.map((item, index) => item.id || index) || [];
      setSelectedRows(allIds);
      setSelectAll(true);
    }
  };

  const handleRowSelect = (itemId) => {
    setSelectedRows((prev) => {
      const currentSelected = Array.isArray(prev) ? prev : [];
      let newSelected;

      if (currentSelected.includes(itemId)) {
        newSelected = currentSelected.filter((id) => id !== itemId);
      } else {
        newSelected = [...currentSelected, itemId];
      }
      const allIds =
        pagination.data?.map((item, index) => item.id || index) || [];
      setSelectAll(newSelected.length === allIds.length && allIds.length > 0);

      return newSelected;
    });
  };

  const handleSearch = (value) => {
    setSearchText(value);

    if (value.trim()) {
      setIsSearchMode(true);
      setFromDate("");
      setToDate("");
      setSelectedStatus("");
    } else {
      setIsSearchMode(false);
      const todayDate = getTodayDate();
      setFromDate(todayDate);
      setToDate(todayDate);
    }
  };

  const handleSearchCategoryChange = (category) => {
    setSearchCategory(category);
    if (searchText.trim()) {
      setIsSearchMode(true);
    }
  };

  const searchPlaceholders = {
    all: "Search by all fields",
    batch_no: "Search by Batch No",
    mixer: "Search by Mixer",
    start_date: "Search by Start Date",
    end_date: "Search by End Date",
    created_by: "Search by Creator's Name",
    status: "Search by Status",
  };

  const getButtonStates = () => {
    if (selectedRows.length === 0) {
      return {
        reprintDisabled: true,
        printBatchDisabled: true,
      };
    }

    const selectedItems = pagination.data.filter((item) =>
      selectedRows.includes(item.id)
    );

    const selectedStatuses = [
      ...new Set(selectedItems.map((item) => item.status)),
    ];

    if (selectedStatuses.length > 1) {
      return {
        reprintDisabled: true,
        printBatchDisabled: true,
      };
    }

    const singleStatus = selectedStatuses[0];

    if (singleStatus === "For-Printing") {
      return {
        reprintDisabled: true,
        printBatchDisabled: false,
      };
    }

    if (singleStatus === "Printed") {
      return {
        reprintDisabled: false,
        printBatchDisabled: true,
      };
    }

    return {
      reprintDisabled: false,
      printBatchDisabled: false,
    };
  };

  const { reprintDisabled, printBatchDisabled } = getButtonStates();

  const handleRowClick = (id) => {
    navigate(`/inventory/batch-entry-create-update/${id}`);
  };

  const handleShowPreview = async () => {
    if (selectedRows.length === 0) {
      swal(
        "Warning",
        "Please select at least one row to print batch ticket",
        "warning"
      );
      return;
    }

    setCurrentBatchId(selectedRows);

    try {
      const idsParam = selectedRows.join(",");
      const response = await axios.get(
        `${BASE_URL}/batchEntry/getBatchTicketData?ids=${idsParam}`
      );
      const data = response.data;

      if (data.success && data.data) {
        setBatchTicketData(data.data);
        setShowBatchPreview(true);
      } else {
        swal("Error", "No batch ticket data found", "error");
      }
    } catch (error) {
      console.error("Error fetching batch ticket data:", error);
      swal("Error", "Failed to load batch ticket data", "error");
    }
  };

  const handleClosePreview = () => {
    setShowBatchPreview(false);
    setCurrentBatchId(null);
    setActiveIndex(0);
  };

  const handleSelect = (selectedIndex) => {
    setActiveIndex(selectedIndex);
  };

  const handleReprint = () => {
    const form = document.querySelector(".needs-validation");

    if (!form.checkValidity()) {
      setValidated(true);
      return;
    }

    swal({
      title: "Request for Reprint",
      text: `Are you sure you want to request reprint for ${selectedRows.length} selected item(s)?`,
      icon: "warning",
      buttons: true,
      dangerMode: true,
    }).then((confirmed) => {
      if (confirmed) {
        axios
          .post(`${BASE_URL}/batchEntry/requestCreateReprint`, {
            ids: selectedRows,
            remarks: remarksReprint,
            userLoggedID,
          })
          .then((res) => {
            if (res.status === 200) {
              swal({
                title: "Success",
                text:
                  res.data.message || "Reprint request submitted successfully",
                icon: "success",
                button: false,
                timer: 2000,
              });
              setSelectedRows([]);
              setSelectAll(false);
              handleClose();
              fetchReprintCount();
            }
          })
          .catch((error) => {
            console.error("Error requesting reprint:", error);

            if (error.response) {
              const { status, data } = error.response;
              switch (status) {
                case 400:
                  swal({
                    title: "Invalid Request",
                    text:
                      data.message ||
                      "Please check your selection and try again.",
                    icon: "warning",
                    button: "OK",
                  });
                  break;
                case 401:
                  swal({
                    title: "Unauthorized",
                    text: "You are not authorized to perform this action. Please log in again.",
                    icon: "error",
                    button: "OK",
                  });
                  break;
                case 403:
                  swal({
                    title: "Access Denied",
                    text: "You don't have permission to request reprints.",
                    icon: "error",
                    button: "OK",
                  });
                  break;

                case 404:
                  swal({
                    title: "Not Found",
                    text: "The requested resource was not found.",
                    icon: "error",
                    button: "OK",
                  });
                  break;

                case 500:
                  swal({
                    title: "Server Error",
                    text:
                      data.message ||
                      "An internal server error occurred. Please try again later or contact support.",
                    icon: "error",
                    button: "OK",
                  });
                  break;

                default:
                  swal({
                    title: "Request Failed",
                    text:
                      data.message ||
                      `Request failed with status ${status}. Please try again.`,
                    icon: "error",
                    button: "OK",
                  });
              }
            } else if (error.request) {
              swal({
                title: "Network Error",
                text: "Unable to connect to the server. Please check your internet connection and try again.",
                icon: "error",
                button: "OK",
              });
            } else {
              swal({
                title: "Unexpected Error",
                text:
                  error.message ||
                  "An unexpected error occurred. Please try again.",
                icon: "error",
                button: "OK",
              });
            }
          });
      }
    });
  };

  const handleExportToPDFWrapper = () => {
    handleExportToPDF(
      batchTicketData,
      setIsExporting,
      selectedRows,
      pagination,
      apiParams,
      handleClosePreview,
      setSelectedRows,
      setSelectAll
    );
  };

  const handleExportToExcelWrapper = () => {
    handleExportToExcel(batchTicketData, setIsExporting);
  };

  // para sa red na dot in the reprint list
  const [reprintData, setReprintData] = useState(0);

  const fetchReprintCount = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/batchEntry/fetchReprintList`
      );
      if (response.data.success) {
        setReprintData(response.data.count);
      }
    } catch (error) {
      console.error("Error fetching reprint count:", error);
    }
  };

  // Fetch settings on component mount
  useEffect(() => {
    fetchReprintCount();
  }, []);
  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="w-100 p-2 d-flex flex-row justify-content-between">
        <div className="d-flex flex-column title-custom w-100">
          <span className="fs-3">BATCH ENTRY</span>
        </div>

        <div className=" w-100 row">
          <div className="col-12 col-md-8 d-flex flex-row align-items-center mb-2"></div>
          <div className="col-12 col-md-4 d-flex justify-content-end align-items-center mb-2 gap-4">
            <div className="position-relative">
              <Link
                to="/inventory/batch-entry-reprint"
                className="text-primary fw-bold"
                style={{ textDecoration: "none" }}
                onMouseOver={(e) =>
                  (e.target.style.textDecoration = "underline")
                }
                onMouseOut={(e) => (e.target.style.textDecoration = "none")}
              >
                Reprint List
              </Link>

              {reprintData > 0 && (
                <div
                  className="rounded-circle bg-danger position-absolute"
                  style={{ width: "8px", height: "8px", right: -8, top: -5 }}
                ></div>
              )}
            </div>
            <Link
              to="/inventory/batch-entry-create-update"
              className="btn btn-primary d-flex align-items-center"
            >
              <i className="bx bx-plus fs-5 me-1"></i> Create
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="container-fluid">
        <div className="row p-2 mx-auto text-center">
          <div className="col-sm p-3">
            <div className="border shadow-sm rounded h-100 py-3">
              <div className="d-flex align-items-center justify-content-center mb-2">
                <i className="fas fa-print fs-4 text-dark me-2"></i>
                <span className="fw-semibold" style={{ fontSize: "1.1rem" }}>
                  Total For Printing
                </span>
              </div>
              <div>
                <h2 className="text-success m-0">{totalForPrinting}</h2>
              </div>
            </div>
          </div>

          <div className="col-sm p-3">
            <div className="border shadow-sm rounded h-100 py-3">
              <div className="d-flex align-items-center justify-content-center mb-2">
                <i className="fas fa-check-double fs-4 text-dark me-2"></i>
                <span className="fw-semibold" style={{ fontSize: "1.1rem" }}>
                  Total Printed
                </span>
              </div>
              <div>
                <h2 className="text-success m-0">{totalPrinted}</h2>
              </div>
            </div>
          </div>

          <div className="col-sm p-3">
            <div className="border shadow-sm rounded h-100 py-3">
              <div className="d-flex align-items-center justify-content-center mb-2">
                <i className="fas fa-list fs-4 text-dark me-2"></i>
                <span className="fw-semibold" style={{ fontSize: "1.1rem" }}>
                  Total Batch Ticket
                </span>
              </div>
              <div>
                <h2 className="text-success m-0">{totalBatchTicket}</h2>
              </div>
            </div>
          </div>
        </div>

        <div className="row mx-auto mt-2">
          <div className="col-sm mb-2">
            <label htmlFor="select-agent">Status</label>
            <select
              id="select-agent"
              className="form-select"
              aria-label="Select Agent"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="" selected disabled>
                Select Status
              </option>
              <option value="For-Printing">For-Printing</option>
              <option value="Printed">Printed</option>
            </select>
          </div>

          <div className="col-sm mb-2">
            <label htmlFor="date-created">From</label>
            <input
              type="date"
              name="date-created"
              id="date-created"
              className="form-control"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div className="col-sm mb-2">
            <label htmlFor="date-to">To</label>
            <input
              type="date"
              name="date-to"
              id="date-to"
              className="form-control"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <div className="col-sm d-flex flex-row align-items-end mb-2 filter-btn-container w-100">
            <button
              type="button"
              className="btn btn-dark"
              style={{ whiteSpace: "nowrap" }}
              onClick={applyFilters}
            >
              Apply Filter
            </button>
            <button
              className="btn btn-light border"
              style={{ whiteSpace: "nowrap" }}
              onClick={clearFilters}
            >
              Clear Filter
            </button>
          </div>
        </div>

        <div className="row mx-auto mt-2">
          <div className="col-12">
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={searchPlaceholders[searchCategory]}
                aria-label="Search"
              />
              <button
                type="button"
                className="btn btn-outline-secondary dropdown-toggle dropdown-toggle-split"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i className="fa-solid fa-sliders"></i>
              </button>
              <ul className="dropdown-menu dropdown-menu-end">
                {Object.entries(searchPlaceholders).map(([key, value]) => (
                  <li key={key}>
                    <button
                      className={`dropdown-item ${
                        searchCategory === key ? "active" : ""
                      }`}
                      onClick={() => {
                        handleSearchCategoryChange(key);
                      }}
                    >
                      {value}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="p-3">
        <div
          className="table-responsive"
          style={{
            overflowX: "auto",
            maxWidth: "100%",
            border: "1px solid #dee2e6",
            borderRadius: "0.375rem",
          }}
        >
          <table className="table mb-0">
            <thead>
              <tr style={{ backgroundColor: "#EBEFF4" }}>
                <th
                  className="text-muted fw-semibold text-uppercase sticky-column"
                  style={{
                    backgroundColor: "#EBEFF4",
                    borderBottom: "2px solid #dee2e6",
                    fontSize: "0.75rem",
                    padding: "12px 8px",
                    width: "50px",
                    position: "sticky",
                    left: "0",
                    zIndex: "10",
                  }}
                >
                  <input
                    type="checkbox"
                    style={{ height: "18px", width: "18px" }}
                    checked={selectAll}
                    onChange={handleSelectAll}
                  />
                </th>
                <th
                  className="text-muted fw-semibold text-uppercase"
                  style={{
                    backgroundColor: "#EBEFF4",
                    borderBottom: "2px solid #dee2e6",
                    fontSize: "1rem",
                    padding: "12px 8px",
                    width: "140px",
                    whiteSpace: "nowrap",
                  }}
                >
                  BATCH NO
                  <i
                    className="fas fa-sort ms-1 text-muted"
                    style={{ fontSize: "0.7rem" }}
                  ></i>
                </th>
                <th
                  className="text-muted fw-semibold text-uppercase"
                  style={{
                    backgroundColor: "#EBEFF4",
                    borderBottom: "2px solid #dee2e6",
                    fontSize: "1rem",
                    padding: "12px 8px",
                    width: "140px",
                    whiteSpace: "nowrap",
                  }}
                >
                  BATCH NAME
                  <i
                    className="fas fa-sort ms-1 text-muted"
                    style={{ fontSize: "0.7rem" }}
                  ></i>
                </th>
                <th
                  className="text-muted fw-semibold text-uppercase"
                  style={{
                    backgroundColor: "#EBEFF4",
                    borderBottom: "2px solid #dee2e6",
                    fontSize: "1rem",
                    padding: "12px 8px",
                    width: "120px",
                    whiteSpace: "nowrap",
                  }}
                >
                  SCHED START DATE
                  <i
                    className="fas fa-sort ms-1 text-muted"
                    style={{ fontSize: "0.7rem" }}
                  ></i>
                </th>
                <th
                  className="text-muted fw-semibold text-uppercase"
                  style={{
                    backgroundColor: "#EBEFF4",
                    borderBottom: "2px solid #dee2e6",
                    fontSize: "1rem",
                    padding: "12px 8px",
                    width: "120px",
                    whiteSpace: "nowrap",
                  }}
                >
                  SCHED END DATE
                  <i
                    className="fas fa-sort ms-1 text-muted"
                    style={{ fontSize: "0.7rem" }}
                  ></i>
                </th>
                <th
                  className="text-muted fw-semibold text-uppercase"
                  style={{
                    backgroundColor: "#EBEFF4",
                    borderBottom: "2px solid #dee2e6",
                    fontSize: "1rem",
                    padding: "12px 8px",
                    width: "120px",
                    whiteSpace: "nowrap",
                  }}
                >
                  DATE CREATED
                  <i
                    className="fas fa-sort ms-1 text-muted"
                    style={{ fontSize: "0.7rem" }}
                  ></i>
                </th>
                <th
                  className="text-muted fw-semibold text-uppercase"
                  style={{
                    backgroundColor: "#EBEFF4",
                    borderBottom: "2px solid #dee2e6",
                    fontSize: "1rem",
                    padding: "12px 8px",
                    width: "120px",
                    whiteSpace: "nowrap",
                  }}
                >
                  CREATED BY
                  <i
                    className="fas fa-sort ms-1 text-muted"
                    style={{ fontSize: "0.7rem" }}
                  ></i>
                </th>
                <th
                  className="text-muted fw-semibold text-uppercase"
                  style={{
                    backgroundColor: "#EBEFF4",
                    borderBottom: "2px solid #dee2e6",
                    fontSize: "1rem",
                    padding: "12px 8px",
                    width: "120px",
                    whiteSpace: "nowrap",
                  }}
                >
                  STATUS
                  <i
                    className="fas fa-sort ms-1 text-muted"
                    style={{ fontSize: "0.7rem" }}
                  ></i>
                </th>
              </tr>
            </thead>
            <tbody>
              {pagination.loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-4">
                    <div className="d-flex justify-content-center align-items-center">
                      <div
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                      ></div>
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : pagination.error ? (
                <tr>
                  <td colSpan="8" className="text-center text-danger py-4">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    Error loading data
                  </td>
                </tr>
              ) : !pagination.data || pagination.data.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4 text-muted">
                    <i className="fas fa-inbox me-2"></i>
                    No data available
                  </td>
                </tr>
              ) : (
                pagination.data.map((item, index) => (
                  <tr
                    key={item.id || index}
                    style={{
                      cursor: "pointer",
                      borderBottom: "1px solid #f1f3f4",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#f8f9fa";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor =
                        item.status === "Printed"
                          ? "#D4FAFE"
                          : item.status === "For-Printing"
                          ? "#BAFFBA"
                          : "";
                    }}
                    onClick={() => handleRowClick(item.id)}
                  >
                    <td
                      className="sticky-column"
                      style={{
                        padding: "12px 8px",
                        verticalAlign: "middle",
                        position: "sticky",
                        left: "0",
                        backgroundColor: "white",
                        zIndex: "5",
                        backgroundColor:
                          item.status === "Printed"
                            ? "#D4FAFE"
                            : item.status === "For-Printing"
                            ? "#BAFFBA"
                            : "",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(item.id || index)}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => handleRowSelect(item.id || index)}
                        style={{ height: "16px", width: "16px" }}
                      />
                    </td>
                    <td
                      className="sticky-column"
                      style={{
                        padding: "12px 8px",
                        verticalAlign: "middle",
                        position: "sticky",
                        left: "0",
                        backgroundColor: "white",
                        zIndex: "5",
                        backgroundColor:
                          item.status === "Printed"
                            ? "#D4FAFE"
                            : item.status === "For-Printing"
                            ? "#BAFFBA"
                            : "",
                      }}
                    >
                      {item.batch_transaction_number}
                    </td>
                    <td
                      className="sticky-column"
                      style={{
                        padding: "12px 8px",
                        verticalAlign: "middle",
                        position: "sticky",
                        left: "0",
                        backgroundColor: "white",
                        zIndex: "5",
                        backgroundColor:
                          item.status === "Printed"
                            ? "#D4FAFE"
                            : item.status === "For-Printing"
                            ? "#BAFFBA"
                            : "",
                      }}
                    >
                      {/* {(item.batch_entry_tag_mixers || [])
                        .map((m) => m.mixer?.name)
                        .filter(Boolean)
                        .join(", ")} */}

                      {item.batch_name}
                    </td>
                    <td
                      className="sticky-column"
                      style={{
                        padding: "12px 8px",
                        verticalAlign: "middle",
                        position: "sticky",
                        left: "0",
                        backgroundColor: "white",
                        zIndex: "5",
                        backgroundColor:
                          item.status === "Printed"
                            ? "#D4FAFE"
                            : item.status === "For-Printing"
                            ? "#BAFFBA"
                            : "",
                      }}
                    >
                      {dateTimeFormat(item.start_date)}
                    </td>
                    <td
                      className="sticky-column"
                      style={{
                        padding: "12px 8px",
                        verticalAlign: "middle",
                        position: "sticky",
                        left: "0",
                        backgroundColor: "white",
                        zIndex: "5",
                        backgroundColor:
                          item.status === "Printed"
                            ? "#D4FAFE"
                            : item.status === "For-Printing"
                            ? "#BAFFBA"
                            : "",
                      }}
                    >
                      {dateTimeFormat(item.end_date)}
                    </td>
                    <td
                      className="sticky-column"
                      style={{
                        padding: "12px 8px",
                        verticalAlign: "middle",
                        position: "sticky",
                        left: "0",
                        backgroundColor: "white",
                        zIndex: "5",
                        backgroundColor:
                          item.status === "Printed"
                            ? "#D4FAFE"
                            : item.status === "For-Printing"
                            ? "#BAFFBA"
                            : "",
                      }}
                    >
                      {dateTimeFormat(item.createdAt)}
                    </td>
                    <td
                      className="sticky-column"
                      style={{
                        padding: "12px 8px",
                        verticalAlign: "middle",
                        position: "sticky",
                        left: "0",
                        backgroundColor: "white",
                        zIndex: "5",
                        backgroundColor:
                          item.status === "Printed"
                            ? "#D4FAFE"
                            : item.status === "For-Printing"
                            ? "#BAFFBA"
                            : "",
                      }}
                    >
                      {[
                        item.masterlist?.fname,
                        item.masterlist?.mname,
                        item.masterlist?.lname,
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    </td>
                    <td
                      className="sticky-column text-primary"
                      style={{
                        padding: "12px 8px",
                        verticalAlign: "middle",
                        position: "sticky",
                        left: "0",
                        backgroundColor: "white",
                        zIndex: "5",
                        backgroundColor:
                          item.status === "Printed"
                            ? "#D4FAFE"
                            : item.status === "For-Printing"
                            ? "#BAFFBA"
                            : "",
                      }}
                    >
                      {(() => {
                        const approvedReprints = (
                          item.batch_entry_tag_reprints || []
                        ).filter(
                          (reprint) => reprint.status === "Approved"
                        ).length;

                        return item.status === "Printed" && approvedReprints > 0
                          ? `${item.status} (${approvedReprints})`
                          : item.status;
                      })()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <PaginationControls {...pagination} />
      </div>

      <div className="container-fluid">
        <div className="row">
          <div className="col-sm d-flex flex-row gap-2">
            <button
              className={`btn ${
                reprintDisabled ? "btn-secondary" : "btn-primary"
              }`}
              type="button"
              disabled={reprintDisabled}
              style={{
                opacity: reprintDisabled ? 0.6 : 1,
                cursor: reprintDisabled ? "not-allowed" : "pointer",
              }}
              onClick={handleShow}
            >
              Request For Reprint
            </button>
            <button
              className={`btn ${
                printBatchDisabled ? "btn-secondary" : "btn-primary"
              }`}
              type="button"
              disabled={printBatchDisabled}
              style={{
                opacity: printBatchDisabled ? 0.6 : 1,
                cursor: printBatchDisabled ? "not-allowed" : "pointer",
              }}
              onClick={handleShowPreview}
            >
              Print Batch Ticket
            </button>
          </div>

          <div className="col-sm"></div>
          <div className="col-sm"></div>
        </div>
      </div>

      {/* Remarks sa request ng reprint */}
      <Modal
        show={show}
        onHide={handleClose}
        backdrop="static"
        keyboard={false}
      >
        <Form noValidate validated={validated} className="needs-validation">
          <Modal.Header closeButton>
            <Modal.Title>Reprint Remarks</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="mb-2">
              <h6>Are you sure you want to reprint?</h6>
              <Form.Label className="form-label mt-4">
                Remarks <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                value={remarksReprint}
                as="textarea"
                onChange={(e) => setRemarksReprint(e.target.value)}
                placeholder="Leave a comment here"
                style={{ minHeight: "10rem" }}
                required
              />
              <Form.Control.Feedback type="invalid">
                Please provide remarks for the reprint request.
              </Form.Control.Feedback>
            </div>
            <div className="mt-3">
              <p>
                <strong>Selected Items:</strong> {selectedRows.length}
              </p>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button
              type="button"
              variant="outline-secondary"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button type="button" variant="primary" onClick={handleReprint}>
              Submit
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal
        show={showBatchPreview}
        onHide={handleClosePreview}
        backdrop="static"
        dialogClassName="receiving-pdf-custom-modal-width"
      >
        <Modal.Header
          className="border-bottom p-0 p-2 px-3"
          style={{ background: "#EEEEEE" }}
          closeButton
        >
          <span className="fw-semibold" style={{ fontSize: "15px" }}>
            Batch Print Preview{" "}
            {batchTicketData.length > 1 &&
              `(${activeIndex + 1}/${batchTicketData.length})`}
          </span>
        </Modal.Header>
        <Modal.Body>
          {batchTicketData.length === 0 ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading report data...</p>
            </div>
          ) : (
            <Carousel
              activeIndex={activeIndex}
              onSelect={handleSelect}
              interval={null}
              indicators={batchTicketData.length > 1}
              controls={batchTicketData.length > 1}
              prevIcon={
                <span
                  aria-hidden="true"
                  className="carousel-control-prev-icon custom-carousel-control"
                  style={{
                    backgroundColor: "black",
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    backgroundSize: "20px 20px",
                    marginLeft: "-150px",
                  }}
                />
              }
              nextIcon={
                <span
                  aria-hidden="true"
                  className="carousel-control-next-icon custom-carousel-control"
                  style={{
                    backgroundColor: "black",
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    backgroundSize: "20px 20px",
                    marginRight: "-150px",
                  }}
                />
              }
            >
              {batchTicketData.map((batchItem, index) => (
                <Carousel.Item key={batchItem.id}>
                  <div className="w-100 p-2 px-5" id="contentSlide">
                    <BatchTicketModal ticketData={batchItem} />
                  </div>
                </Carousel.Item>
              ))}
            </Carousel>
          )}
        </Modal.Body>
        <Modal.Footer className="p-0 border-top p-2">
          <Button
            variant="danger"
            type="button"
            onClick={handleExportToPDFWrapper}
            disabled={isExporting || batchTicketData.length === 0}
          >
            {isExporting ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Exporting...
              </>
            ) : (
              "Export to PDF"
            )}
          </Button>
          {/* <Button
            variant="success"
            type="button"
            onClick={handleExportToExcelWrapper}
            disabled={isExporting || batchTicketData.length === 0}
          >
            {isExporting ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Exporting...
              </>
            ) : (
              "Export to Excel"
            )}
          </Button> */}
        </Modal.Footer>
      </Modal>
    </div>
  );
};
export default BatchEntry;
