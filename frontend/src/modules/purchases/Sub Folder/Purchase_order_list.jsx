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

import Logo from "../../../assets/img/logo.jpg";

const PurchaseOrderList = () => {
  const { id } = useParams();
  const userLoggedID = useDecodeToken();
  const navigate = useNavigate();

  //   fetch pr
  const [purchaseRequestData, setPurchaseRequestData] = useState([]);
  const fetchPR = async () => {
    try {
      const purchaseRequest = await axios.get(
        `${BASE_URL}/PurchaseOrder/prRequestList/${id}`
      );
      if (purchaseRequest.data?.data) {
        setPurchaseRequestData(purchaseRequest.data.data); // store the object directly
      }
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  //   fetch pr end

  //   fetch product table
  const [paginationUrl, setPaginationUrl] = useState(
    `${BASE_URL}/PurchaseOrder/getOrderListData/${id}`
  );
  const pagination = useServerPagination(paginationUrl, 10);

  const getStatusStyles = (status) => {
    switch (status) {
      case "In Progress":
        return { bg: "#FFF4F4", text: "#EE5B5B" };
      case "Partial Order":
        return { bg: "#E4F0FF", text: "#3D96FF" };
      case "Ordered":
        return { bg: "#E1FCE6", text: "#62D665" };
      default:
        return { bg: "#FFFFFF", text: "#000000" };
    }
  };
  //   fetch product table end

  // ### po card state and fetch
  const [purchaseOrderCards, setPurchaseOrderCards] = useState([]);
  const [loadingCards, setLoadingCards] = useState(false);

  // Fetch purchase order cards
  const handlePurchaseOrderCard = async () => {
    setLoadingCards(true);
    try {
      console.log(`Fetching PO cards for PR ID: ${id}`);
      const response = await axios.get(
        `${BASE_URL}/PurchaseOrder/getPurchaseOrderCards/${id}`
      );

      console.log("API Response:", response.data);

      if (response.data.success) {
        // Format dates before setting state
        const formattedCards = response.data.data.map((card) => ({
          ...card,
          po_date: card.po_date ? card.po_date.split("T")[0] : "",
          delivery_date: card.delivery_date
            ? card.delivery_date.split("T")[0]
            : "",
        }));

        setPurchaseOrderCards(formattedCards);
      } else {
        swal(
          "Error",
          response.data.message || "No purchase orders found for this PR",
          "info" // Changed to "info" since no POs might be a normal case
        );
      }
    } catch (error) {
      console.error("Error details:", {
        message: error.message,
        response: error.response,
      });
      swal(
        "Error",
        error.response?.data?.message || "Failed to fetch purchase order cards",
        "error"
      );
    } finally {
      setLoadingCards(false);
    }
  };
  // ### po card end

  useEffect(() => {
    fetchPR();
    handlePurchaseOrderCard();
  }, [id]);

  const reloadTable = () => {
    setPaginationUrl(
      `${BASE_URL}/PurchaseRequest/getOrderListData/${id}?t=${Date.now()}`
    );
    pagination.refreshData();
  };

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="w-100 p-2 d-flex flex-row justify-content-between">
        <div className="d-flex flex-column title-custom2">
          <span className="fs-3">
            <button
              onClick={() => navigate("/purchases/purchase-order")}
              className="text-dark border-0"
              style={{ background: "none" }}
            >
              <i className="bx bx-arrow-back"></i>
            </button>
            <span className="mx-2">PURCHASE ORDER DETAILS</span>
          </span>
        </div>
      </div>

      <div className="container-fluid mt-4">
        <div className="row mb-3">
          <div className="col-sm mb-3">
            <label htmlFor="pr_no">PR NO.</label>
            <input
              type="text"
              className="form-control"
              id="pr_no"
              name="pr_no"
              readOnly
              value={purchaseRequestData.pr_no || ""}
            />
          </div>
          <div className="col-sm">
            <label htmlFor="dateNeeded">Date Needed</label>
            <input
              type="date"
              className="form-control"
              id="dateNeeded"
              name="date_needed"
              readOnly
              value={purchaseRequestData.date_needed || ""}
            />
          </div>
        </div>
        <div className="row">
          <div className="col-sm mb-3">
            <label htmlFor="remarks">Remarks</label>
            <textarea
              name="remarks"
              id="remarks"
              cols="5"
              rows="5"
              className="form-control"
              readOnly
              value={purchaseRequestData.remarks || ""}
            />
          </div>
          <div className="col-sm">
            <div className="col-sm">
              <label htmlFor="preparedBy">Prepared By</label>
              <input
                type="text"
                className="form-control"
                id="preparedBy"
                name="preparedBy"
                readOnly
                value={purchaseRequestData?.prepared_by?.full_name || ""}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container-fluid mt-4">
        <div className="w-100 d-flex align-items-center">
          <span>Order Items</span>
          <hr className="flex-grow-1 mx-3" />
        </div>
        <div className="container-fluid mt-3">
          <div className="table-responsive data-table scrollable-contents">
            <table
              className="table table-hover table-responsive"
              id="purchaseOrderListTable"
            >
              <thead className="bg-light">
                <tr>
                  <th
                    className="text-muted"
                    style={{ backgroundColor: "#EBEFF4" }}
                  >
                    PRODUCT ID
                    <i className="fas fa-sort ms-1"></i>
                  </th>
                  <th
                    className="text-muted"
                    style={{ backgroundColor: "#EBEFF4" }}
                  >
                    PRODUCT NAME
                    <i className="fas fa-sort ms-1"></i>
                  </th>
                  <th
                    className="text-muted"
                    style={{ backgroundColor: "#EBEFF4" }}
                  >
                    QUANTITY
                    <i className="fas fa-sort ms-1"></i>
                  </th>
                  <th
                    className="text-muted"
                    style={{ backgroundColor: "#EBEFF4" }}
                  >
                    ORDERED QUANTITY
                    <i className="fas fa-sort ms-1"></i>
                  </th>
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
                    <td colSpan="6" className="text-center">
                      Loading...
                    </td>
                  </tr>
                ) : pagination.error ? (
                  <tr>
                    <td colSpan="6" className="text-center text-danger">
                      Error loading data
                    </td>
                  </tr>
                ) : pagination.data.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center">
                      No items found
                    </td>
                  </tr>
                ) : (
                  pagination.data.map((item, index) => (
                    <tr key={item.id}>
                      <td>{item.product_code}</td>
                      <td>{item.product_name}</td>
                      <td>
                        {item.quantity.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td>
                        {item.new_quantity.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td>{item.remarks}</td>
                      <td>
                        <span
                          className="py-2 px-3 rounded productStatus"
                          style={{
                            backgroundColor: getStatusStyles(item.status).bg,
                            color: getStatusStyles(item.status).text,
                          }}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <PaginationControls {...pagination} />
        </div>
      </div>

      <div className="container-fluid mt-5">
        <div className="w-100 d-flex align-items-center">
          <span>Purchase Order</span>
          <hr className="flex-grow-1 mx-3" />
        </div>

        {loadingCards ? (
          <div className="d-flex justify-content-center my-5">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <div className="w-100 row mt-3">
            {purchaseOrderCards.map((card, index) => (
              <div key={index} className="col-md-6 mb-4 position-relative">
                <div className="card h-100 border shadow-sm">
                  <div className="card-body p-0 pb-3">
                    <div className="card-title p-2 bg-secondary rounded-top text-white ">
                      <div>Purchase Order No: {card.po_number}</div>
                    </div>

                    <div className="px-4 w-100 row">
                      <div className="col-sm d-flex flex-column">
                        <span>
                          <strong>Vendor Name:</strong>
                          <span className="mx-2">{card.vendor_name}</span>
                        </span>
                        <span>
                          <strong>Vendor Address:</strong>
                          <span className="mx-2">{card.vendor_address}</span>
                        </span>
                        <span>
                          <strong>VAT:</strong>
                          <span className="mx-2">{card.vat_rate}%</span>
                        </span>
                        <span>
                          <strong>Withholding Tax:</strong>
                          <span className="mx-2">
                            {card.withholding_tax_rate}%
                          </span>
                        </span>
                      </div>

                      <div className="col-sm d-flex flex-column align-items-start">
                        <div className="d-flex flex-row mb-1">
                          <div className="mx-2">
                            <label htmlFor="">
                              <strong>PO Date</strong>
                            </label>
                            <input
                              type="date"
                              className="form-control form-control-sm"
                              value={card.po_date}
                              readOnly
                            />
                          </div>

                          <div>
                            <label htmlFor="">
                              <strong>Delivery Date</strong>
                            </label>
                            <input
                              type="date"
                              className="form-control form-control-sm"
                              value={card.delivery_date}
                              readOnly
                            />
                          </div>
                        </div>

                        <div className="mx-2">
                          <strong>Status:</strong>
                          <span
                            className={`mx-2 ${
                              card.status === "For-Approval"
                                ? "text-danger"
                                : "text-primary"
                            }`}
                          >
                            {card.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="w-100 d-flex align-items-center">
                      <hr className="flex-grow-1 mx-3" />
                    </div>

                    <div className="px-4 w-100 row mb-3">
                      <div className="col-sm">
                        <label htmlFor="shippingMethod">
                          <strong>Shipping Method</strong>
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={card.shipping_method}
                          readOnly
                        />
                      </div>
                      <div className="col-sm">
                        <label htmlFor="paymentTerm">
                          <strong>Payment Term</strong>
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={card.payment_term}
                          readOnly
                        />
                      </div>
                    </div>

                    <div className="px-3 w-100 table-responsive">
                      <table className="table">
                        <thead>
                          <tr className="table-secondary">
                            <th style={{ width: "20%" }}>Product Code</th>
                            <th style={{ width: "25%" }}>Product Name</th>
                            <th style={{ width: "10%" }}>Quantity</th>
                            <th style={{ width: "10%" }}>Price</th>
                            <th style={{ width: "25%" }}>Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {card.products?.map((product, productIndex) => (
                            <tr key={productIndex}>
                              <td>{product.product_code}</td>
                              <td>{product.product_name}</td>
                              <td>
                                {parseFloat(product.quantity).toLocaleString(
                                  undefined,
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }
                                )}
                              </td>
                              <td>
                                {parseFloat(product.price).toLocaleString(
                                  undefined,
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }
                                )}
                              </td>
                              <td>{product.remarks}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseOrderList;
