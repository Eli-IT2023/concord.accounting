import { React, useState, useEffect } from "react";
import { Form } from "react-bootstrap";
import axios from "axios";
import swal from "sweetalert";
import { Modal, Button } from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";
import { PaginationControls } from "../../hooks/customHook/paginationHook/usePagination"; // Import our custom hook and component
import { useServerPagination } from "../../hooks/customHook/paginationHook/useServerPagination"; // Import our custom hook and component
import DatePicker from "react-datepicker";
import CustomDatePickerInput from "../../utils/CustomerDateInput";
import "../../assets/css/style.css";

import BASE_URL from "../../assets/global/url";
import useDecodeToken from "../../hooks/customHook/useDecodeToken";
import { useSort } from "../../hooks/customHook/tableSort"; // adjust path accordingly

import "../../assets/css/lionchem.css";

// for rbac
import NoAccess from "../../assets/img/NoAccess.png";
import { ThreeDot } from "react-loading-indicators";

const SampleProduct = ({ authrztn, roleType, rbacUserRole }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // ##### filter #####
  const [searchText, setSearchText] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");

  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDateCreated, setFilterDateCreated] = useState("");

  // ##### table #####
  const [paginationUrl, setPaginationUrl] = useState(
    BASE_URL + "/SampleProduct/fetchData",
  );
  const pagination = useServerPagination(paginationUrl, 10);
  // ##### table end #####

  const handleFilter = () => {
    setPaginationUrl(BASE_URL + "/SampleProduct/fetchFilteredData");
    pagination.updateParams({ filterStatus, filterDateCreated });
  };

  const handleClearFilter = () => {
    setPaginationUrl(BASE_URL + "/SampleProduct/fetchData");
    pagination.updateParams({});
    clearDataInputs();
  };

  const handleSearch = (value) => {
    setSearchText(value);
    if (value === "") {
      setPaginationUrl(BASE_URL + "/SampleProduct/fetchData");
      pagination.updateParams({});
    } else {
      setPaginationUrl(BASE_URL + "/SampleProduct/fetchSearchData");
      pagination.updateParams({
        searchText: value,
        filterColumn: filterColumn || "all", // Ensure default value
        filterStatus: filterStatus || "All", // Ensure default value
      });
    }
  };
  // ##### filter end #####

  const clearDataInputs = () => {
    setSearchText("");
    setFilterColumn("all");
    setFilterStatus("All");
    setFilterDateCreated("");
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
      ) : authrztn.includes("SampleProduct-View") ? (
        <>
          <div className="w-100 p-2 d-flex flex-row justify-content-between">
            <div className="d-flex flex-column title-custom">
              <span className="fs-3">SAMPLE PRODUCTS</span>
              <span>PRODUCT LIST SAMPLE PRODUCTS</span>
            </div>

            <div>
              <button
                onClick={() => navigate(`../sales/create-sample-product`)}
                className="btn btn-primary d-flex align-items-center title-button"
              >
                <i className="bx bx-plus fs-5"></i> Create
              </button>
            </div>
          </div>

          <div className="container-fluid mt-3">
            <div className="row g-3 align-items-end">
              <div className="col-md-3">
                <label className="form-label">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="form-select"
                >
                  <option disabled value="">
                    Select Status
                  </option>
                  <option value="All">All</option>
                  <option value="For-Approval">For-Approval</option>
                  <option value="Approved">Approved</option>
                  <option value="In-Preparation">In-Preparation</option>
                  <option value="Dispatched">Dispatched</option>
                  <option value="Received">Received</option>
                  <option value="Declined">Declined</option>
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label">Date Created</label>
                {/* <input
              value={filterDateCreated}
              onChange={(e) => setFilterDateCreated(e.target.value)}
              type="date"
              className="form-control"
              placeholder="MM/DD/YYYY"
            /> */}
                <DatePicker
                  selected={filterDateCreated}
                  onChange={(date) => setFilterDateCreated(date)}
                  dateFormat="MMM dd, yyyy"
                  placeholderText="Select date"
                  customInput={<CustomDatePickerInput />}
                  showYearDropdown
                  showMonthDropdown
                  dropdownMode="select"
                  popperPlacement="bottom"
                  popperProps={{
                    positionFixed: true,
                  }}
                />
              </div>

              <div className="col-auto ">
                <button
                  onClick={handleFilter}
                  type="button"
                  className="btn btn-dark"
                >
                  Apply Filter
                </button>
              </div>

              <div className="col-auto ">
                <button
                  onClick={handleClearFilter}
                  className="btn btn-light border"
                >
                  Clear Filter
                </button>
              </div>

              <div className="col-md-3 ms-auto">
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
                          filterColumn === "packaging_name" ? "active" : ""
                        }`}
                        onClick={() => setFilterColumn("packaging_name")}
                      >
                        Type
                      </button>
                    </li>
                    <li>
                      <button
                        className={`dropdown-item ${
                          filterColumn === "description" ? "active" : ""
                        }`}
                        onClick={() => setFilterColumn("description")}
                      >
                        Description
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="container-fluid mt-5 ">
            <div className="table-responsive data-table scrollable-contents">
              <table className="table table-hover table-responsive " id="">
                <thead className="bg-light">
                  <tr>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      CUSTOMER
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
                      APPROVER
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      PREPARED BY
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      DISPATCHED BY
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
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
                      DATE REQUESTED
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
                    pagination.data.map((item) => {
                      const requestor = item.sp_requested_by;
                      const requestorName =
                        requestor?.fname && requestor?.lname
                          ? `${requestor.fname} ${requestor.lname}`
                          : "---";

                      const approver = item.sp_approved_by;
                      const approverName =
                        approver?.fname && approver?.lname
                          ? `${approver.fname} ${approver.lname}`
                          : "---";

                      const prepare = item.sp_prepared_by;
                      const prepareName =
                        prepare?.fname && prepare?.lname
                          ? `${prepare.fname} ${prepare.lname}`
                          : "---";

                      const dispatch = item.sp_dispatched_by;
                      const dispatchName =
                        dispatch?.fname && dispatch?.lname
                          ? `${dispatch.fname} ${dispatch.lname}`
                          : "---";

                      const receiver = item.sp_received_by;
                      const receiverName =
                        receiver?.fname && receiver?.lname
                          ? `${receiver.fname} ${receiver.lname}`
                          : "---";

                      return (
                        <tr
                          key={item.id}
                          style={{ cursor: "pointer" }}
                          onClick={() =>
                            navigate(`../sales/view-sample-product/${item.id}`)
                          }
                        >
                          <td>{item?.sp_customer_id?.company_name || "---"}</td>
                          <td>{requestorName}</td>
                          <td>{approverName}</td>
                          <td>{prepareName}</td>
                          <td>{dispatchName}</td>
                          <td>{receiverName}</td>
                          <td>
                            {new Date(item.createdAt)
                              .toLocaleString("en-US", {
                                month: "short",
                                day: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              })
                              .replace(/,([^,]*)$/, " -$1")}
                          </td>
                          <td>
                            <span
                              style={{
                                whiteSpace: "nowrap",
                              }}
                              className={`px-2 py-1 rounded-pill min-w-100 ${
                                item.status === "For-Approval"
                                  ? "border border-primary text-primary"
                                  : item.status === "Approved"
                                    ? "border border-success text-success"
                                    : item.status === "In-Preparation"
                                      ? "bg-primary text-white"
                                      : item.status === "Dispatched"
                                        ? "border border-warning text-warning"
                                        : item.status === "Received"
                                          ? "bg-success text-white"
                                          : item.status === "Declined"
                                            ? "bg-danger text-white"
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

export default SampleProduct;
