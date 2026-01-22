import { React, useState, useEffect } from "react";
import { Form } from "react-bootstrap";
import axios from "axios";
import swal from "sweetalert";
import { Modal, Button } from "react-bootstrap";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PaginationControls } from "../../../hooks/customHook/paginationHook/usePagination"; // Import our custom hook and component
import { useServerPagination } from "../../../hooks/customHook/paginationHook/useServerPagination"; // Import our custom hook and component

import BASE_URL from "../../../assets/global/url";
import useDecodeToken from "../../../hooks/customHook/useDecodeToken";

import "../../../assets/css/lionchem.css";

const Receiving_update = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const userLoggedID = useDecodeToken();
  // ### formats
  const formatCurrencyInput = (value, isBlur = false) => {
    // Remove all non-digit and non-dot characters
    let numericValue = value.replace(/[^0-9.]/g, "");

    // Handle multiple decimal points
    const parts = numericValue.split(".");
    if (parts.length > 2) {
      numericValue = parts[0] + "." + parts.slice(1).join("");
    }

    // Format the whole number part with commas
    if (parts[0]) {
      const wholeNumber = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");

      // Handle decimal part
      if (parts[1] !== undefined) {
        // On blur, ensure exactly 2 decimal places
        if (isBlur) {
          const decimalPart = parts[1].padEnd(2, "0").slice(0, 2);
          return `${wholeNumber}.${decimalPart}`;
        }
        return `${wholeNumber}.${parts[1].slice(0, 2)}`;
      }

      // On blur, add .00 if no decimal
      if (isBlur && !numericValue.includes(".")) {
        return `${wholeNumber}.00`;
      }
      return wholeNumber;
    }

    // Handle cases where user starts with decimal point
    if (numericValue.startsWith(".")) {
      const decimalPart = numericValue.slice(1).replace(/[^0-9]/g, "");
      return `0.${decimalPart.slice(0, 2)}`;
    }

    return numericValue;
  };

  // ### format end

  //   fetch data
  const [fetchPO, setFetchPO] = useState(null);

  useEffect(() => {
    if (id) {
      fetchPOData();
    }
  }, [id]);

  const fetchPOData = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/Receiving/fetchPO/${id}`);
      if (response.data.success) {
        setFetchPO(response.data.data);
      } else {
        swal(
          "Error",
          response.data.message || "Failed to fetch purchase request",
          "error"
        );
      }
    } catch (error) {
      console.error("Fetch error:", error);
      swal("Error", "Failed to fetch purchase request details", "error");
    }
  };

  const vendor = fetchPO?.po_vendor;
  const vendorName =
    vendor?.fname && vendor?.lname
      ? `${vendor.fname} ${vendor.lname}`
      : vendor?.company_name || "N/A";

  const requestor = fetchPO?.po_pr_id?.requestor;
  const requestorName =
    requestor?.fname && requestor?.lname
      ? `${requestor.fname} ${requestor.lname}`
      : "N/A";

  const approver = fetchPO?.po_approver;
  const approverName =
    approver?.fname && approver?.lname
      ? `${approver.fname} ${approver.lname}`
      : "N/A";

  const formattedDate = fetchPO?.po_pr_id?.date_needed
    ? new Date(fetchPO?.po_pr_id?.date_needed).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "2-digit",
      })
    : "N/A";

  // fetch data end

  // fetch products

  // ##### table #####
  const [receivedQuantities, setReceivedQuantities] = useState({});
  const [expiryDates, setExpiryDates] = useState({});

  const [paginationUrl, setPaginationUrl] = useState(
    `${BASE_URL}/Receiving/fetchPOList/${id}`
  );
  const pagination = useServerPagination(paginationUrl, 10);

  // ##### table end #####

  // ### received status
  const [dutyCustom, setDutyCustom] = useState("");
  const [shippingFee, setShippingFee] = useState("");
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [submissionData, setSubmissionData] = useState(null);

  const [validationErrors, setValidationErrors] = useState({
    quantities: {},
    dates: {},
  });

  // Add this submit handler
  const handleSubmit = () => {
    // Validate quantities and dates
    const newQuantityErrors = {};
    const newDateErrors = {};
    let isValid = true;

    pagination.data.forEach((item) => {
      if (
        !receivedQuantities[item.id] ||
        receivedQuantities[item.id].trim() === ""
      ) {
        newQuantityErrors[item.id] = true;
        isValid = false;
      }
      if (!expiryDates[item.id] || expiryDates[item.id].trim() === "") {
        newDateErrors[item.id] = true;
        isValid = false;
      }
    });

    setValidationErrors({
      quantities: newQuantityErrors,
      dates: newDateErrors,
    });

    if (!isValid) {
      swal(
        "Error",
        "Please fill all quantity received and expiry date fields",
        "error"
      );
      return;
    }

    // Prepare the data structure with commas removed from duty_custom and shipping_fee
    const data = {
      po_id: id,
      duty_custom: dutyCustom.replace(/,/g, ""),
      shipping_fee: shippingFee.replace(/,/g, ""),
      receivedBy: userLoggedID,
      product_list: pagination.data.map((item) => ({
        id: item.id,
        ordered_quantity: item.quantity,
        total_received: item.total_received,
        quantity_received: receivedQuantities[item.id].replace(/,/g, ""),
        expiry_date: expiryDates[item.id],
      })),
    };

    setSubmissionData(data);
    setShowConfirmationModal(true);
  };

  const handleConfirmSubmit = async () => {
    try {
      console.log("Submitting data:", submissionData);
      const response = await axios.post(
        `${BASE_URL}/Receiving/updateReceive`,
        submissionData
      );

      if (response.data.success) {
        swal({
          title: "Success!",
          text: "Receiving updated successfully",
          icon: "success",
          button: false,
          timer: 2500,
        }).then(() => {
          window.location.href = "/purchases/receiving"; // ← redirect using href
        });
      } else {
        throw new Error(
          response.data.message || "Failed to update receiving data"
        );
      }
    } catch (error) {
      console.error("Submission error:", error);
      swal(
        "Error",
        error.message || "Failed to submit receiving data",
        "error"
      );
    } finally {
      setShowConfirmationModal(false);
    }
  };

  // ### received status end

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="w-100 p-2 d-flex flex-row justify-content-between">
        <div className="d-flex flex-column title-custom2">
          <span className="fs-3">
            <button
              onClick={() => navigate("/purchases/receiving")}
              className="text-dark border-0"
              style={{ background: "none" }}
            >
              <i className="bx bx-arrow-back"></i>
            </button>
            <span className="mx-2">RECEIVING</span>
          </span>
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
      <div className="container-fluid mt-4">
        <div className="row">
          <div className="col-sm">
            <label htmlFor="">Purchase Order ID</label>
            <input
              type="text"
              name=""
              id=""
              className="form-control mb-2"
              readOnly
              value={fetchPO?.po_number}
            />
          </div>
          <div className="col-sm">
            <label htmlFor="">Vendor</label>
            <input
              type="text"
              name=""
              id=""
              className="form-control mb-2"
              readOnly
              value={vendorName}
            />
          </div>
        </div>
        <div className="row ">
          <div className="col-sm">
            <label htmlFor="">Approver</label>
            <input
              type="text"
              name=""
              id=""
              className="form-control mb-2"
              readOnly
              value={approverName}
            />
          </div>
          <div className="col-sm">
            <label htmlFor="">Requestor</label>
            <input
              type="text"
              name=""
              id=""
              className="form-control mb-2"
              readOnly
              value={requestorName}
            />
          </div>
        </div>
        <div className="row ">
          <div className="col-sm">
            <label htmlFor="">Remarks</label>
            <textarea
              name=""
              id=""
              cols="5"
              rows="5"
              className="form-control mb-2"
              readOnly
              value={fetchPO?.po_pr_id?.remarks}
            ></textarea>
          </div>
          <div className="col-sm">
            <label htmlFor="">Date Needed</label>
            <input
              type="text"
              name=""
              id=""
              className="form-control mb-2"
              readOnly
              value={formattedDate}
            />
          </div>
        </div>
      </div>

      <div className="container-fluid mt-4">
        <div className="w-100 d-flex align-items-center">
          <span>Receiving Information</span>
          <hr className="flex-grow-1 mx-3" />
        </div>
        <div className="row p-2">
          <div className="col-sm">
            <label htmlFor="">Duty & Custom</label>
            <input
              type="text"
              className="form-control mb-2"
              placeholder="0.00"
              value={dutyCustom}
              onChange={(e) => {
                const formattedValue = formatCurrencyInput(e.target.value);
                setDutyCustom(formattedValue);
              }}
              onBlur={(e) => {
                const formattedValue = formatCurrencyInput(
                  e.target.value,
                  true
                );
                setDutyCustom(formattedValue);
              }}
            />
          </div>
          <div className="col-sm">
            <label htmlFor="">Shipping Fee</label>
            <input
              type="text"
              className="form-control mb-2"
              placeholder="0.00"
              value={shippingFee}
              onChange={(e) => {
                const formattedValue = formatCurrencyInput(e.target.value);
                setShippingFee(formattedValue);
              }}
              onBlur={(e) => {
                const formattedValue = formatCurrencyInput(
                  e.target.value,
                  true
                );
                setShippingFee(formattedValue);
              }}
            />
          </div>
        </div>
      </div>

      <div className="container-fluid mt-4">
        <div className="w-100 d-flex align-items-center">
          <span>Order Items</span>
          <hr className="flex-grow-1 mx-3" />
        </div>

        <div className="table-responsive data-table scrollable-contents mt-3">
          <table
            className="table table-hover table-responsive"
            id="receivingPOListTable"
          >
            <thead className="bg-light">
              <tr>
                <th
                  className="text-muted"
                  style={{ backgroundColor: "#EBEFF4" }}
                >
                  PRODUCT ID <i className="fas fa-sort ms-1"></i>
                </th>
                <th
                  className="text-muted"
                  style={{ backgroundColor: "#EBEFF4" }}
                >
                  PRODUCT NAME <i className="fas fa-sort ms-1"></i>
                </th>
                <th
                  className="text-muted"
                  style={{ backgroundColor: "#EBEFF4" }}
                >
                  PACKAGING <i className="fas fa-sort ms-1"></i>
                </th>
                <th
                  className="text-muted"
                  style={{ backgroundColor: "#EBEFF4" }}
                >
                  ORDERED QUANTITY <i className="fas fa-sort ms-1"></i>
                </th>
                <th
                  className="text-muted"
                  style={{ backgroundColor: "#EBEFF4" }}
                >
                  QUANTITY RECEIVED <i className="fas fa-sort ms-1"></i>
                </th>
                <th
                  className="text-muted"
                  style={{ backgroundColor: "#EBEFF4" }}
                >
                  TOTAL RECEIVED <i className="fas fa-sort ms-1"></i>
                </th>

                <th
                  className="text-muted"
                  style={{ backgroundColor: "#EBEFF4" }}
                >
                  EXPIRY DATE <i className="fas fa-sort ms-1"></i>
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
                      <i className="fas fa-database fs-4 mb-2 text-muted"></i>
                      <span>No data available</span>
                    </div>
                  </td>
                </tr>
              ) : (
                pagination.data.map((item) => {
                  const quantityReceived = receivedQuantities[item.id] || "";
                  const expiryDate = expiryDates[item.id] || "";

                  return (
                    <tr key={item.id}>
                      <td>{item.po_vendor_product_id?.product_code || "-"}</td>
                      <td>{item.po_vendor_product_id?.product_name || "-"}</td>
                      <td>
                        {item.po_vendor_product_id?.prod_packaging
                          ?.packaging_name || "-"}
                      </td>
                      <td>
                        {item.quantity !== undefined && item.quantity !== null
                          ? Number(item.quantity).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })
                          : "0.00"}
                      </td>

                      <td>
                        <input
                          type="text"
                          className={`form-control form-control-sm ${
                            validationErrors.quantities[item.id]
                              ? "is-invalid"
                              : ""
                          }`}
                          value={receivedQuantities[item.id] || ""}
                          onChange={(e) => {
                            let value = e.target.value;

                            // Keep only digits and dots
                            value = value.replace(/[^0-9.]/g, "");

                            // Prevent multiple dots
                            const parts = value.split(".");
                            if (parts.length > 2) {
                              value = parts[0] + "." + parts.slice(1).join("");
                            }

                            // Convert to number for comparison
                            const numericValue =
                              parseFloat(value.replace(/,/g, "")) || 0;
                            const orderedQty = parseFloat(item.quantity) || 0;

                            // Check if exceeds ordered quantity
                            if (numericValue > orderedQty) {
                              swal({
                                title: "Quantity Exceeded",
                                text: `Received quantity cannot exceed ordered quantity (${orderedQty}).`,
                                icon: "warning",
                              }).then(() => {
                                // Set to ordered quantity
                                const formatted =
                                  orderedQty.toLocaleString("en-US");
                                setReceivedQuantities((prev) => ({
                                  ...prev,
                                  [item.id]: formatted,
                                }));
                              });
                              return; // Exit early
                            }

                            // Format only the integer part with commas
                            let formattedValue = value;
                            if (parts.length > 1) {
                              const integerPart = parts[0].replace(
                                /^0+(?=\d)/,
                                ""
                              ); // remove leading zeros
                              const decimalPart = parts[1];
                              formattedValue = `${Number(
                                integerPart
                              ).toLocaleString("en-US")}.${decimalPart}`;
                            } else if (value) {
                              formattedValue =
                                Number(value).toLocaleString("en-US");
                            }

                            // Set state
                            setReceivedQuantities((prev) => ({
                              ...prev,
                              [item.id]: formattedValue,
                            }));

                            if (validationErrors.quantities[item.id]) {
                              setValidationErrors((prev) => ({
                                ...prev,
                                quantities: {
                                  ...prev.quantities,
                                  [item.id]: false,
                                },
                              }));
                            }
                          }}
                          onFocus={(e) => {
                            // Remove commas on focus for clean editing
                            const raw = e.target.value.replace(/,/g, "");
                            setReceivedQuantities((prev) => ({
                              ...prev,
                              [item.id]: raw,
                            }));
                          }}
                          onBlur={(e) => {
                            const raw = e.target.value.replace(/,/g, "");
                            const parts = raw.split(".");
                            if (!isNaN(parseFloat(raw))) {
                              const formatted =
                                parts.length > 1
                                  ? `${Number(parts[0]).toLocaleString(
                                      "en-US"
                                    )}.${parts[1]}`
                                  : Number(raw).toLocaleString("en-US");

                              setReceivedQuantities((prev) => ({
                                ...prev,
                                [item.id]: formatted,
                              }));
                            }
                          }}
                        />
                        {validationErrors.quantities[item.id] && (
                          <div className="invalid-feedback">
                            {/* Quantity received is required */}
                          </div>
                        )}
                      </td>

                      <td>
                        {item.total_received !== undefined &&
                        item.total_received !== null
                          ? Number(item.total_received).toLocaleString(
                              "en-US",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            )
                          : "0.00"}
                      </td>

                      <td>
                        <input
                          type="date"
                          className={`form-control form-control-sm ${
                            validationErrors.dates[item.id] ? "is-invalid" : ""
                          }`}
                          value={expiryDates[item.id] || ""}
                          onChange={(e) => {
                            setExpiryDates((prev) => ({
                              ...prev,
                              [item.id]: e.target.value,
                            }));
                            // Clear validation error when selecting
                            if (validationErrors.dates[item.id]) {
                              setValidationErrors((prev) => ({
                                ...prev,
                                dates: {
                                  ...prev.dates,
                                  [item.id]: false,
                                },
                              }));
                            }
                          }}
                        />
                        {validationErrors.dates[item.id] && (
                          <div className="invalid-feedback">
                            {/* Expiry date is required */}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls {...pagination} />

        <div className="row mt-5">
          <div className="col-sm"></div>
          <div className="col-sm"></div>
          <div className="col-sm"></div>
          <div className="col-sm"></div>
          <div className="col-sm"></div>
          <div className="col-sm"></div>
          <div className="col-sm d-flex flex-row gap-3">
            <a
              className="btn btn-outline-secondary w-100"
              style={{ padding: "0.7rem 1.7rem" }}
              href="/purchases/receiving"
            >
              Cancel
            </a>
            <button
              className="btn btn-primary w-100"
              style={{ padding: "0.7rem 1.7rem" }}
              onClick={handleSubmit}
            >
              Receive
            </button>
          </div>
        </div>
      </div>

      <Modal
        show={showConfirmationModal}
        onHide={() => setShowConfirmationModal(false)}
        backdrop="static"
      >
        <Modal.Header className="border-0" closeButton>
          <Modal.Title>Confirmation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Please confirm: All received items cleared quality check?</p>
          <div className="mt-3 d-none">
            <strong>Duty & Custom:</strong> {dutyCustom || "0.00"}
            <br />
            <strong>Shipping Fee:</strong> {shippingFee || "0.00"}
            <br />
            <strong>Total Items:</strong> {pagination.data.length}
          </div>
          <Modal.Footer className="p-0 border-0">
            <Button
              variant="outline-secondary"
              onClick={() => setShowConfirmationModal(false)}
            >
              No
            </Button>
            <Button variant="primary" onClick={handleConfirmSubmit}>
              Yes
            </Button>
          </Modal.Footer>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Receiving_update;
