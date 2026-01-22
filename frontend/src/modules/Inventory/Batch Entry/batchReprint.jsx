import "@fortawesome/fontawesome-free/css/all.min.css";
import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import swal from "sweetalert";
import BASE_URL from "../../../assets/global/url";
import { PaginationControls } from "../../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../../hooks/customHook/paginationHook/useServerPagination";
import useDecodeToken from "../../../hooks/customHook/useDecodeToken";
import { Modal, Button } from "react-bootstrap";

const BatchEntryReprint = ({ authrztn }) => {
  const navigate = useNavigate();
  const userLoggedID = useDecodeToken();
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

  // Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // 'approve' or 'decline'
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { apiUrl, apiParams } = useMemo(() => {
    if (isSearchMode && searchText) {
      const params = { searchText };
      if (searchCategory !== "all") {
        params.searchCategory = searchCategory;
      }
      return {
        apiUrl: BASE_URL + "/batchEntry/getReprintBySearch",
        apiParams: params,
      };
    } else {
      const params = {
        fromDate: appliedFromDate,
        toDate: appliedToDate,
      };
      if (appliedStatus) {
        params.status = appliedStatus;
      }
      return {
        apiUrl: BASE_URL + "/batchEntry/getReprintData",
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
  };

  const isRowSelectable = (item) => {
    const { status } = item;
    return status === "For-Approval";
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRows([]);
      setSelectAll(false);
    } else {
      const selectableIds =
        pagination.data
          ?.filter((item) => item.status === "For-Approval")
          .map((item, index) => item.id || index) || [];
      setSelectedRows(selectableIds);
      setSelectAll(true);
    }
  };

  const handleRowSelect = (itemId) => {
    setSelectedRows((prev) => {
      const currentSelected = Array.isArray(prev) ? prev : [];

      if (currentSelected.includes(itemId)) {
        return currentSelected.filter((id) => id !== itemId);
      } else {
        return [...currentSelected, itemId];
      }
    });
  };

  const formatDateTime = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return (
      d.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }) +
      " - " +
      d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    );
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
      setFromDate("");
      setToDate("");
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
    requestor: "Search by Requestor",
    approver: "Search by Approver",
    start_date: "Search by Date Requested",
    end_date: "Search by Date Approved",
    status: "Search by Status",
  };

  const handleConfirmAction = (action) => {
    if (!selectedRows || selectedRows.length === 0) {
      swal({
        title: "No Selection",
        text: "Please select at least one row to proceed.",
        icon: "warning",
        button: "OK",
      });
      return;
    }

    setConfirmAction(action);
    setShowConfirmModal(true);
  };

  const handleCloseConfirmModal = () => {
    setShowConfirmModal(false);
    setRemarks("");
    setConfirmAction(null);
  };

  const submitAction = () => {
    if (!confirmAction) return;

    setIsSubmitting(true);

    const selectedItems =
      pagination.data?.filter((item, index) =>
        selectedRows.includes(item.id || index)
      ) || [];

    const newStatus = confirmAction === "approve" ? "Approved" : "Declined";
    const selectedCount = selectedItems.length;

    const requestData = {
      batch_ids: selectedItems.map((item) => item.id),
      status: newStatus,
      action: confirmAction,
      userLoggedID,
      remarks: remarks || null, // Include remarks in the request
    };

    axios
      .post(`${BASE_URL}/batchEntry/approveRejectBatch`, requestData)
      .then((res) => {
        if (res.status === 200) {
          swal({
            title: "Success",
            text: `Successfully ${
              confirmAction === "approve" ? "approved" : "declined"
            } ${selectedCount} item${selectedCount > 1 ? "s" : ""}.`,
            icon: "success",
            button: false,
            timer: 2000,
          }).then(() => {
            setSelectedRows([]);
            setSelectAll(false);
            setRemarks(""); // Clear remarks after submission
            pagination.updateParams(apiParams);
            handleCloseConfirmModal();
          });
        }
      })
      .catch((error) => {
        console.error(
          `Error ${
            confirmAction === "approve" ? "approving" : "declining"
          } items:`,
          error
        );
        if (error.response) {
          const { status, data } = error.response;
          let errorMessage = data.message || "An error occurred";

          // Handle validation errors for remarks if needed
          if (status === 400 && confirmAction === "decline" && data.errors) {
            const remarksError = data.errors.find((e) => e.field === "remarks");
            if (remarksError) {
              errorMessage = remarksError.message;
            }
          }

          swal({
            title: status === 400 ? "Validation Error" : "Error",
            text: errorMessage,
            icon: "error",
            button: "OK",
          });
        } else {
          swal({
            title: "Error",
            text: error.message || "An unexpected error occurred",
            icon: "error",
            button: "OK",
          });
        }
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="w-100 p-2 d-flex flex-row justify-content-between">
        <div className="d-flex flex-row title-custom w-100">
          <span className="fs-3">
            <Link to="/inventory/batch-entry" className="text-dark mx-2">
              <i className="fa-solid fa-arrow-left"></i>
            </Link>
          </span>
          <span className="fs-3 text-black">REPRINT LIST</span>
        </div>
      </div>

      <div className="container-fluid">
        <div className="d-flex justify-content-end gap-2 mb-3">
          <button
            className="btn btn-danger px-4"
            type="button"
            onClick={() => handleConfirmAction("decline")}
            disabled={!selectedRows || selectedRows.length === 0}
          >
            <i className="fas fa-times me-2"></i>
            Decline
          </button>
          <button
            className="btn btn-success px-4"
            type="button"
            onClick={() => handleConfirmAction("approve")}
            disabled={!selectedRows || selectedRows.length === 0}
          >
            <i className="fas fa-check me-2"></i>
            Approve
          </button>
        </div>

        <div className="row gx-2 gy-2 align-items-end">
          <div className="col-md-2">
            <label className="form-label">Status</label>
            <select
              className="form-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="" disabled>
                Select Status
              </option>
              <option value="For-Approval">For-Approval</option>
              <option value="Approved">Approved</option>
              <option value="Declined">Declined</option>
            </select>
          </div>

          <div className="col-md-2">
            <label className="form-label">Date Requested</label>
            <input
              type="date"
              className="form-control"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          <div className="col-md-2">
            <label className="form-label">Date Approved</label>
            <input
              type="date"
              className="form-control"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          <div className="col-md-auto">
            <button className="btn btn-dark me-2" onClick={applyFilters}>
              Apply Filter
            </button>
            <button
              className="btn btn-outline-secondary"
              onClick={clearFilters}
            >
              Clear Filter
            </button>
          </div>

          <div className="col-md">
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder={searchPlaceholders[searchCategory]}
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
              />
              <button
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
                      onClick={() => handleSearchCategoryChange(key)}
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
                  REQUESTOR
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
                  APPROVER
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
                  DATE REQUESTED
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
                  DATE APPROVED
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
                  REMARKS
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
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(item.id || index)}
                        disabled={!isRowSelectable(item)}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => handleRowSelect(item.id || index)}
                        style={{
                          height: "16px",
                          width: "16px",
                          opacity: isRowSelectable(item) ? 1 : 0.5,
                          cursor: isRowSelectable(item)
                            ? "pointer"
                            : "not-allowed",
                        }}
                      />
                    </td>
                    <td
                      className="sticky-column text-primary fw-bold"
                      style={{
                        padding: "12px 8px",
                        verticalAlign: "middle",
                        position: "sticky",
                        left: "0",
                        backgroundColor: "white",
                        zIndex: "5",
                      }}
                    >
                      {item.batch_entry_main?.batch_transaction_number}
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
                      }}
                    >
                      {[
                        item.batch_requested_by?.fname,
                        item.batch_requested_by?.mname,
                        item.batch_requested_by?.lname,
                      ]
                        .filter(Boolean)
                        .join(" ")}
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
                      }}
                    >
                      {[
                        item.batch_approved_by?.fname,
                        item.batch_approved_by?.mname,
                        item.batch_approved_by?.lname,
                      ]
                        .filter(Boolean)
                        .join(" ")}
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
                      }}
                    >
                      {formatDateTime(item.date_requested)}
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
                      }}
                    >
                      {formatDateTime(item.date_approved)}
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
                      }}
                    >
                      {item.remarks}
                    </td>
                    <td
                      className={`sticky-column ${
                        item.status === "For-Approval"
                          ? "text-primary"
                          : item.status === "Approved"
                          ? "text-success"
                          : item.status === "Declined"
                          ? "text-danger"
                          : "text-dark"
                      }`}
                      style={{
                        padding: "12px 8px",
                        verticalAlign: "middle",
                        position: "sticky",
                        left: "0",
                        zIndex: "5",
                      }}
                    >
                      {item.status}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <PaginationControls {...pagination} />
      </div>

      {/* Confirmation Modal */}
      <Modal
        show={showConfirmModal}
        onHide={handleCloseConfirmModal}
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {confirmAction === "approve" ? "Approve Items" : "Decline Items"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Are you sure you want to {confirmAction} {selectedRows.length}{" "}
            selected item{selectedRows.length !== 1 ? "s" : ""}?
          </p>

          <div className="mb-3">
            <label htmlFor="remarks" className="form-label">
              Remarks{" "}
              {confirmAction === "decline" && (
                <span className="text-danger">*</span>
              )}
            </label>
            <textarea
              className="form-control"
              id="remarks"
              rows="3"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              required={confirmAction === "decline"}
            />
            {confirmAction === "decline" && !remarks && (
              <div className="text-danger small">
                Remarks are required when declining
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={handleCloseConfirmModal}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant={confirmAction === "approve" ? "success" : "danger"}
            onClick={submitAction}
            disabled={isSubmitting || (confirmAction === "decline" && !remarks)}
          >
            {isSubmitting ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                {confirmAction === "approve" ? "Approving..." : "Declining..."}
              </>
            ) : confirmAction === "approve" ? (
              "Approve"
            ) : (
              "Decline"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};
export default BatchEntryReprint;
