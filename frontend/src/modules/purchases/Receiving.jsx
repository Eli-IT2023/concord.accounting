import { React, useState, useEffect } from "react";
import { Form, Carousel } from "react-bootstrap";
import axios from "axios";
import swal from "sweetalert";
import { Modal, Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { PaginationControls } from "../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../hooks/customHook/paginationHook/useServerPagination";
import BASE_URL from "../../assets/global/url";
import useDecodeToken from "../../hooks/customHook/useDecodeToken";
import "../../assets/css/lionchem.css";
import Logo from "../../assets/img/ELI LOGO.png";
import dayjs from "dayjs";

import generatePDF from "../purchases/Sub Folder/ReceivedPDF";

import generateExcel from "../purchases/Sub Folder/ReceivedExcel";

// for rbac
import NoAccess from "../../assets/img/NoAccess.png";
import { ThreeDot } from "react-loading-indicators";

import * as XLSX from "xlsx";
const Receiving = ({ authrztn, roleType }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // export
  const [settings, setSettings] = useState(null);

  // Fetch settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/CompanyProfile/fetchData`,
        );
        if (response.data.success) {
          setSettings(response.data.data); // logo is already base64 from backend
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };

    fetchSettings();
  }, []);

  // Table state
  const [paginationUrl, setPaginationUrl] = useState(
    BASE_URL + "/Receiving/fetchData",
  );
  const pagination = useServerPagination(paginationUrl, 10);
  const receivingRemarks = "";

  // Filter states
  const [searchText, setSearchText] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");
  const [filterVendor, setFilterVendor] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDateReceived, setFilterDateReceived] = useState("");

  // PO Report Modal states
  const [showPOReport, setShowPOReport] = useState(false);
  const [currentPoId, setCurrentPoId] = useState(null);
  const [receivingHistory, setReceivingHistory] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [poReportData, setPoReportData] = useState(null);

  // Fetch vendor data
  const [vendorData, setVendorData] = useState([]);
  const fetchVendor = () => {
    axios
      .get(BASE_URL + "/Receiving/getVendor")
      .then((res) => {
        if (res.data.success && res.data.data) {
          setVendorData(res.data.data);
        }
      })
      .catch((error) => {
        console.error("Error fetching vendors:", error);
      });
  };

  useEffect(() => {
    fetchVendor();
  }, []);

  // Fetch PO report data when a row is clicked
  const fetchPOReportData = async (poId) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/Receiving/fetchPOReportTab/${poId}`,
      );
      const data = response.data;

      if (data.success && data.data) {
        setReceivingHistory(data.data.rh_receiving_id || []);
        setPoReportData(data.data);

        // Fetch detailed data for the first item
        if (data.data.rh_receiving_id && data.data.rh_receiving_id.length > 0) {
          fetchPOReportTabData(poId, data.data.rh_receiving_id[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching PO report:", error);
      swal("Error", "Failed to load PO report data", "error");
    }
  };

  const fetchPOReportTabData = async (poId, historyId) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/Receiving/fetchPOReportTabData/${historyId}`,
      );
      const data = response.data;

      if (data.success && data.data) {
        // Update the specific history item with detailed data
        setReceivingHistory((prev) =>
          prev.map((item) =>
            item.id === historyId ? { ...item, details: data.data } : item,
          ),
        );
      }
    } catch (error) {
      console.error("Error fetching PO report tab data:", error);
    }
  };

  const [receivingData, setReceivingData] = useState(false);

  const fetchReceivingData = async (poId) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/Receiving/fetchReceivingData/${poId}`,
      );
      if (response.data.success) {
        setReceivingData(response.data.data);
      } else {
        swal(
          "Error",
          response.data.message || "Failed to fetch purchase request",
          "error",
        );
      }
    } catch (error) {
      console.error("Fetch error:", error);
      swal("Error", "Failed to fetch purchase request details", "error");
    }
  };

  const handleShow = (poId) => {
    setCurrentPoId(poId);
    setShowPOReport(true);
    fetchPOReportData(poId);
  };

  const handleClose = () => {
    setShowPOReport(false);
    setCurrentPoId(null);
    setReceivingHistory([]);
    setActiveIndex(0);
    setPoReportData(null);
  };

  const handleSelect = (selectedIndex) => {
    setActiveIndex(selectedIndex);
    if (receivingHistory[selectedIndex]) {
      fetchPOReportTabData(currentPoId, receivingHistory[selectedIndex].id);
    }
  };

  // ### filter start
  const clearDataInputs = () => {
    setFilterVendor("All");
    setFilterStatus("All");
    setFilterDateReceived("");
    setSearchText("");
  };

  const handleFilter = () => {
    setPaginationUrl(BASE_URL + "/Receiving/fetchFilteredData");
    pagination.updateParams({
      filterVendor,
      filterStatus,
    }); // method use to pass to the router
  };

  const handleClearFilter = () => {
    setPaginationUrl(BASE_URL + "/Receiving/fetchData");
    pagination.updateParams({});
    clearDataInputs();
  };

  const handleSearch = (value) => {
    setSearchText(value);
    if (value === "") {
      setPaginationUrl(BASE_URL + "/Receiving/fetchData");
      pagination.updateParams({});
    } else {
      setPaginationUrl(BASE_URL + "/Receiving/fetchSearchData");
      pagination.updateParams({
        searchText: value,
        filterColumn: filterColumn || "all", // Ensure default value
        filterStatus: filterStatus || "All", // Ensure default value
      });
    }
  };

  // ### Filter end ###

  // Render PO Report content for a specific history item
  const renderPOReportContent = (historyItem) => {
    if (!historyItem || !historyItem.details) return null;

    const details = historyItem.details;
    const receivingDate = details.createdAt
      ? new Date(details.createdAt).toLocaleDateString("en-US")
      : "N/A";

    const poRequestDate = details.rh_receiving_id?.receiving_po_id?.po_pr_id
      ?.createdAt
      ? new Date(
          details.rh_receiving_id.receiving_po_id.po_pr_id.createdAt,
        ).toLocaleDateString("en-US")
      : "N/A";

    const vendor = details.rh_receiving_id?.receiving_po_id?.po_vendor;
    const vendorName =
      vendor?.fname && vendor?.lname
        ? `${vendor.fname} ${vendor.lname}`
        : vendor?.company_name || "N/A";

    const requestor =
      details.rh_receiving_id?.receiving_po_id?.po_pr_id?.requestor;
    const requestorName =
      requestor?.fname && requestor?.lname
        ? `${requestor.fname} ${requestor.lname}`
        : "N/A";

    const receivedBy = details.rh_received_by;
    const receivedByName =
      receivedBy?.fname && receivedBy?.lname
        ? `${receivedBy.fname} ${receivedBy.lname}`
        : "N/A";

    return (
      <div className="w-100">
        <div className="d-flex flex-row justify-content-between">
          <div className="d-flex flex-column justify-content-center">
            <span style={{ fontSize: "32px" }} className="fw-semibold">
              PURCHASE ORDER
            </span>
            <span style={{ fontSize: "32px" }} className="fw-semibold">
              RECEIVING REPORT
            </span>
          </div>
          <div className="">
            <img
              src={settings?.logo || Logo}
              alt="Report Logo"
              className="img-fluid"
              style={{ maxHeight: "160px" }}
            />
          </div>
        </div>

        <div className="w-100">
          <span className="fw-semibold" style={{ fontSize: "15px" }}>
            {details.rr_no || "N/A"}
          </span>
        </div>

        <div className="w-100 d-flex flex-row justify-content-between mt-3 mb-3">
          <div className="w-100 d-flex flex-column " style={{ gap: "8px" }}>
            <div className="d-flex flex-row" style={{ fontSize: "15px" }}>
              <span style={{ width: "8.8rem" }}>
                <strong>Vendor Name: </strong>
              </span>
              <span>{vendorName}</span>
            </div>
            <div className="d-flex flex-row" style={{ fontSize: "15px" }}>
              <span style={{ width: "8.8rem" }}>
                <strong>P.O Number: </strong>
              </span>
              <span>
                {details.rh_receiving_id?.receiving_po_id?.po_number || "N/A"}
              </span>
            </div>

            <div className="d-flex flex-row" style={{ fontSize: "15px" }}>
              <span style={{ width: "8.8rem" }}>
                <strong>Duty & Customs: </strong>
              </span>
              <span>
                {(
                  parseFloat(historyItem.details.duty_custom) || 0
                ).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>

            <div className="d-flex flex-row" style={{ fontSize: "15px" }}>
              <span style={{ width: "8.8rem" }}>
                <strong>Shipping Fee: </strong>
              </span>
              <span>
                {(
                  parseFloat(historyItem.details.shipping_fee) || 0
                ).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
          <div
            className="w-100 d-flex flex-column align-items-start "
            style={{ paddingLeft: "2rem", gap: "8px" }}
          >
            <div className="d-flex flex-row" style={{ fontSize: "15px" }}>
              <span style={{ width: "8.8rem" }}>
                <strong>Date Received: </strong>
              </span>
              <span>{receivingDate}</span>
            </div>
            <div className="d-flex flex-row" style={{ fontSize: "15px" }}>
              <span style={{ width: "8.8rem" }}>
                <strong>Date Requested: </strong>
              </span>
              <span>{poRequestDate}</span>
            </div>
            <div className="d-flex flex-row" style={{ fontSize: "15px" }}>
              <span style={{ width: "8.8rem" }}>
                <strong>Received By: </strong>
              </span>
              <span>{receivedByName}</span>
            </div>

            <div className="d-flex flex-row" style={{ fontSize: "15px" }}>
              <span style={{ width: "8.8rem" }}>
                <strong>Requestor: </strong>
              </span>
              <span>{requestorName}</span>
            </div>
          </div>
        </div>

        <div className="w-100 mt-5">
          <table className="table">
            <thead>
              <tr>
                <th
                  className="text-start"
                  style={{ background: "#DBDFE4", color: "#29292A" }}
                >
                  PRODUCT CODE
                </th>
                <th
                  className="text-start"
                  style={{ background: "#DBDFE4", color: "#29292A" }}
                >
                  ITEM
                </th>
                <th
                  className="text-start"
                  style={{ background: "#DBDFE4", color: "#29292A" }}
                >
                  WEIGHT
                </th>
                <th
                  className="text-start"
                  style={{ background: "#DBDFE4", color: "#29292A" }}
                >
                  PACKAGING
                </th>
                <th
                  style={{ background: "#DBDFE4", color: "#29292A" }}
                  className={
                    roleType?.includes("Management") ? "text-start" : "d-none"
                  }
                >
                  UNIT PRICE
                </th>
                <th
                  className="text-start"
                  style={{ background: "#DBDFE4", color: "#29292A" }}
                >
                  BEST BEFORE
                </th>

                {/* <th
                  className="text-start"
                  style={{ background: "#DBDFE4", color: "#29292A" }}
                >
                  ACCEPTED PRODUCTS
                </th>
                <th
                  className="text-start"
                  style={{ background: "#DBDFE4", color: "#29292A" }}
                >
                  REJECTED PRODUCTS
                </th> */}

                <th
                  className="text-start"
                  style={{ background: "#DBDFE4", color: "#29292A" }}
                >
                  REMARKS
                </th>
              </tr>
            </thead>
            <tbody>
              {historyItem.details?.rh_receiving_history_id?.length > 0 ? (
                historyItem.details.rh_receiving_history_id.map(
                  (product, idx) => {
                    const uom =
                      product.rpo_vendor_product_id?.po_vendor_product_id
                        ?.prod_packaging;
                    const uomString = uom.packaging_name
                      ? `${uom.packaging_name} - (${uom.unit_quantity || ""}${
                          uom.unit || ""
                        })`
                      : "";

                    const unitQuantity =
                      product.rpo_vendor_product_id?.unit_quantity || 1;

                    return (
                      <tr key={idx}>
                        <td className="text-start">
                          {product.rpo_vendor_product_id?.po_vendor_product_id
                            ?.product_code || "N/A"}
                        </td>
                        <td className="text-start">
                          {product.rpo_vendor_product_id?.po_vendor_product_id
                            ?.product_name || "N/A"}
                        </td>
                        <td className="text-start">
                          {(
                            parseFloat(
                              product.quantity_received * unitQuantity,
                            ) || 0
                          ).toLocaleString("en-US")}
                        </td>
                        <td>
                          <div className="d-flex flex-row align-items-start justify-content-start gap-3">
                            <span className="text-start">{uomString}</span>
                            <div>
                              {/* Debug check */}
                              {Array.isArray(uom?.images) &&
                              uom.images.length > 0 ? (
                                <>
                                  <img
                                    src={uom.images[0].packaging_image}
                                    alt="Packaging Logo"
                                    className="img-fluid"
                                    style={{
                                      maxHeight: "70px",
                                      maxWidth: "70px",
                                    }}
                                  />
                                </>
                              ) : (
                                "no fetch"
                              )}
                            </div>
                          </div>
                        </td>

                        <td
                          className={
                            roleType?.includes("Management")
                              ? "text-start"
                              : "d-none"
                          }
                        >
                          {(
                            parseFloat(product.rpo_vendor_product_id?.price) ||
                            0
                          ).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="text-start">
                          {product.expiry_date
                            ? new Date(product.expiry_date).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                },
                              )
                            : "---"}
                        </td>

                        {/* <td className="text-start">
                          {
                            // ACCEPTED PRODUCTS CALCULATION
                            (
                              parseFloat(
                                product.quantity_received -
                                  product.rejected_quantity
                              ) || 0
                            ).toLocaleString("en-US")
                          }
                        </td>
                        <td className="text-start">
                          {(
                            parseFloat(product.rejected_quantity) || 0
                          ).toLocaleString("en-US")}
                        </td> */}

                        <td className="text-start">
                          {product.rpo_vendor_product_id?.remarks || ""}
                        </td>
                      </tr>
                    );
                  },
                )
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-3">
                    No products received in this transaction
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const [showClosedRemarks, setShowClosedRemarks] = useState(false);

  const handleShowClosedRemarks = (poId) => {
    fetchReceivingData(poId);
    setShowClosedRemarks(true);
  };

  const handleCloseRemarks = () => {
    setShowClosedRemarks(false);
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
      ) : authrztn.includes("Receiving-View") ? (
        <>
          <div className="w-100 p-2 d-flex flex-row justify-content-between">
            <div className="d-flex flex-column title-custom">
              <span className="fs-3">RECEIVING</span>
              {/* <span>PRODUCT LIST PACKAGING TYPES</span> */}
            </div>

            <div className="d-none">
              <button
                onClick={() => navigate("/purchases/create-purchase-request")}
                className="btn btn-primary d-flex align-items-center title-button"
              >
                <i className="bx bx-plus fs-5"></i> Create
              </button>
            </div>
          </div>

          <div className="container-fluid mt-5">
            <div className="row align-items-end">
              <div className="col-sm mb-3">
                <label htmlFor="vendor">Vendor</label>
                <select
                  name="vendor"
                  id="vendor"
                  className="form-select"
                  value={filterVendor}
                  onChange={(e) => setFilterVendor(e.target.value)}
                >
                  <option value="">Select Vendor</option>
                  {Array.isArray(vendorData) &&
                    vendorData.map((vendor) => (
                      <option key={vendor.id} value={vendor.id}>
                        {[vendor.fname, vendor.lname]
                          .filter(Boolean)
                          .join(" ") ||
                          vendor.company_name ||
                          "Unnamed Vendor"}
                      </option>
                    ))}
                </select>
              </div>
              <div className="col-sm mb-3">
                <label htmlFor="status">Status</label>
                <select
                  name=""
                  id="status"
                  className="form-select"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="" selected>
                    Select Status
                  </option>
                  <option value="All">All Status</option>
                  <option value="For-Receiving">For-Receiving</option>
                  <option value="Partial-Received">Partial-Received</option>
                  <option value="Received">Received</option>
                </select>
              </div>
              <div className="col-sm mb-3 d-none">
                <label htmlFor="dateReceived">Date Received</label>
                <input
                  type="date"
                  name=""
                  id="dateReceived"
                  className="form-control"
                  value={filterDateReceived}
                  onChange={(e) => setFilterDateReceived(e.target.value)}
                />
              </div>
              <div className="col-sm mb-3 d-flex flex-row ">
                <button
                  type="button"
                  className="btn btn-dark"
                  onClick={handleFilter}
                >
                  Apply Filter
                </button>

                <button
                  className="btn btn-light border mx-2"
                  onClick={handleClearFilter}
                >
                  Clear Filter
                </button>
              </div>
              <div className="col-sm mb-3">
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
                          filterColumn === "id" ? "active" : ""
                        }`}
                        onClick={() => setFilterColumn("id")}
                      >
                        PO NO.
                      </button>
                    </li>
                    <li className="d-none">
                      <button
                        className={`dropdown-item ${
                          filterColumn === "pr_no" ? "active" : ""
                        }`}
                        onClick={() => setFilterColumn("pr_no")}
                      >
                        PR NO.
                      </button>
                    </li>
                    <li>
                      <button
                        className={`dropdown-item ${
                          filterColumn === "requestedBy" ? "active" : ""
                        }`}
                        onClick={() => setFilterColumn("requestedBy")}
                      >
                        Requestor
                      </button>
                    </li>
                    <li className="d-none">
                      <button
                        className={`dropdown-item ${
                          filterColumn === "date_needed" ? "active" : ""
                        }`}
                        onClick={() => setFilterColumn("date_needed")}
                      >
                        Date Needed
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="container-fluid">
            <div className="table-responsive data-table scrollable-contents">
              <table
                className="table table-hover table-responsive "
                id="receivingTable"
              >
                <thead className="bg-light">
                  <tr>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      PO NO.
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      REQUESTOR
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      VENDOR
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    {/* <th
                  className="text-muted"
                  style={{ backgroundColor: "#EBEFF4" }}
                >
                  RECEIVED BY
                  <i className="fas fa-sort ms-1"></i>
                </th>
                <th
                  className="text-muted"
                  style={{ backgroundColor: "#EBEFF4" }}
                >
                  DATE RECEIVED
                  <i className="fas fa-sort ms-1"></i>
                </th> */}
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      REMARKS
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      STATUS
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pagination.loading ? (
                    <tr>
                      <td colSpan="7" className="text-center py-4">
                        <div className="d-flex justify-content-center align-items-center">
                          <div
                            className="spinner-border text-primary"
                            role="status"
                          >
                            <span className="visually-hidden">Loading...</span>
                          </div>
                          <span className="ms-2">Loading data...</span>
                        </div>
                      </td>
                    </tr>
                  ) : pagination.error ? (
                    <tr>
                      <td colSpan="7" className="text-center text-danger py-4">
                        <div className="d-flex flex-column align-items-center">
                          <i className="fas fa-exclamation-triangle fs-4 mb-2"></i>
                          <span>Error loading data</span>
                          <small className="text-muted mt-1">
                            {pagination.error.message}
                          </small>
                        </div>
                      </td>
                    </tr>
                  ) : pagination.data.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-4">
                        <div className="d-flex flex-column align-items-center">
                          <span>No data available</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    pagination.data.map((item, index) => {
                      const vendor = item.po_vendor;
                      const vendorName =
                        vendor?.fname && vendor?.lname
                          ? `${vendor.fname} ${vendor.lname}`
                          : vendor?.company_name || "N/A";

                      const requestor = item.po_pr_id?.requestor;
                      const requestorName =
                        requestor?.fname && requestor?.lname
                          ? `${requestor.fname} ${requestor.lname}`
                          : "N/A";

                      const formattedDate = item.po_pr_id?.date_needed
                        ? new Date(
                            item.po_pr_id.date_needed,
                          ).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "2-digit",
                          })
                        : "N/A";

                      return (
                        <tr
                          key={item.id}
                          onClick={() =>
                            item.receiving_po_id?.status === "Received"
                              ? handleShow(item.id)
                              : navigate(`/purchases/receiving-view/${item.id}`)
                          }
                          style={{ cursor: "pointer" }}
                        >
                          <td>{item.po_number}</td>
                          <td>{requestorName}</td>
                          <td>{vendorName}</td>
                          {/* <td>{receiverName}</td> */}
                          {/* <td>{formatttedReceivedAt}</td> */}
                          <td>{item.po_pr_id?.remarks || "---"}</td>
                          <td
                            onClick={(e) => {
                              if (item.receiving_po_id?.isClosed === 1) {
                                e.stopPropagation();
                                handleShowClosedRemarks(item.id);
                              }
                            }}
                          >
                            <span
                              className="poPaymentStatus"
                              style={{
                                backgroundColor:
                                  item.receiving_po_id?.status === "Received" &&
                                  item.receiving_po_id?.isClosed === 1
                                    ? "#FFF5E6" // Orange background for closed status
                                    : item.receiving_po_id?.status ===
                                        "Received"
                                      ? "#EBFFEC" // Green background for regular received
                                      : item.receiving_po_id?.status ===
                                          "Partial-Received"
                                        ? "#E4F0FF" // Blue background for partial
                                        : item.receiving_po_id?.status ===
                                            "For-Receiving"
                                          ? "#FFF9E6" // Light yellow for for-receiving
                                          : "#F0F0F0", // Default gray
                                color:
                                  item.receiving_po_id?.status === "Received" &&
                                  item.receiving_po_id?.isClosed === 1
                                    ? "#E67E22" // Orange text for closed status
                                    : item.receiving_po_id?.status ===
                                        "Received"
                                      ? "#1D8F22" // Green text for regular received
                                      : item.receiving_po_id?.status ===
                                          "Partial-Received"
                                        ? "#3D96FF" // Blue text for partial
                                        : item.receiving_po_id?.status ===
                                            "For-Receiving"
                                          ? "#D4AC0D" // Dark yellow for for-receiving
                                          : "#666666", // Default gray text
                                padding: "4px 8px",
                                borderRadius: "4px",
                                fontWeight: "500",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                minWidth: "70px",
                                justifyContent: "center",
                                cursor:
                                  item.receiving_po_id?.status === "Received" &&
                                  item.receiving_po_id?.isClosed === 1
                                    ? "pointer"
                                    : "default",
                              }}
                              onMouseOver={(e) =>
                                item.receiving_po_id?.isClosed === 1 &&
                                (e.target.style.textDecoration = "underline")
                              }
                              onMouseOut={(e) =>
                                item.receiving_po_id?.isClosed === 1 &&
                                (e.target.style.textDecoration = "none")
                              }
                            >
                              {item.receiving_po_id?.status === "Received" &&
                              item.receiving_po_id?.isClosed === 1 ? (
                                <>Received (Closed)</>
                              ) : (
                                item.receiving_po_id?.status || "N/A"
                              )}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <PaginationControls {...pagination} />
          </div>

          <Modal
            show={showPOReport}
            onHide={handleClose}
            backdrop="static"
            dialogClassName="receiving-pdf-custom-modal-width"
          >
            <Modal.Header
              className="border-bottom p-0 p-2 px-3"
              style={{ background: "#EEEEEE" }}
              closeButton
            >
              <span className="fw-semibold" style={{ fontSize: "15px" }}>
                Generation Report{" "}
                {receivingHistory.length > 1 &&
                  `(${activeIndex + 1}/${receivingHistory.length})`}
              </span>
            </Modal.Header>
            <Modal.Body>
              {receivingHistory.length === 0 ? (
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
                  indicators={receivingHistory.length > 1}
                  controls={receivingHistory.length > 1}
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
                        marginLeft: "-150px", // Pull it to the left edge
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
                        marginRight: "-150px", // Pull it to the right edge
                      }}
                    />
                  }
                >
                  {receivingHistory.map((historyItem, index) => (
                    <Carousel.Item key={historyItem.id}>
                      <div className="w-100 p-2 px-5" id="contentSlide">
                        {renderPOReportContent(historyItem)}
                      </div>
                    </Carousel.Item>
                  ))}
                </Carousel>
              )}
            </Modal.Body>
            <Modal.Footer className="p-0 border-top p-2">
              {roleType?.includes("Management") &&
                authrztn?.includes("Receiving-IE") && (
                  <>
                    <Button
                      variant="danger"
                      onClick={() =>
                        generatePDF(receivingHistory[activeIndex], settings)
                      }
                    >
                      Export to PDF
                    </Button>
                    <Button
                      variant="success"
                      onClick={() =>
                        generateExcel(receivingHistory[activeIndex], settings)
                      }
                    >
                      Export to Excel
                    </Button>
                  </>
                )}
            </Modal.Footer>
          </Modal>

          <Modal
            show={showClosedRemarks}
            onHide={handleCloseRemarks}
            backdrop="static"
            size="lg"
          >
            <Modal.Header
              className="border-0"
              style={{
                padding: "0.75rem 1rem",
              }}
              closeButton
            >
              <Modal.Title>Closed Receiving Remarks</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div className="w-100">
                <div className="mt-1">
                  <div
                    className="card shadow-sm border"
                    style={{ borderRadius: "12px" }}
                  >
                    <div className="card-body p-4">
                      <div className="row align-items-center">
                        <div className="col-md-12">
                          <div className="mb-4 d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
                            <div className="d-flex align-items-center mb-2 mb-md-0">
                              <span className="p-2 fs-6 badge bg-outline-danger bg-opacity-10 text-black d-flex align-items-center">
                                <i className="fas fa-user-check me-2"></i>
                                <span>
                                  Closed by:{" "}
                                  {receivingData?.receiving_closer?.fullName ||
                                    "Unknown"}
                                </span>
                              </span>
                            </div>
                          </div>

                          {/* Improved Remarks section */}
                          <div className="form-floating">
                            <textarea
                              className="form-control bg-light border-0 rounded-3 p-3"
                              rows="5"
                              value={receivingData?.closed_remarks || ""}
                              readOnly
                              placeholder="Remarks"
                              style={{
                                height: "120px",
                                minHeight: "120px",
                                // resize: "none",
                              }}
                            />
                          </div>
                          {!receivingData?.closed_remarks && (
                            <div className="form-text text-muted mt-2 text-center">
                              No remarks provided
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer className="border-0">
              <Button variant="outline-secondary" onClick={handleCloseRemarks}>
                Close
              </Button>
            </Modal.Footer>
          </Modal>
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

export default Receiving;
