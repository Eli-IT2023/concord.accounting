import { React, useState, useEffect } from "react";
import { Form } from "react-bootstrap";
import axios from "axios";
import swal from "sweetalert";
import { Modal, Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { PaginationControls } from "../../hooks/customHook/paginationHook/usePagination"; // Import our custom hook and component
import { useServerPagination } from "../../hooks/customHook/paginationHook/useServerPagination"; // Import our custom hook and component

import BASE_URL from "../../assets/global/url";
import useDecodeToken from "../../hooks/customHook/useDecodeToken";

import NoAccess from "../../assets/img/NoAccess.png";
import { ThreeDot } from "react-loading-indicators";

import "../../assets/css/lionchem.css";

const Purchase_request = ({ authrztn }) => {
  // ### resets ###
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  // ### reset ends ###

  // ##### table #####
  const [paginationUrl, setPaginationUrl] = useState(
    BASE_URL + "/PurchaseRequest/fetchData"
  );
  const pagination = useServerPagination(paginationUrl, 10);
  // ##### table end #####

  // ### Filter ###
  const [searchText, setSearchText] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");

  const [filterStatus, setFilterStatus] = useState("All");

  const clearDataInputs = () => {
    setFilterStatus("All");
    setSearchText("");
  };

  const handleFilter = () => {
    setPaginationUrl(BASE_URL + "/PurchaseRequest/fetchFilteredData");
    pagination.updateParams({ filterStatus }); // method use to pass to the router
  };

  const handleClearFilter = () => {
    setPaginationUrl(BASE_URL + "/PurchaseRequest/fetchData");
    pagination.updateParams({});
    clearDataInputs();
  };

  const handleSearch = (value) => {
    setSearchText(value);
    if (value === "") {
      setPaginationUrl(BASE_URL + "/PurchaseRequest/fetchData");
      pagination.updateParams({}); // Reset the filter when search text is empty
    } else {
      setPaginationUrl(BASE_URL + "/PurchaseRequest/fetchSearchData");
      pagination.updateParams({
        searchText: value,
        filterColumn,
        filterStatus,
      });
    }
  };

  const reloadTable = async () => {
    setIsLoading(true);

    try {
      setPaginationUrl(`${BASE_URL}/PurchaseRequest/fetchData`);
      await pagination.refreshData();
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    reloadTable();
  }, []);

  // ### Filter end ###

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
      ) : authrztn.includes("PurchaseRequest-View") ? (
        <>
          <div className="w-100 p-2 d-flex flex-row justify-content-between">
            <div className="d-flex flex-column title-custom">
              <span className="fs-3">PURCHASE REQUEST</span>
              {/* <span>PRODUCT LIST PACKAGING TYPES</span> */}
            </div>

            <div>
              {authrztn.includes("PurchaseRequest-Add") && (
                <button
                  onClick={() => navigate("/purchases/create-purchase-request")}
                  className="btn btn-primary d-flex align-items-center title-button"
                >
                  <i className="bx bx-plus fs-5"></i> Create
                </button>
              )}
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
                  <option selected disabled value="">
                    Select Status
                  </option>
                  <option value="All">All</option>
                  <option value="For-Approval">For-Approval</option>
                  <option value="For-PO">For-PO</option>
                  <option value="Declined">Declined</option>
                </select>
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
                          filterColumn === "requestor" ? "active" : ""
                        }`}
                        onClick={() => setFilterColumn("requestor")}
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

          <div className="container-fluid mt-5 ">
            <div className="table-responsive data-table scrollable-contents">
              <table
                className="table table-hover table-responsive "
                id="purchaseRequestTable"
              >
                <thead className="bg-light">
                  <tr>
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
                      REQUEST TITLE
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
                      <td colSpan="5" className="text-center">
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
                        No data available
                      </td>
                    </tr>
                  ) : (
                    pagination.data.map((item) => (
                      <tr
                        key={item.id}
                        style={{ cursor: "pointer" }}
                        onClick={() =>
                          navigate(
                            item.status === "For-PO" ||
                              item.status === "Completed"
                              ? `/purchases/view-purchase-request/${item.id}`
                              : `/purchases/update-purchase-request/${item.id}`
                          )
                        }
                      >
                        <td>{item.pr_no}</td>
                        <td>{item.request_name}</td>
                        <td>{item.requestor.full_name}</td>
                        <td>
                          {new Date(item.date_needed).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "2-digit",
                            }
                          )}
                        </td>
                        <td style={{ maxWidth: "400px" }}>
                          {item.remarks ? item.remarks : "--"}
                        </td>
                        <td>
                          <span
                            className="py-2 px-3 rounded"
                            style={{
                              backgroundColor:
                                item.status === "For-Approval"
                                  ? "#FFF6E6"
                                  : item.status === "Declined"
                                  ? "#FFF4F4"
                                  : item.status === "For-PO"
                                  ? "#E4F0FF"
                                  : item.status === "Completed"
                                  ? "#F0FFF0"
                                  : "#E4F0FF",
                              color:
                                item.status === "For-Approval"
                                  ? "#FF9500"
                                  : item.status === "Declined"
                                  ? "#EE5B5B"
                                  : item.status === "For-PO"
                                  ? "#3D96FF"
                                  : item.status === "Completed"
                                  ? "#34C759"
                                  : "#3D96FF",
                              whiteSpace: "nowrap",
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

export default Purchase_request;
