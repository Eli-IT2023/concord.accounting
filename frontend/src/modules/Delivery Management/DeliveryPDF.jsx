import { React, useState, useEffect } from "react";
import { Form } from "react-bootstrap";
import axios from "axios";
import swal from "sweetalert";
import { Modal, Button, OverlayTrigger, Tooltip } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { PaginationControls } from "../../hooks/customHook/paginationHook/usePagination"; // Import our custom hook and component
import { useServerPagination } from "../../hooks/customHook/paginationHook/useServerPagination"; // Import our custom hook and component

import BASE_URL from "../../assets/global/url";
import useDecodeToken from "../../hooks/customHook/useDecodeToken";

import "../../assets/css/lionchem.css";

import DeliveryConfirmation from "./Sub Folder/DeliveryConfirmation"; // Import the view component
import DeliveryReceipt from "./Sub Folder/DeliveryReceipt";
import SalesInvoice from "./Sub Folder/SalesInvoice";

const DeliveryPDF = () => {
  // ### resets ###
  const navigate = useNavigate();
  const userLoggedID = useDecodeToken();
  // ### reset ends ###

  // ##### table #####
  const [paginationUrl, setPaginationUrl] = useState(
    BASE_URL + "/PurchaseOrder/fetchData"
  );
  const pagination = useServerPagination(paginationUrl, 10);
  // ##### table end #####

  // ### Filter ###
  const [searchText, setSearchText] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");

  const [filterVendor, setFilterVendor] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState("");

  const clearDataInputs = () => {
    setFilterVendor("All");
    setFilterStatus("All");
    setFilterPaymentStatus("All");
    setSearchText("");
  };

  const handleFilter = () => {
    setPaginationUrl(BASE_URL + "/PurchaseOrder/fetchFilteredData");
    pagination.updateParams({
      filterVendor,
      filterStatus,
      filterPaymentStatus,
    }); // method use to pass to the router
  };

  const handleClearFilter = () => {
    setPaginationUrl(BASE_URL + "/PurchaseOrder/fetchData");
    pagination.updateParams({});
    clearDataInputs();
  };

  const handleSearch = (value) => {
    setSearchText(value);
    if (value === "") {
      setPaginationUrl(BASE_URL + "/PurchaseOrder/fetchData");
      pagination.updateParams({});
    } else {
      setPaginationUrl(BASE_URL + "/PurchaseOrder/fetchSearchData");
      pagination.updateParams({
        searchText: value,
        filterColumn: filterColumn || "all", // Ensure default value
        filterStatus: filterStatus || "All", // Ensure default value
      });
    }
  };

  // ### Filter end ###

  // ### pdf modal view
  const [selectedPO, setSelectedPO] = useState(null);
  const [showPOModal, setShowPOModal] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [receipt, setReceipt] = useState("");
  const handleShowModal = (data, receipt) => {
    setSelectedPO(data);
    setReceipt(receipt);
    setShowPOModal(true);
  };

  const handleCloseModal = () => {
    setShowPOModal(false);
    setSelectedPO(null);
    setReceipt("");
  };

  const handlePrint = () => {
    // setIsPrinting(true);

    window.print();

    return;
    const poId = selectedPO?.id;

    // Open in new tab with the PDF route
    window.open(
      `/purchase-order-pdf?po_id=${poId}`,
      "_blank" // This makes it open in new tab
    );

    setIsPrinting(false);
  };

  //   ### pdf modal view end

  // ### approve and reject modals
  // approve
  const [approveModal, setApproveModal] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const showApproveModal = () => {
    setApproveModal(true);
    setShowPOModal(false);
    // setSelectedPO(null);
  };

  const handleApprove = async (e) => {
    e.preventDefault();
    setIsApproving(true);

    try {
      const response = await axios.put(
        `${BASE_URL}/PurchaseOrder/approvePO/${selectedPO?.id}`,
        { userLoggedID }
      );

      if (response.data.success) {
        swal({
          title: "Approved!",
          text: response.data.message,
          icon: "success",
          buttons: false,
          timer: 2000,
        }).then(() => {
          handleClose(); // Close the modal
          handleClearFilter();
          fetchForReceivingCount();
          fetchTotalPayable();
        });
      } else {
        throw new Error(response.data.message || "Failed to approve PO");
      }
    } catch (error) {
      console.error("Approval error:", error);
      swal(
        "Error",
        error.message || "Failed to approve Purchase Order",
        "error"
      );
    } finally {
      setIsApproving(false);
    }
  };

  // reject
  const [rejectModal, setRejectModal] = useState(false);

  const showRejectModal = () => {
    setRejectModal(true);
    setShowPOModal(false);
    // setSelectedPO(null);
  };

  const handleReject = async (e) => {
    e.preventDefault();
    setIsApproving(true);

    try {
      const response = await axios.put(
        `${BASE_URL}/PurchaseOrder/rejectPO/${selectedPO?.id}`
      );

      if (response.data.success) {
        swal({
          title: "Declined!",
          text: response.data.message,
          icon: "success",
          buttons: false,
          timer: 2000,
        }).then(() => {
          handleClose(); // Close the modal
          handleClearFilter();
        });
      } else {
        throw new Error(response.data.message || "Failed to decline PO");
      }
    } catch (error) {
      console.error("Decline error:", error);
      swal(
        "Error",
        error.message || "Failed to decline Purchase Order",
        "error"
      );
    } finally {
      setIsApproving(false);
    }
  };

  const handleClose = () => {
    setApproveModal(false);
    setRejectModal(false);
  };

  // get vendor
  const [vendorData, setVendorData] = useState([]);
  const fetchVendor = () => {
    axios
      .get(BASE_URL + "/PurchaseOrder/getVendor")
      .then((res) => {
        // Access the data property from response
        if (res.data.success && res.data.data) {
          setVendorData(res.data.data);
        }
      })
      .catch((error) => {
        console.error("Error fetching vendors:", error);
      });
  };

  // ### approve and reject modals end

  // ### dashboard widgets
  const [forReceivingCount, setForReceivingCount] = useState(0);
  const fetchForReceivingCount = () => {
    axios
      .get(`${BASE_URL}/PurchaseOrder/forReceivingCount`)
      .then((res) => {
        if (res.data.success) {
          setForReceivingCount(res.data.data);
        }
      })
      .catch((error) => {
        console.error("Error fetching receiving count:", error);
      });
  };

  const [totalPayable, setTotalPayable] = useState(0);
  const fetchTotalPayable = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/PurchaseOrder/totalPayable`
      );
      if (response.data.success) {
        setTotalPayable(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching total payable:", error);
      // Optionally show error to user
    }
  };

  // ### dashboard widgets end
  useEffect(() => {
    fetchVendor();
    fetchForReceivingCount();
    fetchTotalPayable();
  }, []);
  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="w-100 p-2 d-flex flex-row justify-content-between">
        <div className="d-flex flex-column title-custom">
          <span className="fs-3">PURCHASE ORDER</span>
          {/* <span>PRODUCT LIST PACKAGING TYPES</span> */}
        </div>

        <div></div>
      </div>

      <div className="container-fluid mt-3">
        <div className="row poOverviewCards">
          <div className="col-sm mb-3">
            <div className="border shadow-sm rounded h-100 p-3">
              <h5>
                <i className="fa-solid fa-signal"></i>
                <span className="mx-2">For-Receiving</span>
              </h5>
              <div className="d-flex flex-row align-items-center justify-content-center">
                <p style={{ color: "#6FAB23" }}>{forReceivingCount}</p>
              </div>
            </div>
          </div>
          <div className="col-sm mb-3">
            <div className="border shadow-sm rounded h-100 p-3">
              <h5>
                <i className="fa-regular fa-calendar-check"></i>
                <span className="mx-2">Paid this month</span>
              </h5>
              <div className="d-flex flex-row align-items-center justify-content-center">
                <p style={{ color: "#4A88C7" }}>₱ 42,000</p>
              </div>
            </div>
          </div>
          <div className="col-sm mb-3">
            <div className="border shadow-sm rounded h-100 p-3">
              <h5>
                <i className="fa-solid fa-money-check"></i>
                <span className="mx-2">Total Payable</span>
              </h5>
              <div className="d-flex flex-row align-items-center justify-content-center">
                <p style={{ color: "#6FAB23" }}>
                  ₱{" "}
                  {Number(totalPayable).toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container-fluid ">
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
                    {[vendor.fname, vendor.lname].filter(Boolean).join(" ") ||
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
              <option value="For-Approval">For-Approval</option>
              <option value="Approved">Approved</option>
              <option value="Declined">Declined</option>
            </select>
          </div>
          <div className="col-sm mb-3">
            <label htmlFor="dateNeeded">Payment Status</label>
            <select
              name=""
              id="status"
              className="form-select"
              value={filterPaymentStatus}
              onChange={(e) => setFilterPaymentStatus(e.target.value)}
            >
              <option value="" selected>
                Select Payment Status
              </option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
            </select>
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
                <li>
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
                <li>
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

      <div className="container-fluid" style={{ overflowX: "auto" }}>
        <div className="table-responsive data-table scrollable-contents">
          <table
            className="w-100 table table-hover table-responsive"
            id="poTable"
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
                  VENDOR
                  <i className="fas fa-sort ms-1"></i>
                </th>
                <th
                  className="text-muted"
                  style={{ backgroundColor: "#EBEFF4" }}
                >
                  PR NO.
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
                  DATE NEEDED
                  <i className="fas fa-sort ms-1"></i>
                </th>
                <th
                  className="text-muted"
                  style={{ backgroundColor: "#EBEFF4" }}
                >
                  NET PAYABLE
                  <i className="fas fa-sort ms-1"></i>
                </th>
                <th
                  className="text-muted"
                  style={{ backgroundColor: "#EBEFF4" }}
                >
                  PAYMENT STATUS
                  <i className="fas fa-sort ms-1"></i>
                </th>
                <th
                  className="text-muted"
                  style={{ backgroundColor: "#EBEFF4" }}
                >
                  STATUS
                  <i className="fas fa-sort ms-1"></i>
                </th>
                <th
                  className="text-muted"
                  style={{ backgroundColor: "#EBEFF4" }}
                >
                  ACTION
                  <i className="fas fa-sort ms-1"></i>
                </th>
              </tr>
            </thead>
            <tbody>
              {pagination.loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-4">
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
                  <td colSpan="9" className="text-center text-danger py-4">
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
                  <td colSpan="9" className="text-center py-4">
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
                    ? new Date(item.po_pr_id.date_needed).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "short",
                          day: "2-digit",
                        }
                      )
                    : "N/A";

                  return (
                    <tr key={index}>
                      <td>{item.po_number}</td>
                      <td>{vendorName}</td>
                      <td>{item.po_pr_id?.pr_no || "N/A"}</td>
                      <td>{requestorName}</td>
                      <td>{formattedDate}</td>
                      <td>
                        {parseFloat(item.total_amount).toLocaleString(
                          undefined,
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}
                      </td>
                      <td>
                        <span
                          className="poPaymentStatus"
                          style={{
                            backgroundColor:
                              item.payment_status === "Unpaid"
                                ? "#FCE1E1"
                                : "#E1FCE6",
                            color:
                              item.payment_status === "Unpaid"
                                ? "#C01C1C"
                                : "#00B800",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontWeight: "500",
                            display: "inline-block",
                            minWidth: "70px",
                            textAlign: "center",
                          }}
                        >
                          {item.payment_status || "N/A"}
                        </span>
                      </td>
                      <td>
                        <span
                          className="py-2 px-3 rounded w-100"
                          style={{
                            backgroundColor:
                              item.status === "Declined"
                                ? "#FFF4F4"
                                : "#E4F0FF",
                            color:
                              item.status === "Declined"
                                ? "#EE5B5B"
                                : "#3D96FF",
                          }}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex flex-row">
                          <i
                            className="fa-regular fa-file-lines fs-4 mx-2"
                            style={{ cursor: "pointer", color: "#4A88C7" }}
                            onClick={() =>
                              handleShowModal(item, "delivery confirmation")
                            }
                          ></i>
                          <i
                            className="fa-regular fa-file-lines fs-4 mx-2"
                            style={{ cursor: "pointer", color: "#4A88C7" }}
                            onClick={() =>
                              handleShowModal(item, "delivery receipt")
                            }
                          ></i>
                          <i
                            className="fa-regular fa-file-lines fs-4 mx-2"
                            style={{ cursor: "pointer", color: "#4A88C7" }}
                            onClick={() =>
                              handleShowModal(item, "sales invoice")
                            }
                          ></i>
                          <i
                            className="fa-solid fa-eye fs-4 mx-3"
                            style={{ cursor: "pointer" }}
                            onClick={() =>
                              navigate(
                                `/purchases/view-purchase-request/${item.pr_id}`
                              )
                            }
                          ></i>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {/* Only show pagination controls when there's data */}
        {!pagination.loading &&
          !pagination.error &&
          pagination.data.length > 0 && <PaginationControls {...pagination} />}
      </div>

      {/* pdf view */}
      <div className="pdf-modal-container">
        <Modal
          backdrop="static"
          show={showPOModal}
          onHide={handleCloseModal}
          dialogClassName="pdf-custom-modal-width"
          size="lg" // Consider making it larger
        >
          <Modal.Header
            className="p-0 text-white p-2 px-3 white-close-btn border-0"
            style={{
              background: "#595959",
              height: "60px",
            }}
            closeButton
          >
            <Modal.Title>PREVIEW {receipt?.toUpperCase()}</Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ background: "#AEAEAE" }} className="p-4">
            {selectedPO &&
              // Show receipt base on what button was pressed
              (receipt === "delivery confirmation" ? (
                <DeliveryConfirmation
                  poData={selectedPO}
                  prData={selectedPO.po_pr_id}
                />
              ) : receipt === "delivery receipt" ? (
                <DeliveryReceipt
                  poData={selectedPO}
                  prData={selectedPO.po_pr_id}
                />
              ) : receipt === "sales invoice" ? (
                <SalesInvoice
                  poData={selectedPO}
                  prData={selectedPO.po_pr_id}
                />
              ) : null)}
          </Modal.Body>
          <Modal.Footer
            className="p-0 p-2 border-0"
            style={{ background: "#595959", height: "60px" }}
          >
            {selectedPO?.status === "Approved" && (
              <Button
                variant="danger"
                type="submit"
                onClick={handlePrint}
                disabled={isPrinting}
              >
                {isPrinting ? "Generating..." : "Download PDF"}
              </Button>
            )}

            {selectedPO?.status === "For-Approval" && (
              <>
                <Button
                  className="bg-white border-danger text-danger"
                  variant="outline-danger"
                  onClick={() => {
                    showRejectModal();
                  }}
                >
                  Decline
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    showApproveModal();
                  }}
                >
                  Approve
                </Button>
              </>
            )}

            {/* If Rejected or any other status, show nothing */}
          </Modal.Footer>
        </Modal>
      </div>

      {/* approve modal */}
      <Modal show={approveModal} onHide={handleClose} backdrop="static">
        <Modal.Header className="border-0" closeButton>
          <Modal.Title>Confirmation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleApprove}>
            <h6 className="mb-3">
              Are you sure you want to approve purchase order
            </h6>

            <Modal.Footer className="p-0 border-0">
              <Button
                variant="outline-secondary"
                type="button"
                onClick={handleClose}
                disabled={isApproving}
              >
                No
              </Button>

              <Button variant="primary" type="submit" disabled={isApproving}>
                {isApproving ? "Approving..." : "Yes"}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal.Body>
      </Modal>

      {/* reject modal */}
      <Modal show={rejectModal} onHide={handleClose} backdrop="static">
        <Modal.Header className="border-0" closeButton>
          <Modal.Title>Confirmation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleReject}>
            <h6 className="mb-3">
              Are you sure you want to decline purchase order
            </h6>

            <Modal.Footer className="p-0 border-0">
              <Button
                variant="outline-secondary"
                type="button"
                onClick={handleClose}
                disabled={isApproving}
              >
                No
              </Button>

              <Button variant="primary" type="submit" disabled={isApproving}>
                {isApproving ? "Approving..." : "Yes"}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default DeliveryPDF;
