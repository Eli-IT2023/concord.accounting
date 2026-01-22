import { React, useState } from "react";
import { PaginationControls } from "../../../hooks/customHook/paginationHook/usePagination"; // Import our custom hook and component
import { useServerPagination } from "../../../hooks/customHook/paginationHook/useServerPagination"; // Import our custom hook and component
import { useNavigate, useParams } from "react-router-dom"; // Import the useNavigate hook
import BASE_URL from "../../../assets/global/url";

import { useSort } from "../../../hooks/customHook/tableSort"; // adjust path accordingly

// for rbac
import NoAccess from "../../../assets/img/NoAccess.png";
import { ThreeDot } from "react-loading-indicators";

const TaxSettings = ({ authrztn, roleType, rbacUserRole }) => {
  const navigate = useNavigate(); // Initialize the useNavigate hook
  const [isLoading, setIsLoading] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");

  const [paginationUrl, setPaginationUrl] = useState(
    BASE_URL + "/tax_settings/getTaxSettings",
  );

  const pagination = useServerPagination(paginationUrl, 10);

  const { isSortedAsc, sortColumn, toggleSort } = useSort(
    "name",
    false,
    paginationUrl,
  );

  const handleSortData = (column) => {
    toggleSort(column, (params) => {
      setPaginationUrl(params.url);
      pagination.updateParams({
        sortType: params.sortType,
        sortDBTableColumn: params.sortDBTableColumn,
      });
    });
  };

  // const clearDataInputs = () => {
  //   setShow(false);
  //   setSpecificationName("");
  //   setDescription("");
  //   setStatus("Active");
  //   setValidated(false);
  //   setforEditPrimary("");
  //   setFilterStatus("Active");
  //   setFilterDateCreated("");
  //   setSearchText("");
  //   setFilterColumn("all");
  // };

  const handleSearch = (value) => {
    setSearchText(value);
    if (value === "") {
      setPaginationUrl(BASE_URL + "/tax_settings/getTaxSettings");
      pagination.updateParams({}); // Reset the filter when search text is empty
    } else {
      setPaginationUrl(BASE_URL + "/tax_settings/getTaxSettingsBySearch");
      pagination.updateParams({
        searchText: value,
        filterColumn,
      });
    }
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
      ) : authrztn.includes("TaxSettings-View") ? (
        <>
          <div className="w-100 d-flex flex-row justify-content-between align-items-center p-3">
            <h4 className="m-0">TAX RULES</h4>
            <button
              onClick={() =>
                navigate("/tax-management/tax-settings-add/create")
              }
              className="btn btn-primary d-flex align-items-center gap-1"
            >
              <i className="bx bx-plus"></i> Add Tax Rule
            </button>
          </div>

          <div className="p-3">
            <div className="row g-3 align-items-end">
              <div className="col-md ms-auto">
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
                          filterColumn === "name" ? "active" : ""
                        }`}
                        onClick={() => setFilterColumn("name")}
                      >
                        Tax Name
                      </button>
                    </li>
                    <li>
                      <button
                        className={`dropdown-item ${
                          filterColumn === "rate" ? "active" : ""
                        }`}
                        onClick={() => setFilterColumn("rate")}
                      >
                        Rate
                      </button>
                    </li>
                    <li>
                      <button
                        className={`dropdown-item ${
                          filterColumn === "threshold_amount" ? "active" : ""
                        }`}
                        onClick={() => setFilterColumn("threshold_amount")}
                      >
                        Threshold Amount
                      </button>
                    </li>
                    <li>
                      <button
                        className={`dropdown-item ${
                          filterColumn === "applicability" ? "active" : ""
                        }`}
                        onClick={() => setFilterColumn("applicability")}
                      >
                        Applicability
                      </button>
                    </li>
                    <li>
                      <button
                        className={`dropdown-item ${
                          filterColumn === "transaction_type" ? "active" : ""
                        }`}
                        onClick={() => setFilterColumn("transaction_type")}
                      >
                        Transaction Type
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Table  */}
          <div className="p-3">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="bg-light">
                  <tr>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#EBEFF4", cursor: "pointer" }}
                      onClick={() => handleSortData("name")}
                    >
                      <div className="d-flex flex-row justify-content-center justify-content-center">
                        TAX NAME
                        <span className="d-flex flex-column mx-2">
                          <i
                            className={`fa-solid fa-chevron-up ${
                              sortColumn === "name" && !isSortedAsc
                                ? "text-danger"
                                : ""
                            }`}
                            style={{ fontSize: 10 }}
                          ></i>
                          <i
                            className={`fa-solid fa-chevron-down ${
                              sortColumn === "name" && isSortedAsc
                                ? "text-danger"
                                : ""
                            }`}
                            style={{ fontSize: 10 }}
                          ></i>
                        </span>
                      </div>
                    </th>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#EBEFF4", cursor: "pointer" }}
                      onClick={() => handleSortData("rate")}
                    >
                      <div className="d-flex flex-row justify-content-center justify-content-center">
                        RATE (%)
                        <span className="d-flex flex-column mx-2">
                          <i
                            className={`fa-solid fa-chevron-up ${
                              sortColumn === "rate" && !isSortedAsc
                                ? "text-danger"
                                : ""
                            }`}
                            style={{ fontSize: 10 }}
                          ></i>
                          <i
                            className={`fa-solid fa-chevron-down ${
                              sortColumn === "rate" && isSortedAsc
                                ? "text-danger"
                                : ""
                            }`}
                            style={{ fontSize: 10 }}
                          ></i>
                        </span>
                      </div>
                    </th>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#EBEFF4", cursor: "pointer" }}
                      onClick={() => handleSortData("threshold_amount")}
                    >
                      <div className="d-flex flex-row justify-content-center">
                        THRESHOLD AMOUNT
                        <span className="d-flex flex-column mx-2">
                          <i
                            className={`fa-solid fa-chevron-up ${
                              sortColumn === "threshold_amount" && !isSortedAsc
                                ? "text-danger"
                                : ""
                            }`}
                            style={{ fontSize: 10 }}
                          ></i>
                          <i
                            className={`fa-solid fa-chevron-down ${
                              sortColumn === "threshold_amount" && isSortedAsc
                                ? "text-danger"
                                : ""
                            }`}
                            style={{ fontSize: 10 }}
                          ></i>
                        </span>
                      </div>
                    </th>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#EBEFF4", cursor: "pointer" }}
                      onClick={() => handleSortData("applicability")}
                    >
                      <div className="d-flex flex-row justify-content-center">
                        APPLICABILITY
                        <span className="d-flex flex-column mx-2">
                          <i
                            className={`fa-solid fa-chevron-up ${
                              sortColumn === "applicability" && !isSortedAsc
                                ? "text-danger"
                                : ""
                            }`}
                            style={{ fontSize: 10 }}
                          ></i>
                          <i
                            className={`fa-solid fa-chevron-down ${
                              sortColumn === "applicability" && isSortedAsc
                                ? "text-danger"
                                : ""
                            }`}
                            style={{ fontSize: 10 }}
                          ></i>
                        </span>
                      </div>
                    </th>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#EBEFF4", cursor: "pointer" }}
                      onClick={() => handleSortData("transaction_type")}
                    >
                      <div className="d-flex flex-row justify-content-center">
                        TRANSACTION TYPE
                        <span className="d-flex flex-column mx-2">
                          <i
                            className={`fa-solid fa-chevron-up ${
                              sortColumn === "transaction_type" && !isSortedAsc
                                ? "text-danger"
                                : ""
                            }`}
                            style={{ fontSize: 10 }}
                          ></i>
                          <i
                            className={`fa-solid fa-chevron-down ${
                              sortColumn === "transaction_type" && isSortedAsc
                                ? "text-danger"
                                : ""
                            }`}
                            style={{ fontSize: 10 }}
                          ></i>
                        </span>
                      </div>
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
                      <td colSpan="5" className="text-center text-danger">
                        Error loading data
                      </td>
                    </tr>
                  ) : pagination.data.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center">
                        No data available
                      </td>
                    </tr>
                  ) : (
                    pagination.data.map((item) => (
                      <tr
                        onClick={() =>
                          navigate(
                            `/tax-management/tax-settings-add/${item.id}`,
                          )
                        }
                        style={{ cursor: "pointer" }}
                        key={item.id}
                      >
                        <td
                          className="text-center"
                          style={{ maxWidth: "300px" }}
                        >
                          {item.name}
                        </td>
                        <td className="text-center">{item.rate}</td>
                        <td className="text-center">{item.threshold_amount}</td>
                        <td className="text-center">{item.applicability}</td>
                        <td className="text-center">{item.transaction_type}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Use the pagination controls with server pagination */}
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

export default TaxSettings;
