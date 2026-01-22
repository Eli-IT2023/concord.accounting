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
import { useSort } from "../../../hooks/customHook/tableSort"; // adjust path accordingly

import "../../../assets/css/lionchem.css";
const SampleProductView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const userLoggedID = useDecodeToken();

  // State management
  const [sampleProductData, setSampleProductData] = useState({});
  const [statusMoveModal, setStatusMoveModal] = useState(false);
  const [isStatusChanging, setIsStatusChanging] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [actionType, setActionType] = useState("");
  const [isLoading, setIsLoading] = useState(true); // Loading state
  const [products, setProducts] = useState([]); // State for product list

  // Status configuration
  const statusConfig = {
    "For-Approval": {
      buttons: [
        { type: "decline", label: "Decline", variant: "outline-danger" },
        { type: "approve", label: "Approve", variant: "primary" },
      ],
    },
    Approved: {
      buttons: [
        { type: "decline", label: "Decline", variant: "outline-danger" },
        { type: "prepare", label: "Prepare", variant: "primary" },
      ],
    },
    "In-Preparation": {
      buttons: [{ type: "dispatch", label: "Dispatch", variant: "primary" }],
    },
    Dispatched: {
      buttons: [{ type: "receive", label: "Receive", variant: "primary" }],
    },
    Declined: {
      buttons: [],
    },
  };

  // Status transition mapping
  const statusTransition = {
    approve: "Approved",
    decline: "Declined",
    prepare: "In-Preparation",
    dispatch: "Dispatched",
    receive: "Received",
  };

  // Fetch sample product data
  const fetchSampleProduct = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/SampleProduct/fetchSampleProduct/${id}`
      );
      if (response.data) {
        setSampleProductData(response.data);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      swal("Error", "Failed to fetch sample product", "error");
    }
  };

  useEffect(() => {
    if (id) {
      fetchSampleProduct();
    }
  }, [id]);

  // Handle status change
  const handleStatusChange = async (e) => {
    e.preventDefault();
    setIsStatusChanging(true);

    try {
      const newStatus = statusTransition[actionType];
      const updateData = {
        id,
        status: newStatus,
        remarks,
        userId: userLoggedID, // Assuming you have this from your token
      };

      // Add specific remark field based on action
      const remarkField = `${actionType}Remarks`;
      updateData[remarkField] = remarks;

      const response = await axios.put(
        `${BASE_URL}/SampleProduct/updateStatus`,
        updateData
      );

      if (response.data.success) {
        setStatusMoveModal(false);
        swal({
          title: "Success!",
          text: `Status changed to ${newStatus}`,
          icon: "success",
          button: false,
          timer: 2500,
        }).then(() => {
          window.location.href = "/sales/sample-product";
        });

        // fetchSampleProduct(); // Refresh data
        // setStatusMoveModal(false);
        // setRemarks("");
      } else {
        throw new Error(response.data.message || "Failed to update status");
      }
    } catch (error) {
      console.error("Status change error:", error);
      swal("Error", error.message, "error");
    } finally {
      setIsStatusChanging(false);
    }
  };

  // Open modal with specific action
  const openActionModal = (action) => {
    setActionType(action);
    setStatusMoveModal(true);
  };

  // Get current status buttons
  const getStatusButtons = () => {
    const currentStatus = sampleProductData.status;
    const config = statusConfig[currentStatus] || { buttons: [] };

    return config.buttons.map((button, index) => (
      <Button
        key={index}
        variant={button.variant}
        className="mx-2"
        style={{ padding: "0.7rem 1.7rem" }}
        onClick={() => openActionModal(button.type)}
      >
        {button.label}
      </Button>
    ));
  };

  // Get modal title based on action
  const getModalTitle = () => {
    const actionLabels = {
      approve: "Approve",
      decline: "Decline",
      prepare: "Prepare",
      dispatch: "Dispatch",
      receive: "Receive",
    };
    return `Are you sure you want to ${actionLabels[actionType]}?`;
  };

  // Get remarks label based on action
  const getRemarksLabel = () => {
    const remarkLabels = {
      approve: "Approval Remarks",
      decline: "Decline Remarks",
      prepare: "Preparation Remarks",
      dispatch: "Dispatch Remarks",
      receive: "Receive Remarks",
    };
    return remarkLabels[actionType] || "Remarks";
  };

  const status = sampleProductData.status;

  const remarksLabelMap = {
    "For-Approval": "Request Remarks",
    Approved: "Approved Remarks",
    "In-Preparation": "In-Preparation Remarks",
    Dispatched: "Dispatched Remarks",
    Received: "Received Remarks",
    Declined: "Declined Remarks",
  };

  const createdAtLabelMap = {
    "For-Approval": "Request Action Taken",
    Approved: "Approved Action Taken",
    "In-Preparation": "In-Preparation Action Taken",
    Dispatched: "Dispatched Action Taken",
    Received: "Received Action Taken",
    Declined: "Declined Action Taken",
  };

  const remarksValueMap = {
    "For-Approval": sampleProductData?.requestedRemarks,
    Approved: sampleProductData?.approvedRemarks,
    "In-Preparation": sampleProductData?.preparedRemarks,
    Dispatched: sampleProductData?.dispatchedRemarks,
    Received: sampleProductData?.receivedRemarks,
    Declined: sampleProductData?.rejectedRemarks,
  };

  const createdAtValueMap = {
    "For-Approval": sampleProductData?.requestedAt,
    Approved: sampleProductData?.approvedAt,
    "In-Preparation": sampleProductData?.preparedAt,
    Dispatched: sampleProductData?.dispatchedAt,
    Received: sampleProductData?.receivedAt,
    Declined: sampleProductData?.rejectedAt,
  };

  // get the product
  // Fetch products on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/SampleProduct/fetchProductListData/${id}`
        );
        setProducts(response.data.data || []);
      } catch (error) {
        console.error("Error fetching products:", error);
        swal("Error", "Failed to fetch products", "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [id]);

  const formatDateTime = (dateString) => {
    if (!dateString) return "---";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short", // Jan
      day: "2-digit", // 01
      year: "numeric", // 2025
      hour: "2-digit", // 01
      minute: "2-digit", // 20
      hour12: true, // PM
    });
  };

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="w-100 p-2 d-flex flex-row justify-content-between">
        <div className="d-flex flex-column title-custom2">
          <span className="fs-3">
            <button
              onClick={() => navigate("/sales/sample-product")}
              className="text-dark border-0"
              style={{ background: "none" }}
            >
              <i className="bx bx-arrow-back"></i>
            </button>
            <span className="mx-2">VIEW SAMPLE PRODUCTS</span>
          </span>
          {/* <span>PRODUCT LIST SAMPLE PRODUCTS</span> */}
        </div>
      </div>

      <div className="container-fluid mt-4">
        <div className="row w-100 mt-3">
          <div className="col-sm">
            <label htmlFor="actionTaken">Customer</label>
            <input
              type="text"
              name=""
              id="actionTaken"
              className="form-control"
              value={sampleProductData.sp_customer_id?.company_name || "N/A"}
              readOnly
            />
          </div>
          <div className="col-sm">
            <label htmlFor="action_taken">
              {createdAtLabelMap[status] || "Date"}
            </label>
            <input
              type="text"
              id="action_taken"
              className="form-control"
              value={formatDateTime(createdAtValueMap[status])}
              readOnly
            />
          </div>
        </div>
        <div className="row w-100 mt-3">
          <div className="col-sm">
            <label htmlFor="remarks">Remarks</label>
            <textarea
              name=""
              id="remarks"
              cols="5"
              rows="5"
              className="form-control"
              value={sampleProductData?.remarks || "---"}
              readOnly
            ></textarea>
          </div>
          <div className="col-sm">
            <label htmlFor="statusRemarks">
              {remarksLabelMap[status] || "Remarks"}
            </label>
            <textarea
              id="statusRemarks"
              cols="5"
              rows="5"
              className="form-control"
              readOnly
              value={remarksValueMap[status] || "---"}
            />
          </div>
        </div>

        <div className="row w-100 mt-5 p-2">
          <table
            className="table-responsive table table-bordered table-hover"
            id="sampleProductCreateTable"
          >
            <thead className="table-light">
              <tr>
                <th className="p-2">PRODUCT CODE</th>
                <th className="p-2">PRODUCT NAME</th>
                <th className="p-2">UOM</th>
                <th className="p-2">STOCK</th>
                <th className="p-2">QUANTITY</th>
                <th className="p-2">PRODUCT REMARKS</th>
              </tr>
            </thead>
            {isLoading ? (
              <tbody>
                <tr>
                  <td colSpan="6" className="text-center">
                    Loading...
                  </td>
                </tr>
              </tbody>
            ) : products.length > 0 ? (
              <tbody>
                {products.map((item, index) => {
                  const product = item.spl_product_id || {};
                  const packaging = product.prod_packaging || {};

                  return (
                    <tr key={index}>
                      <td className="p-2">{product.product_code || "---"}</td>
                      <td className="p-2">{product.product_name || "---"}</td>
                      <td className="p-2">
                        {packaging.packaging_name || "---"}
                      </td>
                      <td className="p-2">
                        {(item.remaining_quantity || 0).toLocaleString(
                          undefined
                        )}
                      </td>
                      <td className="p-2">
                        {(item.release_quantity || 0).toLocaleString(undefined)}
                      </td>

                      <td className="p-2">{item.remarks || "---"}</td>
                    </tr>
                  );
                })}
              </tbody>
            ) : (
              <tbody>
                <tr>
                  <td colSpan="6" className="text-center">
                    No products found
                  </td>
                </tr>
              </tbody>
            )}
          </table>
        </div>
      </div>

      {/* Status action buttons */}
      <div className="container-fluid mt-5 d-flex flex-row align-items-center justify-content-end">
        {getStatusButtons()}
      </div>

      {/* status change modal modal */}
      {/* Status change modal */}
      <Modal
        show={statusMoveModal}
        onHide={() => setStatusMoveModal(false)}
        backdrop="static"
      >
        <Modal.Header className="border-0" closeButton>
          <Modal.Title>Confirmation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleStatusChange}>
            <h6 className="mb-3">{getModalTitle()}</h6>

            <Form.Group className="mb-3">
              <Form.Label>{getRemarksLabel()}</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </Form.Group>

            <Modal.Footer className="p-0 border-0 mt-2">
              <Button
                variant="outline-secondary"
                type="button"
                onClick={() => setStatusMoveModal(false)}
                disabled={isStatusChanging}
              >
                No
              </Button>

              <Button
                variant="primary"
                type="submit"
                disabled={isStatusChanging}
              >
                {isStatusChanging ? "Processing..." : "Yes"}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default SampleProductView;
