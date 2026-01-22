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

// for rbac
import NoAccess from "../../assets/img/NoAccess.png";
import { ThreeDot } from "react-loading-indicators";

const ReturnProducts = ({ authrztn, roleType, rbacUserRole }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [enableEdit, setEnableEdit] = useState(false);
  const [isRowForApproval, setIsRowForApproval] = useState(false);

  // Dummy data for filters
  const [filterApprover, setFilterApprover] = useState("");
  const [filterRequestor, setFilterRequestor] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [searchText, setSearchText] = useState("");
  const [searchField, setSearchField] = useState("all");
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

  // Dummy handlers
  const handleFilter = () => {
    setPaginationUrl(`${BASE_URL}/ReturnProduct/fetchFiltered`);
    pagination.updateParams({
      filterStatus,
      filterColumn,
    });
  };

  const handleClearFilter = () => {
    setFilterApprover("");
    setFilterRequestor("");
    setFilterStatus("");
    setSearchText("");
    setSearchField("all");
    setPaginationUrl(BASE_URL + "/ReturnProduct/fetchData");
    pagination.updateParams({});
  };

  const searchFieldOptions = {
    all: "All Fields",
    return_product_code: "Return Product Code",
    title: "Return Name",
    requestor: "Requestor",
    approver: "Approver",
    date_created: "Date Created",
  };

  const handleSearchCategoryChange = (category) => {
    setSearchField(category);
    updateSearchParams(searchText, category);
  };

  const handleSearch = (value) => {
    setSearchText(value);
    if (value.trim() === "") {
      setPaginationUrl(BASE_URL + "/ReturnProduct/fetchData");
      pagination.updateParams({});
    } else {
      updateSearchParams(value, searchField);
    }
  };

  const updateSearchParams = (text, category) => {
    setPaginationUrl(BASE_URL + "/ReturnProduct/fetchSearch");

    const params = {
      searchText: text,
    };

    if (category && category !== "all") {
      params.searchField = category;
    }

    if (category === "all") {
      params.searchField = undefined;
    }

    pagination.updateParams(params);
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
    console.log(filterStatus, "THIS IS FILTER STATUS");
  }, [filterStatus]);
  // ##### table #####
  const [paginationUrl, setPaginationUrl] = useState(
    BASE_URL + "/ReturnProduct/fetchData",
  );
  const pagination = useServerPagination(paginationUrl, 10);
  // ##### table end #####

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
      ) : authrztn.includes("ReturnProduct-View") ? (
        <>
          <div className="w-100 p-2 d-flex flex-row justify-content-between align-items-center mb-5">
            <div className="d-flex flex-column title-custom">
              <span className="fs-3">RETURN PRODUCTS</span>
            </div>

            <div className="d-flex flex-row align-items-center justify-content-center gap-2">
              <button
                onClick={() =>
                  navigate("/delivery-management/return-product-details")
                }
                className="btn btn-primary d-flex align-items-center title-button"
              >
                Request Return
              </button>
            </div>
          </div>
          <div className="container-fluid ">
            <div className="row align-items-end">
              <div className="col-sm mb-3">
                <label htmlFor="status">Status</label>
                <select
                  name="status"
                  id="status"
                  className="form-select"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">Select Status</option>
                  {["To Review", "Approved", "Transferred", "Disposed"].map(
                    (status, index) => (
                      <option key={index} value={status}>
                        {status}
                      </option>
                    ),
                  )}
                </select>
              </div>
              <div className="col-sm mb-3 d-flex align-items-end gap-2">
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
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder={`Search by ${searchFieldOptions[
                      searchField
                    ].toLowerCase()}`}
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
                    {Object.entries(searchFieldOptions).map(([key, value]) => (
                      <li key={key}>
                        <button
                          className={`dropdown-item ${
                            searchField === key ? "active" : ""
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
          {/* New Table */}
          <div className="container-fluid mt-1">
            <div className="table-responsive">
              <table className="table table-hover" id="returnProductTable">
                <thead className="bg-light">
                  <tr>
                    <th
                      className="text-muted"
                      style={{
                        backgroundColor: "#EBEFF4",
                        cursor: "pointer",
                        padding: "0.3rem 0.5rem",
                        whiteSpace: "nowrap",
                        fontSize: "12px",
                      }}
                    >
                      <div className="d-flex flex-row align-items-center ">
                        RETURN PRODUCT CODE
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
                        fontSize: "12px",
                      }}
                    >
                      <div className="d-flex flex-row align-items-center ">
                        RETURN NAME
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
                        fontSize: "12px",
                      }}
                    >
                      <div className="d-flex flex-row align-items-center">
                        WEIGHT TO BE RETURNED (KG/s)
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
                        fontSize: "12px",
                      }}
                    >
                      <div className="d-flex flex-row align-items-center">
                        DATE CREATED
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
                        fontSize: "12px",
                      }}
                    >
                      <div className="d-flex flex-row align-items-center">
                        REQUESTOR
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
                        fontSize: "12px",
                      }}
                    >
                      <div className="d-flex flex-row align-items-center">
                        APPROVER
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
                        fontSize: "12px",
                      }}
                    >
                      <div className="d-flex flex-row align-items-center justify-content-center">
                        STATUS
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
                      <td colSpan="7" className="text-center">
                        Loading...
                      </td>
                    </tr>
                  ) : pagination.error ? (
                    <tr>
                      <td colSpan="7" className="text-center text-danger">
                        Error loading data
                      </td>
                    </tr>
                  ) : pagination.data.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center">
                        No data available
                      </td>
                    </tr>
                  ) : (
                    pagination.data.map((item) => {
                      const requestor = item.rp_created_by;
                      const requestorName =
                        requestor?.fname && requestor?.lname
                          ? `${requestor.fname} ${requestor.lname}`
                          : "---";

                      const approver = item.rp_approved_by;
                      const approverName =
                        approver?.fname && approver?.lname
                          ? `${approver.fname} ${approver.lname}`
                          : "---";

                      const reject = item.rp_rejected_by;
                      const rejectName =
                        reject?.fname && reject?.lname
                          ? `${reject.fname} ${reject.lname}`
                          : "---";

                      const closed = item.rp_closed_by;
                      const closedName =
                        closed?.fname && closed?.lname
                          ? `${closed.fname} ${closed.lname}`
                          : "---";

                      const dateCreated = item?.createdAt
                        ? new Date(item.createdAt)
                            .toLocaleString("en-US", {
                              month: "short",
                              day: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })
                            .replace(/,([^,]*)$/, " -$1")
                        : "---";
                      return (
                        <tr
                          key={item.id}
                          style={{ cursor: "pointer" }}
                          onClick={() =>
                            navigate(
                              `/delivery-management/update-return-product-details/${item.id}`,
                            )
                          }
                        >
                          <td>{item.return_product_code}</td>
                          <td>{item.title}</td>
                          <td>{(item.total_weight || 0).toLocaleString()}</td>
                          <td>{dateCreated}</td>

                          <td>{requestorName}</td>
                          <td>{approverName}</td>
                          <td className="text-center" style={{ fontSize: 13 }}>
                            <span
                              style={{
                                padding: "0.3rem 1.5rem",
                                whiteSpace: "nowrap",
                              }}
                              className={` rounded-pill  ${
                                item.status === "To Review"
                                  ? "border border-primary text-primary"
                                  : item.status === "Approved"
                                    ? "bg-primary text-white"
                                    : item.status === "Closed"
                                      ? "border bg-success border-success text-white"
                                      : item.status === "Declined"
                                        ? "border border-danger text-danger"
                                        : "text-muted"
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {!pagination.loading &&
              !pagination.error &&
              pagination.data.length > 0 && (
                <PaginationControls {...pagination} />
              )}
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

export default ReturnProducts;
