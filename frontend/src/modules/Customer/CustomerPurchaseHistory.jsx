import { React, useState, useEffect } from "react";
import { Form } from "react-bootstrap";
import axios from "axios";
import swal from "sweetalert";
import { Modal, Button, OverlayTrigger, Tooltip } from "react-bootstrap";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PaginationControls } from "../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../hooks/customHook/paginationHook/useServerPagination";
import { useSort } from "../../hooks/customHook/tableSort";
import maskCurrency from "../../utils/maskCurrency";
import dateTimeFormat from "../../utils/dateTimeFormat";
import DatePicker from "react-datepicker";
import CustomDatePickerInput from "../../utils/CustomerDateInput";
import "../../assets/css/style.css";

import BASE_URL from "../../assets/global/url";
import useDecodeToken from "../../hooks/customHook/useDecodeToken";

import "../../assets/css/lionchem.css";

const CustomerPurchaseHistory = ({ authrztn, roleType }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [customerData, setCustomerData] = useState({});
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [enableEdit, setEnableEdit] = useState(false);
  const [isRowForApproval, setIsRowForApproval] = useState(false);

  // Filters state
  const [filterStatus, setFilterStatus] = useState("");
  const [searchText, setSearchText] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");

  const [formData, setFormData] = useState({
    id: "",
    scheduleId: "",
    requestor: "",
    batchNo: "",
    approvedBy: "",
    totalQuantity: "",
    dateRequested: "",
    deliveryDate: "",
    status: "",
  });

  // Pagination and sorting
  const [paginationUrl, setPaginationUrl] = useState(
    `${BASE_URL}/customerHistory/getCustomerHistory?customerId=${id}`
  );
  const { sortColumn, isSortedAsc, toggleSort } = useSort(
    "createdAt",
    false,
    paginationUrl
  );

  const pagination = useServerPagination(paginationUrl, 10);

  // Make sure your pagination hook is receiving and using these params correctly:
  // page, limit, customerId, etc.

  const handleSortData = (column) => {
    toggleSort(column, (params) => {
      setPaginationUrl(params.url);
      pagination.updateParams({
        sortType: params.sortType,
        sortDBTableColumn: params.sortDBTableColumn,
      });
    });
  };

  const fetchCustomer = async () => {
    try {
      const customer = await axios.get(
        `${BASE_URL}/customer/getCustomerDetails`,
        {
          params: { customerId: id },
        }
      );
      if (customer.data) {
        setCustomerData(customer.data);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      swal("Error", "Failed to fetch customer details", "error");
    }
  };

  const handleFilter = () => {
    setPaginationUrl(
      `${BASE_URL}/customerHistory/getFilteredCustomerHistory?customerId=${id}`
    );
    pagination.updateParams({
      filterStatus: filterStatus || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
    });
  };

  const handleClearFilter = () => {
    setFilterStatus("");
    setFromDate("");
    setToDate("");
    setSearchText("");
    setFilterColumn("all");
    setPaginationUrl(
      `${BASE_URL}/customerHistory/getCustomerHistory?customerId=${id}`
    );
    pagination.updateParams({});
  };

  const handleSearch = (value) => {
    setSearchText(value);
    if (value === "") {
      setPaginationUrl(
        `${BASE_URL}/customerHistory/getCustomerHistory?customerId=${id}`
      );
      pagination.updateParams({});
    } else {
      setPaginationUrl(
        `${BASE_URL}/customerHistory/getCustomerHistoryBySearch?customerId=${id}`
      );
      pagination.updateParams({
        searchText: value,
        filterColumn, // This is already being passed
      });
    }
  };

  const handleShow = (data, isRowForApproval) => {
    if (data !== null) {
      setFormData({
        id: data.id,
        scheduleId: data.scheduleId,
        requestor: data.requestor,
        batchNo: data.batchNo,
        approvedBy: data.approvedBy,
        totalQuantity: data.totalQuantity,
        dateRequested: data.dateRequested,
        deliveryDate: data.deliveryDate,
        status: data.status,
      });
    }
    setShowModal(true);
    setEnableEdit(false);
    setIsRowForApproval(isRowForApproval);
  };

  const handleClose = () => {
    setShowModal(false);
    setEnableEdit(false);
    setIsRowForApproval(false);
    setFormData({
      id: "",
      scheduleId: "",
      requestor: "",
      batchNo: "",
      approvedBy: "",
      totalQuantity: "",
      dateRequested: "",
      deliveryDate: "",
      status: "",
    });
  };

  const handleEdit = () => {
    setEnableEdit(true);
  };

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="w-100 p-2 d-flex flex-row justify-content-between align-items-center mb-2">
        <div className="d-flex flex-column">
          <span className="fs-3">
            <button
              onClick={() => navigate("/sales/customers")}
              className="text-dark border-0"
              style={{ background: "none" }}
            >
              <i className="bx bx-arrow-back"></i>
            </button>
            <span className="mx-2">
              PURCHASE HISTORY OF{" "}
              <span className="text-decoration-underline fw-bold">
                {customerData?.company_name || ""}
              </span>
            </span>
          </span>
        </div>
      </div>
      <div className="container-fluid ">
        <div className="row p-2 mx-auto">
          <div className="col-sm w-100 p-3 payable-card">
            <div className="w-100 border p-3 shadow-sm rounded h-100">
              <div className=" d-flex flex-row align-items-center payable-icon">
                <i className="bx bx-bar-chart-alt fs-3 h-100"></i>
                <h3 style={{ fontSize: "1.3rem" }}>Total Quantity</h3>
              </div>
              <div className=" mt-3 d-flex flex-column text-nowrap payable-card-desc">
                <p
                  className="payable-amount text-primary"
                  style={{ fontSize: "2rem", fontWeight: "bold" }}
                >
                  {roleType?.includes("Management") ? (
                    ` ${parseFloat(0).toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  ) : (
                    <span
                      className="masked-value"
                      style={{ fontSize: "2rem", fontWeight: "bold" }}
                    >
                      {maskCurrency(100)}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
          <div className="col-sm w-100 p-3 payable-card">
            <div className="w-100 border p-3 shadow-sm rounded h-100">
              <div className=" d-flex flex-row align-items-center payable-icon">
                <i className="bx bxs-discount fs-3 h-100"></i>
                <h3 style={{ fontSize: "1.3rem" }}>Total Discount</h3>
              </div>
              <div className=" mt-3 d-flex flex-column text-nowrap payable-card-desc">
                <p
                  className="payable-amount text-warning"
                  style={{ fontSize: "2rem", fontWeight: "bold" }}
                >
                  {" "}
                  {roleType?.includes("Management") ? (
                    ` ${parseFloat(0).toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  ) : (
                    <span
                      className="masked-value"
                      style={{ fontSize: "2rem", fontWeight: "bold" }}
                    >
                      {maskCurrency(100)}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
          <div className="col-sm w-100 p-3 payable-card">
            <div className="w-100 border p-3 shadow-sm rounded h-100">
              <div className=" d-flex flex-row align-items-center payable-icon">
                <i className="bx bx-bar-chart-alt fs-3 h-100"></i>
                <h3 style={{ fontSize: "1.3rem" }}>Total Amount</h3>
              </div>
              <div className=" mt-3 d-flex flex-column text-nowrap payable-card-desc">
                <p
                  className="payable-amount text-success"
                  style={{ fontSize: "2rem", fontWeight: "bold" }}
                >
                  {" "}
                  {roleType?.includes("Management") ? (
                    ` ${parseFloat(0).toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  ) : (
                    <span
                      className="masked-value"
                      style={{ fontSize: "2rem", fontWeight: "bold" }}
                    >
                      {maskCurrency(100)}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="row align-items-end">
          <div className="col-sm mb-3">
            <label htmlFor="status" className="form-label">
              Status
            </label>
            <select
              name="status"
              id="status"
              className="form-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="" disabled>
                Select Payment
              </option>
              <option value="CASH">Cash</option>
              <option value="ONLINE">Online</option>
            </select>
          </div>
          <div className="col-sm mb-3">
            <label htmlFor="from-date" className="form-label">
              From
            </label>
            {/* <input
              type="date"
              name="from-date"
              id="from-date"
              className="form-control"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            /> */}
            <DatePicker
              selected={fromDate}
              onChange={(date) => setFromDate(date)}
              dateFormat="MMM dd, yyyy"
              placeholderText="Select date"
              customInput={<CustomDatePickerInput />}
              name="from-date"
              id="from-date"
              showYearDropdown
              showMonthDropdown
              dropdownMode="select"
              popperPlacement="bottom"
              popperProps={{
                positionFixed: true,
              }}
            />
          </div>
          <div className="col-sm mb-3">
            <label htmlFor="to-date" className="form-label">
              To
            </label>
            {/* <input
              type="date"
              name="to-date"
              id="to-date"
              className="form-control"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              min={fromDate}
            /> */}
            <DatePicker
              selected={toDate}
              min={fromDate}
              onChange={(date) => setToDate(date)}
              dateFormat="MMM dd, yyyy"
              placeholderText="Select date"
              customInput={<CustomDatePickerInput />}
              name="from-date"
              id="from-date"
              showYearDropdown
              showMonthDropdown
              dropdownMode="select"
              popperPlacement="bottom"
              popperProps={{
                positionFixed: true,
              }}
            />
          </div>
          <div className="col-sm mb-3 d-flex gap-2 h-100 align-items-end">
            <button
              type="button"
              className="btn btn-dark"
              style={{ whiteSpace: "nowrap" }}
              onClick={handleFilter}
            >
              Apply Filter
            </button>
            <button
              className="btn btn-light border"
              style={{ whiteSpace: "nowrap" }}
              onClick={handleClearFilter}
            >
              Clear Filter
            </button>
          </div>
          <div className="col-sm mb-3">
            <label htmlFor="search" className="form-label invisible">
              Search
            </label>
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
                      filterColumn === "product_id" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("product_id")}
                  >
                    Product ID
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "sales_invoice_id" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("sales_invoice_id")}
                  >
                    Sales Invoice
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "product_name" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("product_name")}
                  >
                    Product Name
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "quantity" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("quantity")}
                  >
                    Quantity
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "unit_price" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("unit_price")}
                  >
                    Unit Price
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "packaging" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("packaging")}
                  >
                    Packaging
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "payment" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("payment")}
                  >
                    Payment
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "amount" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("amount")}
                  >
                    Amount
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "discount" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("discount")}
                  >
                    Discount
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
      </div>
      {/* Table */}
      <div className="container-fluid mt-1">
        <div className="table-responsive">
          <table className="table">
            <thead className="bg-light">
              <tr>
                <th
                  className="text-muted text-center"
                  style={{
                    backgroundColor: "#EBEFF4",
                    cursor: "pointer",
                    padding: "0.3rem 0.5rem",
                    whiteSpace: "nowrap",
                    fontSize: "12px",
                  }}
                >
                  <div className="d-flex flex-row align-items-center justify-content-center">
                    PRODUCT ID
                    <span className="d-flex flex-column mx-2">
                      <i
                        className={`fa-solid fa-chevron-up ${
                          sortColumn === "productCode" && !isSortedAsc
                            ? "text-danger"
                            : ""
                        }`}
                        style={{ fontSize: 8 }}
                      ></i>
                      <i
                        className={`fa-solid fa-chevron-down ${
                          sortColumn === "productCode" && isSortedAsc
                            ? "text-danger"
                            : ""
                        }`}
                        style={{ fontSize: 8 }}
                      ></i>
                    </span>
                  </div>
                </th>
                <th
                  className="text-muted text-center"
                  style={{
                    backgroundColor: "#EBEFF4",
                    cursor: "pointer",
                    padding: "0.3rem 0.5rem",
                    whiteSpace: "nowrap",
                    fontSize: "12px",
                  }}
                >
                  <div className="d-flex flex-row align-items-center justify-content-center">
                    SALES INVOICE
                    <span className="d-flex flex-column mx-2">
                      <i
                        className={`fa-solid fa-chevron-up ${
                          sortColumn === "salesInvoiceId" && !isSortedAsc
                            ? "text-danger"
                            : ""
                        }`}
                        style={{ fontSize: 8 }}
                      ></i>
                      <i
                        className={`fa-solid fa-chevron-down ${
                          sortColumn === "salesInvoiceId" && isSortedAsc
                            ? "text-danger"
                            : ""
                        }`}
                        style={{ fontSize: 8 }}
                      ></i>
                    </span>
                  </div>
                </th>
                <th
                  className="text-muted text-center"
                  style={{
                    backgroundColor: "#EBEFF4",
                    cursor: "pointer",
                    padding: "0.3rem 0.5rem",
                    whiteSpace: "nowrap",
                    fontSize: "12px",
                  }}
                >
                  <div className="d-flex flex-row align-items-center justify-content-center">
                    PRODUCT NAME
                    <span className="d-flex flex-column mx-2">
                      <i
                        className={`fa-solid fa-chevron-up ${
                          sortColumn === "productName" && !isSortedAsc
                            ? "text-danger"
                            : ""
                        }`}
                        style={{ fontSize: 8 }}
                      ></i>
                      <i
                        className={`fa-solid fa-chevron-down ${
                          sortColumn === "productName" && isSortedAsc
                            ? "text-danger"
                            : ""
                        }`}
                        style={{ fontSize: 8 }}
                      ></i>
                    </span>
                  </div>
                </th>
                <th
                  className="text-muted text-center"
                  style={{
                    backgroundColor: "#EBEFF4",
                    cursor: "pointer",
                    padding: "0.3rem 0.5rem",
                    whiteSpace: "nowrap",
                    fontSize: "12px",
                  }}
                >
                  <div className="d-flex flex-row align-items-center justify-content-center">
                    QUANTITY
                    <span className="d-flex flex-column mx-2">
                      <i
                        className={`fa-solid fa-chevron-up ${
                          sortColumn === "quantity" && !isSortedAsc
                            ? "text-danger"
                            : ""
                        }`}
                        style={{ fontSize: 8 }}
                      ></i>
                      <i
                        className={`fa-solid fa-chevron-down ${
                          sortColumn === "quantity" && isSortedAsc
                            ? "text-danger"
                            : ""
                        }`}
                        style={{ fontSize: 8 }}
                      ></i>
                    </span>
                  </div>
                </th>
                <th
                  className={
                    roleType?.includes("Management")
                      ? "text-muted text-center"
                      : "d-none"
                  }
                  style={{
                    backgroundColor: "#EBEFF4",
                    cursor: "pointer",
                    padding: "0.3rem 0.5rem",
                    whiteSpace: "nowrap",
                    fontSize: "12px",
                  }}
                >
                  <div className="d-flex flex-row align-items-center justify-content-center">
                    UNIT PRICE
                    <span className="d-flex flex-column mx-2">
                      <i
                        className={`fa-solid fa-chevron-up ${
                          sortColumn === "unitPrice" && !isSortedAsc
                            ? "text-danger"
                            : ""
                        }`}
                        style={{ fontSize: 8 }}
                      ></i>
                      <i
                        className={`fa-solid fa-chevron-down ${
                          sortColumn === "unitPrice" && isSortedAsc
                            ? "text-danger"
                            : ""
                        }`}
                        style={{ fontSize: 8 }}
                      ></i>
                    </span>
                  </div>
                </th>
                <th
                  className="text-muted text-center"
                  style={{
                    backgroundColor: "#EBEFF4",
                    cursor: "pointer",
                    padding: "0.3rem 0.5rem",
                    whiteSpace: "nowrap",
                    fontSize: "12px",
                  }}
                >
                  <div className="d-flex flex-row align-items-center justify-content-center">
                    PACKAGING
                    <span className="d-flex flex-column mx-2">
                      <i
                        className={`fa-solid fa-chevron-up ${
                          sortColumn === "packaging" && !isSortedAsc
                            ? "text-danger"
                            : ""
                        }`}
                        style={{ fontSize: 8 }}
                      ></i>
                      <i
                        className={`fa-solid fa-chevron-down ${
                          sortColumn === "packaging" && isSortedAsc
                            ? "text-danger"
                            : ""
                        }`}
                        style={{ fontSize: 8 }}
                      ></i>
                    </span>
                  </div>
                </th>
                <th
                  className="text-muted text-center"
                  style={{
                    backgroundColor: "#EBEFF4",
                    cursor: "pointer",
                    padding: "0.3rem 0.5rem",
                    whiteSpace: "nowrap",
                    fontSize: "12px",
                  }}
                >
                  <div className="d-flex flex-row align-items-center justify-content-center">
                    PAYMENT
                  </div>
                </th>
                <th
                  className={
                    roleType?.includes("Management")
                      ? "text-muted text-center"
                      : "d-none"
                  }
                  style={{
                    backgroundColor: "#EBEFF4",
                    cursor: "pointer",
                    padding: "0.3rem 0.5rem",
                    whiteSpace: "nowrap",
                    fontSize: "12px",
                  }}
                >
                  <div className="d-flex flex-row align-items-center justify-content-center">
                    AMOUNT
                    <span className="d-flex flex-column mx-2">
                      <i
                        className={`fa-solid fa-chevron-up ${
                          sortColumn === "subtotal" && !isSortedAsc
                            ? "text-danger"
                            : ""
                        }`}
                        style={{ fontSize: 8 }}
                      ></i>
                      <i
                        className={`fa-solid fa-chevron-down ${
                          sortColumn === "subtotal" && isSortedAsc
                            ? "text-danger"
                            : ""
                        }`}
                        style={{ fontSize: 8 }}
                      ></i>
                    </span>
                  </div>
                </th>
                <th
                  className="text-muted text-center"
                  style={{
                    backgroundColor: "#EBEFF4",
                    cursor: "pointer",
                    padding: "0.3rem 0.5rem",
                    whiteSpace: "nowrap",
                    fontSize: "12px",
                  }}
                >
                  <div className="d-flex flex-row align-items-center justify-content-center">
                    DISCOUNT
                  </div>
                </th>
                <th
                  className="text-muted text-center"
                  style={{
                    backgroundColor: "#EBEFF4",
                    cursor: "pointer",
                    padding: "0.3rem 0.5rem",
                    whiteSpace: "nowrap",
                    fontSize: "12px",
                  }}
                >
                  <div className="d-flex flex-row align-items-center justify-content-center">
                    DATE
                    <span className="d-flex flex-column mx-2">
                      <i
                        className={`fa-solid fa-chevron-up ${
                          sortColumn === "subtotal" && !isSortedAsc
                            ? "text-danger"
                            : ""
                        }`}
                        style={{ fontSize: 8 }}
                      ></i>
                      <i
                        className={`fa-solid fa-chevron-down ${
                          sortColumn === "subtotal" && isSortedAsc
                            ? "text-danger"
                            : ""
                        }`}
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
                  <td colSpan="10" className="text-center">
                    Loading...
                  </td>
                </tr>
              ) : pagination.error ? (
                <tr>
                  <td colSpan="10" className="text-center">
                    {pagination.error.status === 404 ? (
                      <div className="text-muted py-3">
                        No purchase history found for this customer
                      </div>
                    ) : (
                      <div className="text-danger py-3">
                        <i className="bx bx-error-alt fs-1 d-block mb-2"></i>
                        {pagination.error.message}
                      </div>
                    )}
                  </td>
                </tr>
              ) : pagination.data.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center">
                    <div className="text-muted py-3">
                      No purchase history available
                    </div>
                  </td>
                </tr>
              ) : (
                pagination.data.flatMap((item) =>
                  item.products.map((product, productIndex) => (
                    <tr key={`${item.id}-${product.productId}-${productIndex}`}>
                      <td className="text-center">{product.productCode}</td>
                      <td className="text-center">{item.transaction_id}</td>
                      <td className="text-center">{product.productName}</td>
                      <td className="text-center">{product.quantity}</td>
                      <td
                        className={
                          roleType?.includes("Management")
                            ? "text-center"
                            : "d-none"
                        }
                      >
                        {product.unitPrice.toFixed(2)}
                      </td>
                      <td className="text-center">{product.packaging}</td>
                      <td className="text-center">{item.paymentTerms}</td>
                      <td
                        className={
                          roleType?.includes("Management")
                            ? "text-center"
                            : "d-none"
                        }
                      >
                        {product.subtotal.toFixed(2)}
                      </td>
                      <td className="text-center">{product.discount}</td>
                      <td className="text-center">
                        {dateTimeFormat(item.createdAt)}
                      </td>
                    </tr>
                  ))
                )
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination controls */}
        <PaginationControls {...pagination} />
      </div>
    </div>
  );
};

export default CustomerPurchaseHistory;
